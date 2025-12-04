from flask import Flask,request,jsonify,make_response,send_from_directory
import mimetypes
from werkzeug.utils import secure_filename
import os
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity





app = Flask(__name__)

CORS(app)


app.config['JWT_SECRET_KEY'] = 'super-secret-key-change-this-later'
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

FOLDER_NAME = "uploads" 

try:
    os.mkdir(FOLDER_NAME)
    print("created folder")
except FileExistsError:
    print("already exists")
except Exception as e:
    print (f"error:{e}")
    

# creating the database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    
    files = db.relationship('UploadedFile', backred='owner', lazy=True)

class UploadedFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    saved_name = db.Column(db.String(100), nullable=False)
    original_name = db.Column(db.String(100), nullable=False)
    mimetype = db.Column(db.String(100), nullable=False)
    size = db.Column(db.Integer, nullable=False)
    upload_time = db.Column(db.DateTime, default= datetime.utcnow)
    user_id = db.Column(db.Integer, db.Foreignkey('user.id'),nullable=False)

    
ALLOWED_MIMES = {"image/png", "image/jpeg"}
@app.route("/")
def hello():
    return "hello"

@app.route("/api/register", methods=["POST"])
def register():
    # we first get the data from the request json body
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    
    if not username or not password:
        return jsonify({"message":"Username and Password are required"}),400
    
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"message":"Username already taken"}),409
    
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    new_user = User(username=username, password=hashed_password)
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User created successfully"}),201
    except Exception as e:
        return jsonify({"message":"Database error", "error": str(e)}),500
    
    

@app.route("/api/upload",methods=["POST","GET"])
def upload_check():
    if request.method == "POST":
        if 'file' not in request.files:
            return make_response(jsonify({ "error": "file_missing", 
                    "message": "Please upload a file (field name: file)." 
                    },400))

        else:
            uploaded_file = request.files['file']   
            if uploaded_file.filename == "":
                return make_response(jsonify({ "error": "no_file_selected", 
                    "message": "No file was selected for upload." 
                    },400))
            else:
                # check the content type
                mime = uploaded_file.mimetype
                print(f"DEBUG: Uploaded file mime type is: {mime}")
                if mime not in ALLOWED_MIMES:
                    return jsonify({ 
                        "error": "unsupported_media_type", 
                        "message": "File type is not allowed." 
                    }), 415
        
                # move pointer to the end of the file
                uploaded_file.seek(0, 2)

                # get size in bytes
                file_size = uploaded_file.tell()

                # reset pointer back to start
                uploaded_file.seek(0)

                # check if file is bigger than 5 MB
                if file_size > 5 * 1024 * 1024:   
                    return make_response(jsonify({ "error": "payload_too_large", 
                    "message": "File exceeds maximum allowed size." 
                    },413))
                
                
                # securre name
                safe_name = secure_filename(uploaded_file.filename)
                time_stamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
                final_name = f"{time_stamp}_{safe_name}"
                
                try:
                    save_path = os.path.join(FOLDER_NAME,final_name)
                    uploaded_file.save(save_path)
                    
                    record = UploadedFile(
                        saved_name=final_name,
                        original_name=uploaded_file.filename,
                        mimetype=mime,
                        size=file_size
                    )
                    
                    db.session.add(record)
                    db.session.commit()
                    
                    return jsonify({
                        "message": "file_uploaded",
                        "file": {
                            "saved_name": final_name,
                            "original_name": uploaded_file.filename,
                            "mimetype": mime,
                            "size": file_size,
                            "url": f"/files/{record.id}/raw"
                        }
                    }), 201
                except Exception as e:
                    return make_response(jsonify({"error":"internal_server_error",
                                                  "message":f"An error occurred while saving the file: {e}"}),500)
            

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("userrname")
    password = data.get("password")
    
    user = User.query.filter_by(username=username).first()
    
    if user and bcrypt.check_password_hash(user.password, password):
        
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            "message":"Login success",
            "token": access_token,
            "username": user.username
        }), 200
    else:
        return jsonify({"message": "Invalid username or password"}), 401



@app.route("/api/files/<int:id>/raw",methods=["GET"]) 
def get_image(id:int):
    
    record = UploadedFile.query.get_or_404(id)
    print(record)
    if record is None:
        return jsonify({"error": "not_found", "message": "File not found."}), 404
    
    file_path = os.path.join(FOLDER_NAME,record.saved_name)
    if not os.path.exists(file_path):
        return jsonify({"error":"not_found_on_disk", "message": "File record exists but file is missing."}),404
    
    try:
        return send_from_directory(FOLDER_NAME, record.saved_name, as_attachment=False)
    except:
        return jsonify({"error": "server_error", "message": "Could not read the file."}), 500
        
    
    
@app.route("/api/delete/<int:id>",methods=["DELETE"])   
def delete_image(id:int):
    record = UploadedFile.query.get_or_404(id)
    file_path = os.path.join(FOLDER_NAME,record.saved_name)
    if not os.path.exists(file_path):
        return jsonify({"error":"not_found_on_disk0", "message": "File record exists but file is missing."}),404
    else:
        try:
            os.remove(file_path)         
        except Exception as e:
            return jsonify({"error": "file_deletion_failed", "message": "Failed to delete file from disk."}), 500
        try:
            db.session.delete(record)
            db.session.commit()
            return jsonify({"message": "deleted","id": record.id})
        except Exception as e:
            return jsonify({"error": "file_deletion_failed", "message": "Failed to delete file from disk."}), 500               


@app.route("/api/files",methods=["GET"])
def get_files():
    
    # pagination
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit",50))
        if page < 1 or limit < 1 or limit > 200:
            raise ValueError
    except ValueError:
        return jsonify({"error": "invalid_params", "message": "page and limit must be positive integers; limit <= 200"}), 400
    
    query = UploadedFile.query.order_by(UploadedFile.upload_time.desc())
    total = query.count()
    items = query.offset((page-1)*limit).limit(limit).all()
    files=[]
    
    for file in items:
        files.append({
            "id": file.id,
            "name": file.original_name,
            "size": file.size,
            "uploaded_at": file.upload_time.isoformat() if file.upload_time else None,
            "url": f"/api/files/{file.id}/raw",
        })
        
    return jsonify({
        "page": page,
        "limit": limit,
        "total": total,
        "files": files
    })
    
          

if __name__ == "__main__":
    
    with app.app_context():
        db.create_all()
        
    app.run(debug=True, host="127.0.0.1", port=5000)

