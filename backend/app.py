from flask import Flask,request
import mimetypes

app = Flask(__name__)

ALLOWED_MIMES = {"image/png", "image/jpeg"}
@app.route("/")
def hello():
    return "hello"


@app.route("/upload",methods=["POST","GET"])
def upload_check():
    
    if request.method == "POST":
        if 'file' not in request.files:
            return "please upload a file"
        else:
            uploaded_file = request.files['file']   
            if uploaded_file.filename == "":
                return "please upload a proper file"
            else:
                mime = uploaded_file.mimetype
                if mime not in ALLOWED_MIMES:
                    return "file type is not allowed"
                return "ok file"
                
                    
                
        
    
        
        
        

        
        
        

if __name__ == "__main__":
    app.run(debug=True)

