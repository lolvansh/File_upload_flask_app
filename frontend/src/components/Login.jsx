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
    const [isRegistering, setIsRegistering] = useState(true);
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
        if (!validateInputs()) return;
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

    const validateInputs = () => {
        if (!email.trim().toLowerCase().endsWith('@gmail.com')) {
            toast.error("Only @gmail.com emails are allowed");
            return false;
        }
        if (password.trim().length < 8) {
            toast.error("Password must be at least 8 characters");
            return false;
        }
        return true;
    };

    const sentOtp = async () => {
        if (!validateInputs()) return;
        setIsLoading(true);
        const loadingId = toast.loading("Sending code...");
        try{
            const response = await fetch(`${API_URL}/api/send-otp`,{
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
            const data = await response.json(); 
            if(!response.ok) throw new Error(data.error || "Failed");
            toast.success("Code sent! plese check your spam", {id: loadingId, duration: 6000});
            
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

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setOtpSent(false);
        setOtp("");
    };

    // Dynamic color classes based on mode (Orange for Login, Rose for Register)
    const focusRingColor = isRegistering ? "focus:ring-rose-500" : "focus:ring-orange-500";
    const focusBorderColor = isRegistering ? "focus:border-rose-500" : "focus:border-orange-500";
    const iconFocusColor = isRegistering ? "group-focus-within:text-rose-600" : "group-focus-within:text-orange-600";

    return (
        <div className="flex items-center justify-center min-h-[500px] w-full p-0 sm:p-4">
            

            <div className="w-full max-w-[400px] bg-white border border-slate-200 shadow-xl rounded-2xl p-6 sm:p-8 transition-all duration-300">
                
                {/* HEADER */}
                <div key={isRegistering ? "register" : "login"} className="text-center mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h2 className="text-2xl font-bold text-stone-800 tracking-tight">
                        {isRegistering ? (otpSent ? "Check your Inbox" : "Create Account") : "Welcome Back"}
                    </h2>
                    <p className="text-sm text-stone-500 mt-2">
                        {isRegistering 
                            ? (otpSent ? `We sent a code to ${email}` : "Enter your email to get started") 
                            : "Please sign in to your gallery"}
                    </p>
                </div>

                <form onSubmit={(e) => e.preventDefault()} className="space-y-5" onKeyDown={handleKeyPress}>
                    
                    {/* INPUT FIELDS */}
                    <div className="space-y-4">
                        {!otpSent && (
                            <>
                                {/* EMAIL INPUT */}
                                <div className="group animate-in fade-in slide-in-from-left-4 duration-300">
                                    <label className="block text-xs font-semibold text-stone-500 uppercase mb-1.5">Email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className={`h-5 w-5 text-stone-400 ${iconFocusColor} transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                            </svg>
                                        </div>
                                        <input 
                                            type="email"
                                            value={email}
                                            onChange={(e)=> setEmail(e.target.value)}
                                            className={`w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white ${focusBorderColor} focus:ring-1 ${focusRingColor} outline-none transition-all text-stone-800 placeholder:text-stone-400 font-medium`}
                                            placeholder="name@example.com"
                                            required 
                                        />
                                    </div>
                                </div>

                                {/* PASSWORD INPUT */}
                                <div className="group animate-in fade-in slide-in-from-left-4 duration-300 delay-75">
                                    <label className="block text-xs font-semibold text-stone-500 uppercase mb-1.5">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className={`h-5 w-5 text-stone-400 ${iconFocusColor} transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <input 
                                            type="password" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className={`w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white ${focusBorderColor} focus:ring-1 ${focusRingColor} outline-none transition-all text-stone-800 placeholder:text-stone-400 font-medium`}
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* OTP SECTION */}
                        {isRegistering && otpSent && (
                            <div className="animate-in zoom-in-95 fade-in duration-300">
                                <label className="block text-center text-xs font-semibold text-stone-500 uppercase mb-3">Verification Code</label>
                                <input 
                                    type="text" 
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={6}
                                    className={`w-full py-3 text-center text-2xl font-bold tracking-[0.5em] rounded-lg bg-white border-2 border-stone-200 ${focusBorderColor} focus:ring-0 outline-none transition-all text-stone-800`}
                                    placeholder="••••••"
                                    autoFocus
                                    required
                                />
                                <button 
                                    type="button"
                                    onClick={() => setOtpSent(false)}
                                    className="w-full mt-4 text-xs text-stone-500 hover:text-stone-800 hover:bg-stone-50 py-2 rounded transition-colors"
                                >
                                    ← Use a different email
                                </button>
                            </div>
                        )}
                    </div>

                    {/* MAIN BUTTON (Orange for Login, Rose for Register) */}
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        onClick={isRegistering ? (otpSent ? verifyAndRegister : sentOtp) : handleLogin}
                        className={`w-full py-3 px-4 font-bold rounded-lg text-white shadow-md transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed
                            ${isRegistering ? "bg-rose-600 hover:bg-rose-700" : "bg-orange-600 hover:bg-orange-700"}
                        `}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Please wait...
                            </span>
                        ) : (
                            isRegistering 
                                ? (otpSent ? "Verify & Register" : "Sign Up") 
                                : "Sign In"
                        )}
                    </button>  
                </form>

                {/* DIVIDER & SOCIAL */}
                {!otpSent && (
                    <div className="mt-8 animate-in fade-in duration-500 delay-100">
                        
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-stone-200"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase font-semibold text-stone-400">
                                <span className="bg-white px-2">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full py-3 px-4 bg-white hover:bg-stone-50 text-stone-700 font-semibold border border-stone-200 rounded-lg transition-all flex items-center justify-center gap-3 cursor-pointer"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span>Google</span>
                            </button>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-stone-500 text-sm">
                                {isRegistering ? "Already have an account?" : "Don't have an account?"}
                                <button 
                                    onClick={toggleMode}
                                    className={`ml-2 font-bold hover:underline cursor-pointer transition-colors ${isRegistering ? "text-rose-600 hover:text-rose-800" : "text-orange-600 hover:text-orange-800"}`}
                                >
                                    {isRegistering ? "Log In" : "Sign Up"}
                                </button>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Login;