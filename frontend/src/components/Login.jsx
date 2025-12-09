import React, { useState } from "react";
import toast from "react-hot-toast";
import { API_URL } from "../config";

import { auth, googleProvider } from "../firebase-config";
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup,
} from "firebase/auth";

function Login({ onLogin }){
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpSent,setOtpSent]= useState(false);


    const verifyTokenWithBackend = async (token) =>{
        const response = await fetch(`${API_URL}/api/verify-user`,{
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok){
            const errordata = await response.json();
            throw new Error(errordata.error || "Backend verification failed")
        }
        return await response.json()
    };

    const handleGoogleLogin = async () =>{
        setIsLoading(true);
        const loadingId = toast.loading("Connecting to Google...");

        try{
            const result = await signInWithPopup(auth, googleProvider)
            const user = result.user;

            const token = await user.getIdToken();
            await verifyTokenWithBackend(token);

            toast.success(`Welcome ${user.displayName}!`, {id: loadingId});
            onLogin(token)
        }catch (error){
            console.error("Google login error",error);
            toast.error("Google sign-in Failed", {id: loadingId});
        }finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async () => {
        setIsLoading(true);
        const loadingId = toast.loading("Signing In...");

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const token = await userCredential.user.getIdToken();
            await verifyTokenWithBackend(token);

            toast.success("Welcome Back!", {id: loadingId});
            onLogin(token);
        }catch(error){
            console.error(error);
            let msg = "Authentication Error";
            if (error.code === 'auth/wrong-password') msg = "Incorrect password";
            if (error.code === 'auth/user-not-found') msg = "No account with this email";
            if (error.code === 'auth/invalid-credential') msg = "Invalid email or password";
            toast.error(msg, {id: loadingId});
        }finally{
            setIsLoading(false);
        }
    };

    const sentOtp = async () => {
        setIsLoading(true);
        const loadingId = toast.loading("Sending code...");
        try{
            const response = await fetch(`${API_URL}/api/send-otp`,{
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
            const data = await response.json(); // Fixed: was 'res'
            if(!response.ok) throw new Error(data.error || "Failed");
            toast.success("Code sent!", {id: loadingId});
            setOtpSent(true);
        }catch(error){
            toast.error(error.message, {id: loadingId});
        }finally{
            setIsLoading(false);
        }
    }

    const verifyAndRegister = async () =>{
        setIsLoading(true)
        const loadingId = toast.loading("Verifying...");
        try {
            // 1. Verify against Redis
            const res = await fetch(`${API_URL}/api/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }) 
            });
            if(!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Invalid OTP");
            }
            toast.loading("Creating account...", {id: loadingId});
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const token = await userCredential.user.getIdToken();
            await verifyTokenWithBackend(token);

            toast.success("Account Created!", {id: loadingId});
            onLogin(token);

        }catch (error) {
            console.error(error);
            let msg = error.message;
            if (error.code === 'auth/email-already-in-use') msg = "Email already taken";
            toast.error(msg, {id: loadingId});
        } finally {
            setIsLoading(false);
        }
    }; 

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isLoading) {
            if (!isRegistering) {
                handleLogin();
            } else if (!otpSent) {
                sentOtp();
            } else {
                verifyAndRegister();
            }
        }
    };


    return(
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="backdrop-blur-sm bg-blue-50 p-8 rounded-2xl border border-black/10 shadow2xl shadow-sky-100/50 w-full max-w-md">
                <h2 className="text-3xl font-bold text-slate-800 text-center mb-2">{isRegistering ? "Creating Account": "Welcome Back"}</h2>
                <p className="text-slate-500 text-center mb-8">
                    {isRegistering ? "join your private cloud gallery" : "Enter your details to access files"}
                </p>

                <form onSubmit={(e) => e.preventDefault()} className="space-y-6" onKeyDown={handleKeyPress}>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                        <input 
                            type="email"
                            value={email}
                            onChange={(e)=> setEmail(e.target.value)}
                            disabled={otpSent}
                            className="w-full px-4 py-3 rounded-lg bg-white/50 border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all"
                            placeholder="name@example.com"
                            required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={otpSent}
                            className="w-full px-4 py-3 rounded-lg bg-white/50 border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    {/* OTP Input - Only show during OTP step */}
                    {isRegistering && otpSent && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Verification Code</label>
                            <input 
                                type="text" 
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                                className="w-full px-4 py-3 text-center text-2xl tracking-widest rounded-lg bg-white/50 border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all"
                                placeholder="******"
                                autoFocus
                                required
                            />
                            <div className="flex justify-end mt-2">
                                <button 
                                    type="button"
                                    onClick={() => setOtpSent(false)}
                                    className="text-xs text-sky-600 hover:text-sky-800 font-medium cursor-pointer"
                                >
                                    Wrong email? Change it.
                                </button>
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        onClick={isRegistering ? (otpSent ? verifyAndRegister : sentOtp) : handleLogin}
                        
                        className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-lg shadow-sky-200 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isLoading ? "Processing..." : (isRegistering ? "Sign Up" : "Sign In")}
                    </button>  
                </form>
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-blue-50 text-gray-500">Or continue with</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-slate-700 font-medium border border-gray-300 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Sign in with Google
                </button>

                <div className="mt-6 text-center text-sm text-slate-600">
                    {isRegistering ? "Already have an account?" : "Don't have an account?"}
                    <button 
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="ml-2 text-sky-600 font-bold hover:underline cursor-pointer"
                    >
                        {isRegistering ? "Log in" : "Sign up"}
                    </button>
                </div>
            </div>
        </div>
    );
}



export default Login;