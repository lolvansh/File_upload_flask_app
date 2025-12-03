import FileUploader from "./components/FileUploader";
import Gallery from "./components/Gallery";
import { useState } from "react";

function App(){
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () =>{
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="App">
      <h1>My File Upload App</h1>
      <FileUploader onUploadSuccess={handleUploadSuccess}/>
      <hr></hr>
      <Gallery refreshTrigger={refreshKey}/>
    </div>
  )
}

export default App