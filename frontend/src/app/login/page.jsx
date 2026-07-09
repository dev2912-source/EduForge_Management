"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Download } from "lucide-react";
import { loginUser } from "@/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginMode, setLoginMode] = useState("campus"); // campus or admin

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await loginUser(identifier, password);

      if (result.success) {
        // Keep localStorage as fallback for components reading synchronously on mount
        localStorage.setItem("token", result.user.token);
        localStorage.setItem("user", JSON.stringify({ 
          id: result.user._id, role: result.user.role, name: result.user.name, 
          email: result.user.email, schoolId: result.user.schoolId 
        }));
        
        router.push("/dashboard");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (role) => {
    if (role === "admin") {
      setLoginMode("admin");
      setIdentifier("demo@edufordge.com");
      setPassword("Test@123");
    } else if (role === "staff") {
      setLoginMode("campus");
      setIdentifier("STF-2026-0001");
      setPassword("Test@123");
    } else if (role === "student") {
      setLoginMode("campus");
      setIdentifier("STU-2026-0001");
      setPassword("Test@123");
    }
  };

  return (
    <div className="min-h-screen overflow-hidden flex items-center justify-center bg-stone-50 font-sans selection:bg-orange-100 selection:text-orange-500 relative p-4 sm:p-6 lg:p-8">
      {/* Floating Background Shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-orange-400/20 blur-[120px] pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] rounded-full bg-orange-300/20 blur-[140px] pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
      <div className="absolute top-[20%] right-[20%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-stone-200/50 blur-[100px] pointer-events-none mix-blend-multiply"></div>

      {/* Main Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-[1100px] bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Content Area (Branding) */}
        <div className="lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative bg-gradient-to-br from-white/40 to-transparent border-b lg:border-b-0 lg:border-r border-stone-200/40">
          <div>
            <Link href="/" className="flex items-center space-x-3 mb-10 w-fit group">
              <div className="bg-white rounded-2xl p-2 shadow-sm border border-stone-100 group-hover:shadow-md transition-shadow">
                <img src="/logo-main.png" alt="EduFordge Logo" className="h-8 w-auto object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-stone-900 leading-none tracking-tight">EDUFORDGE</span>
                <span className="text-[9px] font-bold text-orange-500 tracking-[0.2em] uppercase mt-1">Management</span>
              </div>
            </Link>
            
            <h1 className="text-4xl sm:text-5xl lg:text-[4rem] font-extrabold leading-[1.05] text-stone-900 mb-6 tracking-tight">
              The Modern<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Heritage.</span>
            </h1>
            
            <p className="text-stone-500 text-lg leading-relaxed max-w-sm font-medium">
              A traditional approach to education, elegantly powered by next-generation technology.
            </p>
          </div>

          <div className="pt-12 mt-8 flex items-center justify-between">
            <a href="#" className="group flex items-center gap-1.5 transition-all duration-200">
              <span className="text-xs font-medium text-stone-400">Made by</span>
              <span className="text-xs font-bold text-stone-700 group-hover:text-orange-500 transition-colors">EduFordge</span>
            </a>
            <div className="flex space-x-4 text-stone-400 text-xs font-semibold">
              <Link href="#" className="hover:text-stone-800 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-stone-800 transition-colors">Terms</Link>
            </div>
          </div>
        </div>

        {/* Right Content Area (Login Form) */}
        <div className="lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative bg-white/30">
          <div className="w-full max-w-[380px] mx-auto">
            <div className="mb-8 text-left">
              <h2 className="text-3xl font-black tracking-tight text-stone-900">Welcome back</h2>
              <p className="mt-2 text-sm font-medium text-stone-500">Sign in to your workspace to continue.</p>
            </div>

            <div className="flex p-1 mb-8 bg-stone-100/80 backdrop-blur-md rounded-xl border border-stone-200/60 shadow-inner">
              <button
                type="button"
                onClick={() => setLoginMode("campus")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${loginMode === "campus" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
              >
                Campus
              </button>
              <button
                type="button"
                onClick={() => setLoginMode("admin")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${loginMode === "admin" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
              >
                Admin
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-50/80 backdrop-blur-md border border-red-100 text-red-600 text-sm font-medium p-4 rounded-xl flex items-start gap-3">
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="identifier" className="block text-[11px] font-black text-stone-400 uppercase tracking-widest mb-2">
                  {loginMode === "admin" ? "Email Address" : "Staff / Student ID"}
                </label>
                <input
                  id="identifier"
                  type="text"
                  className="appearance-none block w-full px-4 py-3.5 border border-stone-200 rounded-xl shadow-sm placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white/80 backdrop-blur-sm text-stone-900 text-sm font-mono transition-all uppercase"
                  placeholder={loginMode === "admin" ? "demo@edufordge.com" : "e.g. STF-2024-0001"}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-[11px] font-black text-stone-400 uppercase tracking-widest mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="appearance-none block w-full px-4 py-3.5 pr-12 border border-stone-200 rounded-xl shadow-sm placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white/80 backdrop-blur-sm text-stone-900 text-sm transition-all"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-stone-400 hover:text-orange-500 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                  <div className="relative w-4 h-4 flex-shrink-0">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-4 h-4 rounded border-[1.5px] transition-colors peer-checked:border-0 border-stone-300 bg-white/80 peer-checked:bg-orange-500 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-stone-500 transition-colors group-hover:text-stone-900">
                    Remember me
                  </span>
                </label>
                <Link href="#" className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 mt-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-400/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-orange-400/20 hover:shadow-orange-400/40"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Sign in to Dashboard"}
              </button>
            </form>

            {/* Quick Demo Login */}
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Quick Demo Login</span>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleDemoFill('admin')} className="flex-1 py-2 text-xs font-bold text-stone-600 bg-white/60 hover:bg-white hover:text-orange-500 border border-stone-200/60 rounded-lg shadow-sm transition-all">Admin</button>
                <button type="button" onClick={() => handleDemoFill('staff')} className="flex-1 py-2 text-xs font-bold text-stone-600 bg-white/60 hover:bg-white hover:text-orange-500 border border-stone-200/60 rounded-lg shadow-sm transition-all">Staff</button>
                <button type="button" onClick={() => handleDemoFill('student')} className="flex-1 py-2 text-xs font-bold text-stone-600 bg-white/60 hover:bg-white hover:text-orange-500 border border-stone-200/60 rounded-lg shadow-sm transition-all">Student</button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
