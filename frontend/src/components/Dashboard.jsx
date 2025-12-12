import React from "react";
import FileUploader from "./FileUploader";
import Gallery from "./Gallery";

function Dashboard({ token, onLogout }) {
  // We manage the refresh trigger here because it connects the Uploader to the Gallery
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500">
      {/* Header for the Logged In User */}
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Image<span className="text-sky-600">Keep</span>
            </h1>
            <p className="text-slate-500">memory Vault</p>
        </div>
        <button
            onClick={onLogout}
            className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors px-4 py-2 hover:bg-red-50 rounded-lg"
        >
            Sign Out
        </button>
      </div>

      <FileUploader 
        onUploadSuccess={handleUploadSuccess} 
        token={token} 
        // We pass logout here in case the token expires while uploading
        onAuthError={onLogout} 
      />
      
      <Gallery 
        refreshTrigger={refreshKey} 
        token={token} 
        onAuthError={onLogout} 
      />
    </div>
  );
}

export default Dashboard;