
import { useEffect, useState } from "react";
import { Toaster } from 'react-hot-toast';
import Home from "./components/Home";
import Dashboard from "./components/Dashboard";



function App(){
  const [refreshKey, setRefreshKey] = useState(0);
  const [token, setToken] = useState(null);

  const handleUploadSuccess = () =>{
    setRefreshKey(prev => prev + 1);
  };

  useEffect(()=>{
    const savedToken = localStorage.getItem("user_token")
    if(savedToken){
      setToken(savedToken)
    }
  },[]);

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    localStorage.setItem("user_token", newToken);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("user_token");
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
      <div className="relative z-10 px-6 pt-10 pb-20">
        
        {/* LOGIC SWITCH: Dashboard vs Home */}
        {token ? (
            <Dashboard token={token} onLogout={handleLogout} />
        ) : (
            <Home onLogin={handleLoginSuccess} />
        )}

      </div>             
    </div>
  )
}

export default App