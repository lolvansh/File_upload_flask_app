from flask import Flask,request,jsonify,make_response,send_from_directory
import mimetypes
from werkzeug.utils import secure_filename
import os
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)


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

class UploadedFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    saved_name = db.Column(db.String(100), nullable=False)
    original_name = db.Column(db.String(100), nullable=False)
    mimetype = db.Column(db.String(100), nullable=False)
    size = db.Column(db.Integer, nullable=False)
    upload_time = db.Column(db.DateTime, default= datetime.utcnow)


    
ALLOWED_MIMES = {"image/png", "image/jpeg"}
@app.route("/")
def hello():
    return "hello"


@app.route("/upload",methods=["POST","GET"])
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
                if mime not in ALLOWED_MIMES:
                    return make_response(jsonify({ "error": "unsupported_media_type", 
                    "message": "File type is not allowed." 
                    },415))
        
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
            


@app.route("/files/<int:id>/raw",methods=["GET"]) 
def get_image(id:int):
    
    record = UploadedFile.query.get_or_404(id)
    if record is None:
        return jsonify({"error": "not_found", "message": "File not found."}), 404
    
    file_path = os.path.join(FOLDER_NAME,record.saved_name)
    if not os.path.exists(file_path):
        return jsonify({"error":"not_found_on_disk0", "message": "File record exists but file is missing."},404)
    
    try:
        return send_from_directory(FOLDER_NAME, record.saved_name, as_attachment=False)
    except:
        return jsonify({"error": "server_error", "message": "Could not read the file."}), 500
        
    
    
    
                
        

if __name__ == "__main__":
    
    with app.app_context():
        db.create_all()
        
    app.run(debug=True)

