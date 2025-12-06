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

load_dotenv()

app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "DELETE", "OPTIONS"]}})


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


@app.route("/api/verify-user", methods=["POST", "OPTIONS"])
def verify_user():
    if request.method == "OPTIONS":
        return '', 200
    
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "Missing Authorization Header"}), 401
    
    try:
        token = auth_header.split(" ")[1]
        decoded_token = auth.verify_id_token(token, clock_skew_seconds=10)  # <-- ADD THIS
        firebase_uid = decoded_token['uid']
        email = decoded_token.get('email')
        
        user = User.query.filter_by(firebase_uid=firebase_uid).first()
        
        if not user:
            user = User(firebase_uid=firebase_uid, email=email)
            db.session.add(user)
            db.session.commit()
        
        return jsonify({"message": "User verified", "email": email}), 200
        
    except Exception as e:
        print(f"Verification Error: {e}")
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
@firebase_auth_required # <--- NEW DECORATOR
def list_files():
    current_user = request.current_user
    
    # Fetch files belonging to this specific user
    files = UploadedFile.query.filter_by(user_id=current_user.id).order_by(UploadedFile.upload_time.desc()).all()
    
    bucket = storage.bucket(os.environ.get('FIREBASE_STORAGE_BUCKET'))
    results = []
    for f in files:
        # 2. Generate a "Signed URL" for each file
        # This URL works for 1 hour and allows access to the private file
        blob = bucket.blob(f.saved_name)
        
        try:
            # Generate link valid for 3600 seconds (1 hour)
            url = blob.generate_signed_url(expiration=timedelta(hours=1))
            
            results.append({
                "id": f.id,
                "name": f.original_name,
                "url": url, # Frontend puts this in <img src=...>
                "type": f.mimetype,
                "size": f.size,
                "title": f.title,        # NEW
                "note": f.note,          # NEW
                "upload_time": f.upload_time.isoformat() 
            })
        except Exception as e:
            print(f"Error generating URL for {f.saved_name}: {e}")

    return jsonify({"files": results})
        
    
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

