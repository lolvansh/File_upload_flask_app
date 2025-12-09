from importlib.resources import files
from flask import Flask,request,jsonify,make_response,send_from_directory
import mimetypes
from werkzeug.utils import secure_filename
import os
from datetime import datetime, timedelta, timezone
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv

import firebase_admin
from firebase_admin import credentials, auth, storage
from functools import wraps

import smtplib
from email.message import EmailMessage
import redis
import random

load_dotenv()

app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "DELETE", "OPTIONS"]}})


redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
try:
    redis_client = redis.from_url(redis_url, decode_responses=True)
    # Test connection immediately
    redis_client.ping()
    print("✅ Connected to Redis successfully")
except redis.ConnectionError:
    print("❌ WARNING: Could not connect to Redis. OTP features will fail.")


SMTP_EMAIL = os.environ.get("SMTP_EMAIL")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")


app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')

if not firebase_admin._apps:
    secret_file_path = "/etc/secrets/serviceAccountKey.json"
    if os.path.exists(secret_file_path):
        cred = credentials.Certificate(secret_file_path)
    else:
        cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred, {
        'storageBucket': os.environ.get('FIREBASE_STORAGE_BUCKET')  
})

BUCKET_NAME = os.environ.get('FIREBASE_STORAGE_BUCKET')


    

database_url = os.environ.get('DATABASE_URL')
if database_url:
    print(f"Database URL loaded successfully")
else:
    print("WARNING: DATABASE_URL not found in environment variables!")

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    firebase_uid = db.Column(db.String(128), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    files = db.relationship('UploadedFile', backref='owner', lazy=True)

class UploadedFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    saved_name = db.Column(db.String(100), nullable=False)
    original_name = db.Column(db.String(100), nullable=False)
    mimetype = db.Column(db.String(100), nullable=False)
    size = db.Column(db.Integer, nullable=False)
    upload_time = db.Column(db.DateTime, default= datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=True)
    note = db.Column(db.Text, nullable=True)

    
ALLOWED_MIMES = {"image/png", "image/jpeg"}
@app.route("/")
def hello():
    return "backend is running"

def firebase_auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"message": "Missing Authorization Header"}), 401
        
        try:
            token = auth_header.split(" ")[1]
            decoded_token = auth.verify_id_token(token, clock_skew_seconds=10)  # <-- ADD THIS
            firebase_uid = decoded_token['uid']
            current_user = User.query.filter_by(firebase_uid=firebase_uid).first()
            
            if not current_user:
                return jsonify({"message": "User not found in local DB. Please login first."}), 401

            request.current_user = current_user
            
        except Exception as e:
            print(f"Auth Error: {e}")
            return jsonify({"message": "Invalid or Expired Token"}), 401
            
        return f(*args, **kwargs)
    return decorated_function


@app.route("/api/send-otp", methods=["POST"])
def send_otp():
    # FIX: Properly retrieve JSON data
    data = request.get_json()
    email = data.get("email") if data else None
    
    if not email:
        return jsonify({"error": "Email required"}), 400
    
    try:
        auth.get_user_by_email(email)
        return jsonify({"error": "Email already registered"}), 400
    except:
        pass
    
    code = str(random.randint(100000, 999999))
    
    try:
        redis_client.setex(
            name=f"otp:{email}",
            time=300,
            value=code
        )
    except Exception as e:
        print(f"Redis error: {e}")
        return jsonify({"error": "Database error"}), 500
    
    try:
        msg = EmailMessage()
        msg.set_content(f"Your verification code is: {code}\n\nValid for 5 minutes.")
        msg["Subject"] = "Verification Code"
        msg["From"] = SMTP_EMAIL
        msg["To"] = email  # FIX: Was "TO" (uppercase O), should be "To"
        
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(SMTP_EMAIL, SMTP_PASSWORD)
            smtp.send_message(msg)
        
        return jsonify({"message": "OTP sent successfully"}), 200
    
    except Exception as e:
        print(f"Email error: {e}")
        return jsonify({"error": "Failed to send email"}), 500


@app.route("/api/verify-otp", methods=["POST"])
def verify_otp():
    email = request.json.get("email")
    user_otp = request.json.get("otp")
    
    if not email or not user_otp:
        return jsonify({"error": "Email and OTP required"}), 400
    
    # FIX: Redis already returns strings because decode_responses=True
    # No need to decode again
    stored_otp = redis_client.get(f"otp:{email}")
    
    if not stored_otp:
        return jsonify({"error": "OTP expired or not found"}), 400
    
    if stored_otp != user_otp:
        return jsonify({"error": "Invalid OTP"}), 400
    
    # OTP is valid, delete it
    redis_client.delete(f"otp:{email}")
    return jsonify({"message": "OTP verified successfully"}), 200


@app.route("/api/verify-user", methods=["POST", "OPTIONS"])
def verify_user():
    if request.method == "OPTIONS":
        return '', 200
    
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "Missing Authorization Header"}), 401
    
    try:
        token = auth_header.split(" ")[1]
        decoded_token = auth.verify_id_token(token, clock_skew_seconds=10)
        firebase_uid = decoded_token['uid']
        email = decoded_token.get('email')
        
        # FIX: Check by firebase_uid OR email to handle edge cases
        user = User.query.filter(
            (User.firebase_uid == firebase_uid) | (User.email == email)
        ).first()
        
        if not user:
            # Create new user
            user = User(firebase_uid=firebase_uid, email=email)
            db.session.add(user)
            db.session.commit()
        elif user.firebase_uid != firebase_uid:
            # Email exists but different firebase_uid - update it
            user.firebase_uid = firebase_uid
            db.session.commit()
        
        return jsonify({"message": "User verified", "email": email}), 200
        
    except Exception as e:
        print(f"Verification Error: {e}")
        db.session.rollback()  # Rollback on error
        return jsonify({"error": "Invalid token"}), 401
    

@app.route("/api/upload",methods=["POST","GET"])
@firebase_auth_required
def upload_file():
    # Access the user we found in the decorator
    current_user = request.current_user
    title = request.form.get("title")
    note = request.form.get("note")
    
    if not title or not title.strip():
        return jsonify({"error": "title required"}), 400
    
    if not note or not note.strip():
        return jsonify({"error": "note_required"}), 400
    
    if 'file' not in request.files:
        return jsonify({"error": "file_missing"}), 400

    file = request.files['file']
    if file.filename == "":
        return jsonify({"error": "no_file_selected"}), 400

    mime = file.mimetype
    if mime not in ALLOWED_MIMES:
        return jsonify({"error": "file_type_not_allowed"}), 415

    
    file.seek(0, 2)  # Move to end of file
    file_size = file.tell()  # Get position (= size)
    file.seek(0)  # Reset to beginning for upload
    # NOTE: This saves to LOCAL DISK (Ephemeral on Render)
    # We will fix this in the next step to upload to Firebase Storage
    safe_name = secure_filename(file.filename)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    storage_path = f"uploads/{current_user.id}/{timestamp}_{safe_name}"
    
    # Save to DB
    try:
        # 2. Upload to Firebase Storage
        bucket = storage.bucket(os.environ.get('FIREBASE_STORAGE_BUCKET'))
        blob = bucket.blob(storage_path)
        
        # Upload directly from the file stream (no local save needed!)
        blob.upload_from_file(file, content_type=file.mimetype)

        # 3. Save metadata to SQL DB
        # We store the file size (blob.size is only available after reload, so we can skip or estimate)
        new_file = UploadedFile(
            saved_name=storage_path, # We save the CLOUD path
            original_name=file.filename,
            mimetype=file.mimetype,
            size=file_size, # Optional: could get file.tell() before upload
            user_id=current_user.id,
            title=title.strip(),
            note=note.strip(),
        )
        
        db.session.add(new_file)
        db.session.commit()

        return jsonify({"message": "Uploaded successfully"}), 201

    except Exception as e:
        print(f"Upload failed: {e}")
        return jsonify({"error": "Cloud upload failed"}), 500     



    
    
@app.route("/api/delete/<int:id>", methods=["DELETE"])
@firebase_auth_required
def delete_file(id):
    current_user = request.current_user
    file_record = UploadedFile.query.get_or_404(id)

    # Security: Ensure user owns the file
    if file_record.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    try:
        # 1. Delete from Cloud
        bucket = storage.bucket(os.environ.get('FIREBASE_STORAGE_BUCKET'))
        blob = bucket.blob(file_record.saved_name)
        if blob.exists():
            blob.delete()
        
        # 2. Delete from DB
        db.session.delete(file_record)
        db.session.commit()
        
        return jsonify({"message": "Deleted"}), 200
    except Exception as e:
        return jsonify({"error": "Delete failed", "details": str(e)}), 500             


@app.route("/api/files", methods=["GET"])
@firebase_auth_required
def list_files():
    try:
        current_user = request.current_user
        
        # 1. Get Pagination Parameters from URL (sent by React)
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 6, type=int)
        
        # 2. Create the Base Query (Filter by User)
        query = UploadedFile.query.filter_by(user_id=current_user.id).order_by(UploadedFile.upload_time.desc())
        
        # 3. Apply Pagination (This replaces .all())
        # pagination object contains .items (current page) and .total (total count)
        pagination = query.paginate(page=page, per_page=limit, error_out=False)
        
        files = pagination.items
        total_files = pagination.total 

        bucket = storage.bucket(os.environ.get('FIREBASE_STORAGE_BUCKET'))
        results = []

        for f in files:
            blob = bucket.blob(f.saved_name)
            url = ""
            
            try:
                # Generate link valid for 1 hour
                url = blob.generate_signed_url(expiration=timedelta(hours=1))
            except Exception as e:
                print(f"Error generating URL for {f.saved_name}: {e}")
                # Fallback: send empty string or a placeholder if signing fails
                url = "" 

            results.append({
                "id": f.id,
                "name": f.original_name,
                "url": url,
                "type": f.mimetype,
                "size": f.size,
                "title": getattr(f, 'title', ''), # Safely get title (prevents crash if column missing)
                "note": getattr(f, 'note', ''),   # Safely get note
                "upload_time": f.upload_time.isoformat() 
            })

        # 4. Return the structure React expects
        return jsonify({
            "files": results,
            "total": total_files,  # <--- React needs this for "Page 1 of X"
            "limit": limit,
            "page": page
        })

    except Exception as e:
        # This print will show up in your Render Logs if it crashes
        print(f"❌ API CRASHED: {e}")
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    
    
@app.route("/api/update/<int:id>", methods=["PUT"])
@firebase_auth_required
def update_entry(id):
    current_user = request.current_user;
    file_record = UploadedFile.query.get_or_404(id)
    
    if file_record.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.get_json()
    
    if "title" in data:
        if not data['title'] or not data['title'].strip():
             return jsonify({"error": "title_cannot_be_empty"}), 400
        file_record.title = data['title'].strip()
         
    if 'note' in data:
        if not data['note'] or not data['note'].strip():
            return jsonify({"error": "note_cannot_be_empty"}), 400
        file_record.note = data['note'].strip()
    try:
        db.session.commit()
        return jsonify({"message": "Diary entry updated successfully"}), 200
    except Exception as e:
        print(f"Update failed: {e}")
        return jsonify({"error": "Update failed"}), 500
    
@app.route("/api/entry/<int:id>", methods=["GET"])
@firebase_auth_required
def get_entry(id):
    current_user = request.current_user
    file_record = UploadedFile.query.get_or_404(id)

    if file_record.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    try:
        bucket = storage.bucket(os.environ.get('FIREBASE_STORAGE_BUCKET'))
        blob = bucket.blob(file_record.saved_name)
        url = blob.generate_signed_url(expiration=timedelta(hours=1))
        
        return jsonify({
            "id": file_record.id,
            "name": file_record.original_name,
            "url": url,
            "type": file_record.mimetype,
            "size": file_record.size,
            "title": file_record.title,
            "note": file_record.note,
            "upload_time": file_record.upload_time.isoformat()
        }), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Failed to retrieve entry"}), 500
    
if __name__ == "__main__":
    
    with app.app_context():
        db.create_all()

    app.run(debug=True, host="127.0.0.1", port=5000)

