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
      <Toaster position="top-right" reverseOrder={false} 
                gutter={8}
                toastOptions={{
                  duration: 4000,
                  success: {
                    style: {
                    background: '#ecfdf5', // green-50
                    color: '#15803d',      // green-700
                    border: '1px solid #bbf7d0', // green-200
                    padding: '16px',
                    fontWeight: '500', 
                    },
                    iconTheme: {
                      primary: '#1d3f50ff',
                      secondary: '#ecfd15',
                    },
                  },
                  error: {
                      style: {
                          background: '#fef2f2', // red-50
                          color: '#b44c4cff',      // red-700
                          border: '1px solid #f1dedeff', // red-200
                          padding: '16px',
                          fontWeight: '500',
                      },
                      iconTheme: {
                          primary: '#b91c1c',
                          secondary: '#fef2f2',
                      },
                  },
                  loading: {
                      style: {
                          background: 'white',
                          color: '#374151',      // gray-700
                          border: '1px solid #e5e7eb', // gray-200
                          padding: '16px',
                      },
                  }
                }}
                
                />

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