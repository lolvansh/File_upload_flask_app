import FileUploader from "./components/FileUploader";
import Gallery from "./components/Gallery";
import { useState } from "react";
import { Toaster } from 'react-hot-toast';

function App(){
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () =>{
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="max-w-4xl mx-auto space-y-8">

        <h1 className="text=3xl font-bold text-center text-gray-800">
          Image Keep
        </h1>

        <FileUploader onUploadSuccess={handleUploadSuccess} />

        <h3 className="border-grey-300" />

        <Gallery refreshTrigger={refreshKey} />
      </div>
    </div>
  )
}

export default App