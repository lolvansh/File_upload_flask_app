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
                    disabled={isUploading}
                    className="bg-blue-600 text-white font-semibold rounded-full
                        hover:bg-blue-700 transition duration-200 ease-in-out shadow-sm 
                        disabled:opacity-50 disabled:cursor-not-allowed
                        w-11 h-11 min-w-[2.75rem] min-h-[2.75rem] flex-shrink-0
                        sm:w-auto sm:h-auto sm:min-w-0 sm:min-h-0 sm:px-6 sm:py-2 sm:rounded-lg
                        flex items-center justify-center"
                >
                    {isUploading ? (
                        <svg className="animate-spin h-5 w-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <>
                            <svg className="sm:hidden h-5 w-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            <span className="hidden sm:inline">Upload</span>
                        </>
                    )}
                </button>
                
            </div>
        </div>
    ) 
}

export default FileUploader