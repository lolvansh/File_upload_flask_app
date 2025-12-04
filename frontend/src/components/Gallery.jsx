import React, {useState, useEffect} from "react";
import toast from "react-hot-toast";
import { API_URL } from "../config";

function Gallery({ refreshTrigger, token }) {
    const [images, setImgaes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedImgae, setSelectedImage] = useState(null)

    useEffect(() => {
            
            const fetchImages = async () => {
                if (!token) return;
                try {
                    // Use 'page' directly from state here
                    const response = await fetch(`${API_URL}/api/files?page=${page}&limit=6`, {
                    // 2. FIX: Add the Authorization Header
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                    if (response.ok) {
                        let data = await response.json()
                        setImgaes(data.files)
                        const calculatedPages = Math.ceil(data.total / data.limit);
                        setTotalPages(calculatedPages);
                        setLoading(false)
                    } else {
                        console.log("error:", response.status)
                    }
                } catch (error) {
                    console.error("Error", error)
                }
            };

            fetchImages();

        }, [page,refreshTrigger,token]);


    
    const handleDelete = async (id) => {
        
            // 1. Confirm with the user
            if (!window.confirm("Are you sure?")) return;

            try {
                // 2. Tell Backend to delete
                const response = await fetch(`${API_URL}/api/delete/${id}`, {
                    method: "DELETE" 
                });

                if (response.ok) {
                    // 3. THE TRICK: Update the screen IMMEDIATELY
                    // We filter the list to keep everything EXCEPT the one we deleted.
                    // We do NOT need to fetch from the server again.
                    setImgaes(currentImages => currentImages.filter(img => img.id !== id));
                    toast.success("Image deleted", {
                    icon: "🗑️" // You can even add custom icons!
                    });
                } else {
                    toast.error("Failed to delete image.");
                    
                }
            } catch (error) {
                console.error("Error:", error);
                toast.error("Network error. Could not reach server.");
            }
        };

return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Gallery</h2>
                <span className="text-sm text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                    Page {page} of {totalPages || 1}
                </span>
            </div>

            {loading ? (
                // --- SKELETON LOADING STATE ---
                // Shows gray boxes while loading instead of "Loading..." text
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
                    ))}

                </div>
            ) : (
                <>
                    {/* --- THE GRID --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {images.map((file) => (
                            <div 
                                key={file.id} 
                                onClick={() => setSelectedImage(file)}
                                className="group relative bg-white rounded-xl shadow-sm border border-gray-50 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                            >
                                {/* IMAGE CONTAINER */}
                                <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
                                    <img 
                                        src={file.url.startsWith('/api') ? file.url : `/api${file.url}`} 
                                        alt={file.name} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    
                                    {/* DELETE BUTTON OVERLAY (Only visible on hover) */}
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex place-items-start justify-end p-3">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(file.id);
                                            }}

                                            className="bg-red-500 text-white px-2 py-2 rounded-md font-medium transform scale-90 group-hover:scale-100 transition-transform duration-200 hover:bg-red-600 shadow-lg flex items-center gap-2 cursor-pointer"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                            
                                        </button>
                                    </div>
                                </div>

                                {/* FILE INFO */}
                                <div className="p-4 bg-blue-100">
                                    <p className="text-gray-800 font-semibold truncate" title={file.name}>
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* --- EMPTY STATE --- */}
                    {images.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300">
                            <p className="text-gray-400 text-lg">No images uploaded yet.</p>
                        </div>
                    )}

                    {/* --- PAGINATION CONTROLS --- */}
                    <div className="flex justify-center items-center gap-4 mt-10">
                        <button 
                            disabled={page === 1} 
                            onClick={() => setPage(page - 1)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            ←
                        </button>
                        
                        <div className="flex gap-1">
                            {/* Simple visual indicator dots */}
                            {[...Array(totalPages)].map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full ${page === i + 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                            ))}
                        </div>
                        
                        <button 
                            disabled={page === totalPages} 
                            onClick={() => setPage(page + 1)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            →
                        </button>
                    </div>

                    {/* lightbox */}
                    { selectedImgae && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 transition-all duration-300"
                        onClick={() => setSelectedImage(null)}>
                            <button 
                                className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors"
                                onClick={() => setSelectedImage(null)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <img 
                                src={selectedImgae.url.startsWith('/api') ? selectedImgae.url : `/api${selectedImgae.url}`} 
                                alt={selectedImgae.name}
                                className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
                            />
                            <div className="absolute bottom-5 left-0 right-0 text-center text-white/80">
                                <p className="text-lg font-medium">{selectedImgae.name}</p>
                            </div>
                        </div>
                    )}

                </>
            )}
        </div>
    );
}

export default Gallery;