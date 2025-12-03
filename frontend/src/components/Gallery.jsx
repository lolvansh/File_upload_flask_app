import React, {useState, useEffect} from "react";


function Gallery(props) {
    const [images, setImgaes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
            
            const fetchImages = async () => {
                try {
                    // Use 'page' directly from state here
                    const response = await fetch(`/api/files?page=${page}&limit=5`)
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

        }, [page, props.refreshTrigger]);


    return (
        <div className="gallery-container">
            <h2>Uploaded files</h2>

            {loading ? (<p>loading</p>) : (
                <div className="image-grid">
                    {images.map((file) => (
                        <div key={file.id} className="image-card">
                            
                            {/* 1. Display the Image */}
                            {/* We prepend /api so the proxy knows to send it to Flask */}
                            <img 
                                src={file.url.startsWith('/api') ? file.url : `/api${file.url}`} 
                                alt={file.name} 
                                style={{ width: "200px", height: "auto", objectFit: "cover" }}
                            />
                            
                            {/* 2. Display the Name */}
                            <p>{file.name}</p>
                        </div>
                    ))}
                    
                    {/* Show a message if list is empty */}
                    {images.length === 0 && <p>No images found.</p>}
                </div>
                )}

                <div className="pagination-control" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button disabled= {page === 1}
                    onClick={()=> setPage(page-1)}>
                        previous
                    </button>
                    <span style={{ alignSelf: 'center'}}> page {page} of {totalPages} </span>
                    <button disabled = {page === totalPages}
                    onClick={()=> setPage(page+1)}>Next</button>
                </div>

        </div>
    )

}

export default Gallery;