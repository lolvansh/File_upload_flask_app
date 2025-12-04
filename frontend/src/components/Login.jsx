import React, { useState } from "react";
import toast from "react-hot-toast";

function Login({ onLogin }){
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit= async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const endpoint = isRegistering ? "/api/register" : "/api/login";

        const loadingId = toast.loading(isRegistering ? "creating account..." : "Signing In...")

        try{
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {"content-type": "application/json"},
                body: JSON.stringify({username, password})
            });
            const data = await response.json();

            if(response.ok){
                toast.success(isRegistering ? "Accound Created!" : "Welcome Back!", { id: loadingId})
                if (isRegistering){
                    setIsRegistering(false)
                }else{
                    onLogin(data.token)
                }
            }else{
                toast.error(data.message || "error",{ id: loadingId});
            }
        }catch(error){
            toast.error("Network error", {id: loadingId})
        }finally{
            setIsLoading(false);
        }
    };

    return(
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="backdrop-blur-sm bg-blue-50 p-8 rounded-2xl border border-black/10 shadow2xl shadow-sky-100/50 w-full max-w-md">
                <h2 className="text-3xl font-bold text-slate-800 text-center mb-2">{isRegistering ? "Creating Account": "Welcome Back"}</h2>
                <p className="text-slate-500 text-center mb-8">
                    {isRegistering ? "join your private cloud gallery" : "Enter your details to access files"}
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                        <input 
                            type="text"
                            value={username}
                            onChange={(e)=> setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-white/50 border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all"
                            placeholder="Enter username"
                            required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-white/50 border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-lg shadow-sky-200 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Processing..." : (isRegistering ? "Sign Up" : "Sign In")}
                    </button>
                </form>
                <div className="mt-6 text-center text-sm text-slate-600">
                    {isRegistering ? "Already have an account?" : "Don't have an account?"}
                    <button 
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="ml-2 text-sky-600 font-bold hover:underline"
                    >
                        {isRegistering ? "Log in" : "Sign up"}
                    </button>
                </div>
            </div>
        </div>
    )
}


export default Login
