import React, {useState, useRef} from "react";
import toast from "react-hot-toast";
import { API_URL } from "../config";

function FileUploader({ onUploadSuccess, token}){
    const [selectedFile, setSelectedFile] = useState(null)
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (event) =>{
        const file = event.target.files[0];

        setSelectedFile(file);
    }

    const handleFileUpload = async () => {
        if(!selectedFile){
            toast.error("Please select a file first!");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile)
        setIsUploading(true);

        const loadingToastId = toast.loading("Uploading");

        try{
            const response = await fetch(`${API_URL}/api/upload`,
            {method: "POST",
                    // 2. THIS IS THE MISSING PART causing the 401 error:
            headers: {
                "Authorization": `Bearer ${token}` 
            },
            body: formData,}
            );

            toast.dismiss(loadingToastId)

            if (response.ok){
                toast.success("File uploaded successfully")
                if (onUploadSuccess){
                    onUploadSuccess();
                }
                setSelectedFile(null)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ""; 
                }
                
            } else{
                const errorData = await response.json();
                toast.error(`Error:`, errorData)
                setSelectedFile(null)
            }
        }
        catch (error){
            console.error("ERROR:", error);
            toast.dismiss(loadingToastId)
            toast.error("Network Connection Failed") 
        }finally{
            setIsUploading(false)
        }
        


    }
    return (
        <div className="bg-white p-6 rounded-xl shadow-md max-w-xl mx-auto">
            <div className="flex gap-4 justify-between">
                <label className="block">
                    <span className="sr-only">Choose a Image</span>
                    <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/png , image/jpeg"
                        className="block w-full text-sm text-slate-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:bg-violet-50 file:text-violet-800
                            hover:file:bg-violet-200 "></input>
                </label>
                <button 
                        onClick={handleFileUpload}
                        className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg 
                                    hover:bg-blue-700 transition duration-200 ease-in-out shadow-sm"
                        >
                        Upload File
                </button>
                
            </div>
        </div>
    ) 
}

export default FileUploader