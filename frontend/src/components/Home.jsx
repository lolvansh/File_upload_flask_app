import React from "react";
import Login from "./Login";
import appPreview from "../assets/appPreview.png"

function Home({ onLogin }) {
    return (
        <div className="min-h-screen flex flex-col w-full font-sans text-slate-900">

            {/* --- HEADER --- */}
            <header className="w-full py-4 px-6 lg:px-12 flex justify-between items-center max-w-7xl mx-auto">
                <div className="text-2xl font-bold tracking-tight text-slate-900">
                    Image<span className="text-sky-600">Keep</span>
                </div>
                <nav className="hidden sm:flex gap-6 text-sm font-medium text-slate-500">
                    <a href="#how-it-works" className="hover:text-sky-600 transition-colors">How it Works</a>
                </nav>
            </header>

            {/* --- MAIN CONTENT WRAPPER --- */}
            <main className="flex-grow w-full">

                {/* 1. HERO SECTION */}
                <section className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-20 w-full">
                        
                        {/* LEFT SIDE (Desktop) / TOP (Mobile) */}
                        <div className="w-full lg:w-auto max-w-lg space-y-6 text-center lg:text-left animate-in slide-in-from-left-10 duration-700">
                            <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
                                Store your <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-blue-800">
                                    Moments.
                                </span>
                            </h1>

                            {/* Desktop Details */}
                            <div className="hidden lg:block space-y-6">
                                <p className="text-lg text-slate-600 leading-relaxed">
                                    ImageKeep is your private, secure cloud gallery. Upload photos, add notes, 
                                    and keep your memories safe in one beautiful place.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start text-sm font-semibold text-slate-500">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Secure Storage
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-sky-500"></span> Fast Uploads
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-purple-500"></span> Private Notes
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* RIGHT SIDE (Login Box) */}
                        <div className="w-full max-w-md animate-in slide-in-from-right-10 duration-700 relative z-10">
                            <Login onLogin={onLogin} />
                        </div>

                        {/* MOBILE DETAILS (Bottom) */}
                        <div className="lg:hidden w-full max-w-lg space-y-6 text-center animate-in slide-in-from-bottom-10 duration-700">
                            <p className="text-lg text-slate-600 leading-relaxed">
                                ImageKeep is your private, secure cloud gallery. Upload photos, add notes, 
                                and keep your memories safe in one beautiful place.
                            </p>
                            <div className="flex sm:flex-row gap-4 justify-center text-sm font-semibold text-slate-500">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Secure Storage
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-sky-500"></span> Fast Uploads
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span> Private Notes
                                </span>
                            </div>
                        </div>

                    </div>
                </section>

                {/* 2. HOW IT WORKS SECTION (Full Width Background) */}
                <section id="how-it-works" className="w-full py-20 px-6 ">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need in one place</h2>
                            <p className="text-slate-500 max-w-2xl mx-auto">
                                No complicated folders. Just a simple, beautiful timeline of your life's most important snapshots.
                            </p>
                        </div>

                        {/* MOCK SCREENSHOT */}
                        <div className="relative rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden mx-auto max-w-4xl transform hover:scale-[1.01] transition-transform duration-500">
    
                        {/* Browser Window Header */}
                        <div className="bg-slate-50 border-b border-slate-200 p-3 flex gap-2 items-center">
                            <div className="w-3 h-3 rounded-full bg-red-400 shadow-sm"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400 shadow-sm"></div>
                            <div className="ml-4 bg-white border border-slate-200 px-3 py-1 rounded-md text-xs text-slate-400 flex-1 text-center font-mono shadow-sm">
                                imagekeep.app/gallery
                            </div>
                        </div>
                        
                        {/* Image Container with Border */}
                        <div className="relative bg-white group">
                            {/* The Image */}
                            <img 
                                src={appPreview} 
                                alt="App Screenshot" 
                                className="w-full h-auto object-cover border-t border-slate-100" 
                            />
                            
                            {/* A subtle inner border overlay (The "Nice Border" effect) */}
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-b-xl pointer-events-none"></div>
                        </div>

                    </div>

                        {/* STEPS GRID */}
                        <div className="grid md:grid-cols-3 gap-8 mt-16 text-center">
                            <Step number="1" title="Sign Up" desc="Create a free account using email or Google." />
                            <Step number="2" title="Upload" desc="Drag and drop your favorite photos instantly." />
                            <Step number="3" title="Access" desc="View your gallery from any device, anywhere." />
                        </div>
                    </div>
                </section>

            </main>

            {/* --- FOOTER --- */}
            {/* --- FOOTER --- */}
            <footer className="w-full py-8 px-6 bg-white border-t border-slate-200">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-slate-400 text-sm">
                        Made By Vansh Pandya
                    </div>
                    
                    {/* Social Links Container */}
                    <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-slate-500">
                        
                        {/* LinkedIn */}
                        <a 
                            href="https://www.linkedin.com/in/vansh-pandya-3896aa266/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 hover:text-sky-600 transition-colors group"
                        >
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                            <span>LinkedIn</span>
                        </a>

                        {/* GitHub */}
                        <a 
                            href="https://github.com/lolvansh" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 hover:text-sky-600 transition-colors group"
                        >
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.419-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                            <span>GitHub</span>
                        </a>

                        {/* Instagram */}
                        <a 
                            href="https://www.instagram.com/vanshhpandya/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 hover:text-sky-600 transition-colors group"
                        >
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            <span>Instagram</span>
                        </a>
                        
                    </div>
                </div>
            </footer>
        </div>
    )
}


function Step({ number, title, desc }) {
    return (
        <div className="space-y-3">
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 font-bold flex items-center justify-center mx-auto text-lg">
                {number}
            </div>
            <h3 className="font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
        </div>
    )
}

export default Home;