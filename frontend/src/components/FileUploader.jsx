import React, {useState, useRef, useEffect} from "react";
import toast from "react-hot-toast";
import { API_URL } from "../config";

function FileUploader({ onUploadSuccess, token}){
    const [selectedFile, setSelectedFile] = useState(null)
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const containerRef = useRef(null); 
    const [title, setTitle] = useState(""); 
    const [note, setNote] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        function handleClickOutside(event) {
            // If the container exists and the clicked element is NOT inside the container
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsExpanded(false);
            }
        }

        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        
        // Unbind the event listener on clean up
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [containerRef]);

    const handleFileSelect = (event) =>{
        const file = event.target.files[0];

        setSelectedFile(file);
    }

    const handleFileUpload = async () => {
        if(!selectedFile){
            toast.error("Please select a photo");
            return;
        }

        if(!title.trim()){
            toast.error("Please add a title!");
            return;
        }

        if(!note.trim()){
            toast.error("Please write your keep!");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile)
        formData.append("title", title.trim())
        formData.append("note",note.trim())
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
                setTitle("")
                setNote("")

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
            <div ref={containerRef} className="p-4 max-w-2xl mx-auto">
            <div className="space-y-4">
                {/* STORY INPUT - ALWAYS VISIBLE */}
                <div>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onFocus={() => setIsExpanded(true)}
                        placeholder="Express yourself..."
                        rows={isExpanded ? 6 : 1}
                        className="w-full px-4 py-3 border font-sans font-normal border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all "
                    />
                </div>

                {/* TITLE AND PHOTO - SHOW WHEN EXPANDED */}
                {isExpanded && (
                    <>
                        <div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Give your memory a title..."
                                maxLength={200}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>

                        <div className="flex gap-4 items-center">
                            <label className="flex-1 block">
                                <span className="sr-only">Choose a Photo</span>
                                <input 
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept="image/png, image/jpeg"
                                    className="block w-full text-sm text-slate-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:bg-violet-50 file:text-violet-800
                                        hover:file:bg-violet-200 file:cursor-pointer">
                                </input>
                            </label>
                            
                            <button
                                onClick={handleFileUpload}
                                disabled={isUploading}
                                className="group rounded-full bg-[#3d405b] text-white shadow-sm
                                    hover:bg-[#2d2f3b] transition-all duration-500 cursor-pointer
                                    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-500
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
                                        <svg className="sm:hidden h-5 w-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                        </svg>
                                        <span className="hidden sm:inline relative cursor-pointer transition-all duration-500 
                                            group-hover:pr-[15px] 
                                            after:absolute after:top-0 after:-right-[15px] after:content-['»'] 
                                            after:opacity-0 after:transition-all after:duration-500 
                                            group-hover:after:right-0 group-hover:after:opacity-100">
                                            Create
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    ) 
}

export default FileUploader