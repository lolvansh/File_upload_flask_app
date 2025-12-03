import React, {useState, useEffect} from "react";

function Gallery() {
    const [images, setImgaes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(()=>{
        fetchImages();
    },[]);

    const fetchImages = async () =>{
        try {
            const response = await fetch("/api/files")
            if(response.ok){
                let data = await response.json()
                setImgaes(data.files)
                setLoading(false)
            } 
            else
            {
                console.log("error:", response.status)
            }
        }
        catch(error){
            console.error("Error", error)
        }
    }

    return (
        <div className="gallery-container">
            <h2>Uploaded files</h2>

            {loading ? (<p>loading</p>) : (
                <div className="image-grid">
                {/* We will map through images here later */}
                    <p>Found {images.length} images</p>
                </div>
            )}

        </div>
    )

}

export default Gallery;