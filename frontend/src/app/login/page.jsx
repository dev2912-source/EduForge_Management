"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Download } from "lucide-react";

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
      const res = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify({ id: data._id, role: data.role, name: data.name, email: data.email, schoolId: data.schoolId }));
        
        // Redirect to dashboard layout which will handle role-based component rendering
        router.push("/dashboard");
      } else {
        setError(data.message || "Invalid credentials. Please try again.");
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
    <div className="h-screen overflow-hidden flex bg-stone-50 font-sans selection:bg-orange-100 selection:text-orange-500">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-8 lg:p-10 bg-stone-900 text-white">
        <div>
          <Link href="/" className="flex items-center space-x-3 mb-8 w-fit">
            <div className="bg-white rounded-2xl p-1.5 shadow-lg shadow-black/20">
              <img src="/logo-main.png" alt="EduFordge Logo" className="h-8 w-auto object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-white leading-none tracking-tight">EDUFORDGE PUBLIC SCHOOL</span>
              <span className="text-[9px] font-bold text-orange-400 tracking-[0.2em] uppercase mt-1">School Management Platform</span>
            </div>
          </Link>
          <h1 className="text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] text-white mb-6">
            The Modern<br />
            <span className="text-orange-400">Heritage.</span>
          </h1>
          <p className="text-stone-300 text-lg leading-relaxed max-w-sm">
            A traditional approach to education, powered by next-generation technology.
          </p>
        </div>
        <div className="pt-8 border-t border-white/10 flex items-center justify-between">
          <a href="#" className="group flex items-center gap-1.5 transition-all duration-200">
            <span className="text-xs text-stone-400 group-hover:text-stone-300 transition-colors">Made by</span>
            <span className="text-xs font-bold text-stone-200 group-hover:text-white transition-colors">EduFordge</span>
          </a>
          <div className="flex space-x-4 text-stone-400 text-xs font-medium">
            <Link href="#" className="hover:text-stone-300 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-stone-300 transition-colors">Support</Link>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 overflow-y-auto lg:overflow-hidden">
        <Link href="/" className="lg:hidden flex flex-col items-center text-center mb-6">
          <img src="/logo-main.png" alt="EduFordge Logo" className="h-10 w-auto object-contain mb-2 drop-shadow-md" />
        </Link>
        
        <div className="w-full max-w-sm">
          <div className="mb-5 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-stone-900">Sign in</h2>
            <p className="mt-1.5 text-sm text-stone-500">Enter your credentials to continue.</p>
          </div>

          <div className="flex rounded-xl p-1 mb-4 bg-stone-100 border border-stone-200">
            <button
              type="button"
              onClick={() => setLoginMode("campus")}
              className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${loginMode === "campus" ? "bg-white text-stone-900 shadow-sm border border-stone-200" : "text-stone-500 hover:text-stone-900"}`}
            >
              Campus
            </button>
            <button
              type="button"
              onClick={() => setLoginMode("admin")}
              className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${loginMode === "admin" ? "bg-white text-stone-900 shadow-sm border border-stone-200" : "text-stone-500 hover:text-stone-900"}`}
            >
              Admin
            </button>
          </div>

          <form className="space-y-3" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl flex items-start gap-3">
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="identifier" className="block text-xs font-bold text-stone-500 mb-1.5">
                {loginMode === "admin" ? "Email Address" : "Staff / Student ID"}
              </label>
              <input
                id="identifier"
                type="text"
                className="appearance-none block w-full px-3 py-2.5 border border-stone-200 rounded-xl shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white text-stone-900 text-sm font-mono transition-all uppercase"
                placeholder={loginMode === "admin" ? "demo@edufordge.com" : "e.g. STF-2024-0001"}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-stone-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="appearance-none block w-full px-3 py-2.5 pr-10 border border-stone-200 rounded-xl shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white text-stone-900 text-sm transition-all"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-400 hover:text-stone-900 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <div className="relative w-4 h-4 flex-shrink-0">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-4 h-4 rounded border-2 transition-colors peer-checked:border-0 border-stone-300 bg-white peer-checked:bg-orange-400"></div>
                </div>
                <span className="text-xs font-medium text-stone-500 transition-colors group-hover:text-stone-900">
                  Remember me
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-400 hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-400/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-orange-400/20"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Sign in"}
            </button>

            <Link href="#" className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border-2 border-orange-400 text-orange-400 text-sm font-semibold hover:bg-orange-50 transition-colors">
              <Download size={14} /> Get the App
            </Link>
          </form>

          {/* Live Demo Credentials Table */}
          <div className="mt-4 rounded-xl border border-stone-200 overflow-hidden bg-white shadow-sm">
            <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-stone-50 border-b border-stone-200">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-green-500 shadow-[0_0_0_0_rgba(34,197,94,0.4)] animate-pulse"></span>
              <span className="text-xs font-bold text-stone-600">Live Demo — click Try to auto-fill</span>
            </div>
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="text-left px-3 py-1.5 font-semibold text-stone-400">Role</th>
                  <th className="text-left px-3 py-1.5 font-semibold text-stone-400">Credentials</th>
                  <th className="px-3 py-1.5"></th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-stone-100">
                  <td className="px-3 py-1.5 font-semibold text-stone-900 whitespace-nowrap">Admin</td>
                  <td className="px-3 py-1.5 font-mono text-stone-500">
                    demo@edufordge.com<br /><span className="text-stone-400">Test@123</span>
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <button 
                      onClick={() => handleDemoFill('admin')}
                      className="text-[10px] font-bold px-2 py-1 rounded-md transition-colors bg-orange-400 hover:bg-orange-500 text-white shadow-sm"
                    >
                      Try
                    </button>
                  </td>
                </tr>
                <tr className="border-b border-stone-100">
                  <td className="px-3 py-1.5 font-semibold text-stone-900 whitespace-nowrap">Staff</td>
                  <td className="px-3 py-1.5 font-mono text-stone-500">
                    STF-2026-0001<br /><span className="text-stone-400">Test@123</span>
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <button 
                      onClick={() => handleDemoFill('staff')}
                      className="text-[10px] font-bold px-2 py-1 rounded-md transition-colors bg-orange-400 hover:bg-orange-500 text-white shadow-sm"
                    >
                      Try
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-1.5 font-semibold text-stone-900 whitespace-nowrap">Student</td>
                  <td className="px-3 py-1.5 font-mono text-stone-500">
                    STU-2026-0001<br /><span className="text-stone-400">Test@123</span>
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <button 
                      onClick={() => handleDemoFill('student')}
                      className="text-[10px] font-bold px-2 py-1 rounded-md transition-colors bg-orange-400 hover:bg-orange-500 text-white shadow-sm"
                    >
                      Try
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
        </div>
      </div>
    </div>
  );
}
