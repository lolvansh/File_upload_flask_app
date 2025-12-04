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


        <div className="relative min-h-screen w-full bg-white selection:bg-sky-100 text-slate-900">
          
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
      

      {/* 3. THE DOT GRID BACKGROUND (Fixed position so it doesn't scroll away) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* 4. THE CONTENT (z-10 puts this ON TOP of the background) */}
      <div className="relative z-10 px-6 pt-14 pb-20">
        
        {/* HERO TITLE */}
        <div className="max-w-3xl mx-auto text-center mb-12">
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-slate-900">
                Image <span className="text-sky-600">Keep</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
                Your personal secure cloud gallery. Upload, manage, and organize your memories with ease.
            </p>
        </div>

        {/* COMPONENT CONTAINER */}
        <div className="max-w-5xl mx-auto space-y-12">

            {/* Glassmorphism Card for Uploader */}
                <FileUploader onUploadSuccess={handleUploadSuccess} />
            

            {/* Glassmorphism Card for Gallery */}
            <div className="backdrop-blur-sm rounded-2xl border border-white/50 shadow-sky-100/50">
                <Gallery refreshTrigger={refreshKey} />
            </div>

        </div>
      </div>
    </div>
  )
}

export default App