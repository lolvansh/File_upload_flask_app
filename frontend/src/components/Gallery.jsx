import React, {useState, useEffect} from "react";
import toast from "react-hot-toast";
import { API_URL } from "../config";

function Gallery({ refreshTrigger, token, onAuthError }) {
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
                        onAuthError()
                    }
                } catch (error) {
                    console.error("Error", error)
                    onAuthError()
                }
            };

            fetchImages();

        }, [page,refreshTrigger,token,onAuthError]);


    
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;

        try {
            const response = await fetch(`${API_URL}/api/delete/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`  // <-- ADD THIS
                }
            });

            if (response.ok) {
                setImgaes(currentImages => currentImages.filter(img => img.id !== id));
                toast.success("Image deleted", { icon: "🗑️" });
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
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {images.map((file) => (
                            <div 
                                key={file.id} 
                                onClick={() => setSelectedImage(file)}
                                className="group relative  rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                            >
                                {/* IMAGE CONTAINER */}
                            
                                <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
                                    <img 
                                        src={file.url}
                                        alt={file.name} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    
                                    {/* DELETE BUTTON - Always visible on mobile, hover on desktop */}
                                    <div className="absolute top-2 right-2 sm:absolute sm:inset-0 sm:bg-black/20 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity sm:duration-300 sm:flex sm:place-items-start sm:justify-end sm:p-3">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(file.id);
                                            }}
                                            className="bg-red-500 text-white p-2 rounded-full sm:rounded-md font-medium 
                                                transition-transform duration-200 hover:bg-red-600 shadow-lg 
                                                flex items-center justify-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                            <span className="hidden sm:inline text-sm">Delete</span>
                                        </button>
                                    </div>
                                </div>

                                {/* FILE INFO [#FEF3E2]" */}
                                <div className="p-4 bg-[#D8D2C2]">
                                    <p className="text-gray-800 font-semibold truncate" title={file.title}>
                                        {file.title}
                                    </p>
                                    <p 
                                        className="text-sm text-gray-600 mt-1 overflow-hidden" 
                                        style={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 1,
                                            WebkitBoxOrient: 'vertical'
                                        }}
                                        title={file.note}
                                    >
                                        {file.note}
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
                            {totalPages > 0 && [...Array(totalPages)].map((_, i) => (
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

{selectedImgae && (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setSelectedImage(null)}
    >
        {/* Card Container 
            - 'md:inline-block': On desktop, this behaves like a block fitting the image.
            - 'md:pr-96': CRITICAL. We add right padding equal to the sidebar width (w-96) 
               so the container reserves space for the text, even though the text is absolute.
            - 'w-fit': Ensures the width hugs the image.
        */}
        <div
            className="relative flex flex-col md:inline-block bg-stone-900 rounded-lg shadow-2xl overflow-hidden max-h-[90vh] max-w-[95vw] w-fit animate-in zoom-in-95 duration-200 border border-stone-800 md:pr-96"
            onClick={(e) => e.stopPropagation()}
        >
            
            {/* Close Button - Stays top right of the whole container */}
            <button
                className="absolute top-2 right-2 z-20 p-2 text-stone-400 hover:text-white transition-colors bg-black/40 hover:bg-black/60 rounded-full"
                onClick={() => setSelectedImage(null)}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Image Section 
                - Defines the height of the card on Desktop.
                - 'block': Standard display to let it dictate dimensions.
            */}
            <div className="bg-black">
                <img
                    src={selectedImgae.url}
                    alt={selectedImgae.name}
                    className="block w-auto h-auto max-h-[50vh] md:max-h-[70vh] object-contain mx-auto"
                />
            </div>

{/* Right Side: Content Sidebar
    - Added 'flex-1' and 'min-h-0': 
      These are CRITICAL for mobile. They tell the sidebar:
      "If the card hits its max height, you must shrink to fit the remaining space."
*/}
<div className="flex flex-col w-90 md:w-96 bg-stone-900 border-t md:border-t-0 md:border-l border-stone-800/50 md:absolute md:right-0 md:top-0 md:bottom-0 flex-1 min-h-0">
    
    {/* Header Section */}
    <div className="p-4 md:p-6 border-b border-stone-800 bg-stone-900/50 shrink-0">
        <h2 className="text-lg md:text-xl font-bold text-amber-100 font-serif leading-tight pr-6">
            {selectedImgae.title}
        </h2>
    </div>

    {/* Scrollable Note Section 
        - 'flex-1' fills the space between Header and Footer.
        - 'overflow-y-auto' enables the scroll when the parent 'min-h-0' forces a height limit.
    */}
    <div className="flex-1 p-4 md:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent">
        <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-line break-words">
            {selectedImgae.note}
        </p>
    </div>
    
    {/* Footer */}
    <div className="p-3 md:p-4 bg-stone-950/30 text-xs text-stone-500 border-t border-stone-800 text-center shrink-0">
       {selectedImgae.name}
    </div>
</div>

        </div>
    </div>
)}

                </>
            )}
        </div>
    );
}

export default Gallery;