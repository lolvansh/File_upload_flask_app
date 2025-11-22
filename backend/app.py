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
                # check the content type
                mime = uploaded_file.mimetype
                if mime not in ALLOWED_MIMES:
                    return "file type is not allowed"
        
                # move pointer to the end of the file
                uploaded_file.seek(0, 2)

                # get size in bytes
                file_size = uploaded_file.tell()

                # reset pointer back to start
                uploaded_file.seek(0)

                # check if file is bigger than 5 MB
                if file_size > 5 * 1024 * 1024:   
                    return "file is too large"
                
                
            

        
                
                    
                
        
    
        
        
        

        
        
        

if __name__ == "__main__":
    app.run(debug=True)

