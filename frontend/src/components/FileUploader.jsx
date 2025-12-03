import React, {useState} from "react";



function FileUploader(props){
    const [selectedFile, setSelectedFile] = useState(null)
    const [status, setStatus] = useState(null)

    const handleFileSelect = (event) =>{
        const file = event.target.files[0];

        setSelectedFile(file);
        setStatus("File Selected: " +file.name);
    }

    const handleFileUpload = async () => {
        if(!selectedFile){
            setStatus("please select a file first!");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile)
        setStatus("Uploading...");

        try{
            const response = await fetch("/api/upload",
                {
                    method: "POST",
                    body: formData
                }
            );

            if (response.ok){
                setStatus("Success! File Uploaded")
                if (props.onUploadSuccess){
                    props.onUploadSuccess();
                }
                
            } else{
                const errorData = await response.json();
                
                setStatus("Error:"+errorData.message);
            }
        }
        catch (error){
            console.error("ERROR:", error);
            setStatus("Netword Error.")
            
        }
        


    }
    return (
        <div className="uploader-container">
            <input type="file" onChange={handleFileSelect}/>
            <button onClick={handleFileUpload}>Upload</button>
            <p>Status: {status} </p>
        </div>
    ) 
}

export default FileUploader