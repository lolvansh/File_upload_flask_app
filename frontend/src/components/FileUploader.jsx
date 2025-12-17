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

    // Logic: Ready only if all 3 exist
    const isReadyToUpload = selectedFile && title.trim() && note.trim();

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsExpanded(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [containerRef]);

    const handleFileSelect = (event) =>{
        const file = event.target.files[0];
        setSelectedFile(file);
    }

    const handleFileUpload = async () => {
        if(!selectedFile) return toast.error("Please select a photo");
        if(!title.trim()) return toast.error("Please add a title!");
        if(!note.trim()) return toast.error("Please write your keep!");

        const formData = new FormData();
        formData.append("file", selectedFile)
        formData.append("title", title.trim())
        formData.append("note",note.trim())
        setIsUploading(true);

        const loadingToastId = toast.loading("Uploading");

        try{
            const response = await fetch(`${API_URL}/api/upload`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData,
            });

            toast.dismiss(loadingToastId)

            if (response.ok){
                toast.success("File uploaded successfully")
                if (onUploadSuccess) onUploadSuccess();
                
                // Reset form
                setSelectedFile(null)
                setTitle("")
                setNote("")
                setIsExpanded(false);
                if (fileInputRef.current) fileInputRef.current.value = ""; 
            } else{
                const errorData = await response.json();
                toast.error(`Error:`, errorData)
                setSelectedFile(null)
            }
        } catch (error){
            console.error("ERROR:", error);
            toast.dismiss(loadingToastId)
            toast.error("Network Connection Failed")
        } finally{
            setIsUploading(false)
        }
    }

    return (
        <div ref={containerRef} className="p-4 max-w-2xl mx-auto">
            <div className="space-y-4">
                
                {/* 1. NOTE INPUT (Always Visible) */}
                <div>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onFocus={() => setIsExpanded(true)}
                        placeholder="Express yourself..."
                        rows={isExpanded ? 6 : 1}
                        className="w-full px-4 py-3 border font-sans font-normal border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all"
                    />
                </div>

                {/* EXPANDED SECTION */}
                {isExpanded && (
                    <>
                        {/* 2. TITLE INPUT */}
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

                        {/* 3. FILE INPUT (Full Width) */}
                        <div className="w-full">
                            <label className="block w-full">
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
                                        hover:file:bg-violet-200 file:cursor-pointer"
                                />
                            </label>
                        </div>

                        {/* 4. BUTTON (Right Aligned, Below Input) */}
                        <div className="flex justify-end mt-2">
                            <button
                                onClick={handleFileUpload}
                                disabled={isUploading}
                                className={`
                                    ${isReadyToUpload ? 'flex' : 'hidden'} sm:flex 
                                    group rounded-full bg-[#3d405b] text-white shadow-sm
                                    hover:bg-[#2d2f3b] transition-all duration-500 cursor-pointer
                                    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-500
                                    
                                    /* Mobile: Circle (w-11 h-11) */
                                    w-24 h-11 min-w-[2.75rem] min-h-[2.75rem] flex-shrink-0
                                    
                                    /* Desktop: Pill shape */
                                    sm:w-auto sm:h-auto sm:min-w-0 sm:min-h-0 sm:px-6 sm:py-2 sm:rounded-lg
                                    
                                    items-center justify-center
                                `}
                            >
                                {isUploading ? (
                                    <svg className="animate-spin h-5 w-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>
                                        {/* Desktop "Create" Text with Hover Arrow */}
                                        <span className="sm:inline relative cursor-pointer transition-all duration-500 
                                            group-hover:pr-[15px] 
                                            after:absolute after:top-0 after:-right-[15px] after:content-['»'] 
                                            after:opacity-0 after:transition-all after:duration-500 
                                            group-hover:after:right-0 group-hover:after:opacity-100">
                                            Upload
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

export default FileUploader;