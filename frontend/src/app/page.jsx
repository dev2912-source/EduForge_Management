"use client";
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight,
  CheckCircle2,
  FileText,
  CreditCard,
  CalendarDays,
  Zap,
  ChevronDown,
  BookOpen
} from 'lucide-react';
import Image from 'next/image';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

// Global variable that resets ONLY on a full page refresh
let hasSeenSplashInSession = false;

// ─── Dashboard Screenshot Slider ────────────────────────────────────────────
const SLIDES = [
  { src: "/Screenshot 2026-07-09 115827.png", label: "Admin Dashboard" },
  { src: "/Screenshot 2026-07-09 115858.png", label: "Student Management" },
  { src: "/Screenshot 2026-07-09 115946.png", label: "Fee Collection" },
  { src: "/Screenshot 2026-07-09 120019.png", label: "Salary & Staff" },
  { src: "/Screenshot 2026-07-09 125800.png", label: "Reports & Analytics" },
  { src: "/Screenshot 2026-07-09 125822.png", label: "Academic Records" },
];

function DashboardSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % SLIDES.length);
    }, 3000);
  };

  useEffect(() => {
    if (!paused) startTimer();
    return () => clearInterval(intervalRef.current);
  }, [paused]);

  const goTo = (i) => {
    clearInterval(intervalRef.current);
    setCurrent(i);
    if (!paused) startTimer();
  };

  const prev = () => goTo((current - 1 + SLIDES.length) % SLIDES.length);
  const next = () => goTo((current + 1) % SLIDES.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Glow backdrop */}
      <div className="absolute -inset-4 bg-gradient-to-br from-orange-100/60 via-amber-50/40 to-transparent rounded-[2.5rem] blur-2xl pointer-events-none" />

      {/* Browser chrome wrapper */}
      <div className="relative bg-[#1e1e1e] rounded-2xl shadow-2xl shadow-stone-900/30 overflow-hidden border border-stone-700/60">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#2a2a2a] border-b border-stone-700/50">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]"></span>
          <span className="w-3 h-3 rounded-full bg-[#febc2e]"></span>
          <span className="w-3 h-3 rounded-full bg-[#28c840]"></span>
          <div className="flex-1 mx-4 bg-[#1a1a1a] rounded-md px-3 py-1 text-center text-[11px] font-semibold text-stone-400 tracking-wide truncate max-w-xs mx-auto">
            app.edufordge.com — {SLIDES[current].label}
          </div>
          {/* Pause/play badge */}
          <button
            onClick={() => setPaused(p => !p)}
            className="text-[10px] font-bold text-stone-500 hover:text-orange-400 transition-colors uppercase tracking-widest ml-2 flex-shrink-0"
          >
            {paused ? "▶ Play" : "⏸ Pause"}
          </button>
        </div>

        {/* Slide frame */}
        <div className="relative bg-[#111] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={current}
              src={SLIDES[current].src}
              alt={SLIDES[current].label}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
              className="w-full h-auto block"
            />
          </AnimatePresence>

          {/* Left arrow */}
          <button
            onClick={prev}
            aria-label="Previous screenshot"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-orange-400 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/10 z-10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          {/* Right arrow */}
          <button
            onClick={next}
            aria-label="Next screenshot"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-orange-400 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/10 z-10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          {/* Slide label overlay */}
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white text-[11px] font-bold uppercase tracking-widest drop-shadow-md">
            {SLIDES[current].label}
          </div>
        </div>

        {/* Dot indicators + progress bar */}
        <div className="flex flex-col items-center gap-2 py-4 bg-[#2a2a2a]">
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? 'w-6 h-2 bg-orange-400'
                    : 'w-2 h-2 bg-stone-600 hover:bg-stone-400'
                }`}
              />
            ))}
          </div>
          {/* Thin progress bar */}
          {!paused && (
            <div className="w-40 h-0.5 bg-stone-700 rounded-full overflow-hidden">
              <motion.div
                key={`${current}-progress`}
                className="h-full bg-orange-400 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3, ease: 'linear' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 mt-4 justify-center flex-wrap">
        {SLIDES.map((slide, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`relative w-20 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
              i === current
                ? 'border-orange-400 shadow-md shadow-orange-400/30 scale-105'
                : 'border-stone-200 hover:border-orange-300 opacity-70 hover:opacity-100'
            }`}
          >
            <img src={slide.src} alt={slide.label} className="w-full h-full object-contain bg-stone-900" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}
// ────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const [showSplash, setShowSplash] = useState(!hasSeenSplashInSession);
  const [splashPhase, setSplashPhase] = useState(hasSeenSplashInSession ? 'exit' : 'icon'); 
  const [isAnnual, setIsAnnual] = useState(false);
  const contactFormRef = useRef(null);

  useEffect(() => {
    if (hasSeenSplashInSession) {
      setShowSplash(false);
      return;
    }

    // Prevent scrolling while splash is visible
    document.body.style.overflow = 'hidden';
    
    // Phase 1: Icon morphs into logo
    const timer1 = setTimeout(() => {
      setSplashPhase('logo');
    }, 800);

    // Phase 2: Fade out overlay, shrink logo
    const timer2 = setTimeout(() => {
      setSplashPhase('exit');
      document.body.style.overflow = 'auto';
    }, 2200);

    // Phase 3: Completely unmount
    const timer3 = setTimeout(() => {
      setShowSplash(false);
      hasSeenSplashInSession = true;
    }, 3400);
    
    return () => { 
      clearTimeout(timer1); 
      clearTimeout(timer2); 
      clearTimeout(timer3); 
      document.body.style.overflow = 'auto';
    };
  }, []);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', schoolName: '', message: '' });
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const scrollToContact = () => contactFormRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('loading');
    try {
      const res = await fetch(`/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', phone: '', schoolName: '', message: '' });
        setTimeout(() => setSubmitStatus(null), 5000);
      } else {
        setSubmitStatus('error');
        setErrorMessage(data.error || 'Something went wrong');
      }
    } catch (err) {
      setSubmitStatus('error');
      setErrorMessage('Failed to connect to the server.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf9] text-stone-800 font-sans selection:bg-orange-100 selection:text-orange-500 overflow-x-hidden relative">
      
      {/* Global Background (Graph Paper + Ambient Glows) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-orange-400/10 rounded-full blur-[80px] mix-blend-multiply"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-yellow-400/10 rounded-full blur-[80px] mix-blend-multiply"></div>
      </div>

      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#fdfbf9] overflow-hidden"
          >
            {/* Graph Paper Pattern Background (to match the global background while covering content) */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-orange-400/10 rounded-full blur-[80px] pointer-events-none mix-blend-multiply"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-yellow-400/10 rounded-full blur-[80px] pointer-events-none mix-blend-multiply"></div>
            
            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-sm px-6">
              
              <AnimatePresence mode="wait">
                {splashPhase === 'icon' && (
                  <motion.div
                    key="icon"
                    initial={{ scale: 0.5, opacity: 0, rotateY: 90 }}
                    animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                    exit={{ scale: 1.2, opacity: 0, filter: 'blur(10px)' }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-24 h-24 bg-white shadow-xl shadow-orange-400/20 rounded-3xl flex items-center justify-center border border-orange-100"
                  >
                    <BookOpen size={48} className="text-orange-400" strokeWidth={1.5} />
                  </motion.div>
                )}

                {(splashPhase === 'logo' || splashPhase === 'exit') && (
                  <motion.div
                    key="logo"
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ 
                      scale: splashPhase === 'exit' ? 0.6 : 1, 
                      opacity: splashPhase === 'exit' ? 0 : 1,
                      y: splashPhase === 'exit' ? -50 : 0
                    }}
                    transition={{ duration: splashPhase === 'exit' ? 1.2 : 0.6, ease: "backOut" }}
                    className="flex flex-col items-center"
                  >
                    <img src="/logo-main.png" alt="EduFordge" className="h-28 md:h-36 w-auto object-contain drop-shadow-2xl" />
                    
                    {/* Glowing Circular Progress Loader */}
                    {splashPhase === 'logo' && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-12 relative flex items-center justify-center"
                      >
                        <svg className="w-14 h-14 -rotate-90 transform drop-shadow-md" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#ffedd5" strokeWidth="6" />
                          <motion.circle 
                            cx="50" cy="50" r="45" 
                            fill="none" 
                            stroke="#f97316" 
                            strokeWidth="6" 
                            strokeLinecap="round"
                            initial={{ strokeDasharray: "0 283" }}
                            animate={{ strokeDasharray: "283 283" }}
                            transition={{ duration: 1.2, ease: "easeInOut" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping"></div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Navigation */}
      <nav className="w-full bg-white/95 backdrop-blur-md border-b border-stone-100 py-4 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10 flex justify-between items-center">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/logo-main.png" alt="EduFordge Icon" className="h-10 md:h-12 w-auto object-contain" />
            <div className="flex flex-col">
               <span className="font-black text-[22px] leading-none tracking-tight"><span className="text-stone-900">Edu</span><span className="text-orange-400">Fordge</span></span>
               <span className="text-[7px] font-bold tracking-[0.2em] text-stone-500 mt-1">LEARN | GROW | SUCCEED</span>
            </div>
          </div>
          
          {/* Nav Links */}
          <div className="hidden lg:flex items-center gap-8 font-bold text-sm text-stone-500">
            <Link href="#features" className="hover:text-stone-900 transition-colors">Features</Link>
            <Link href="#modules" className="hover:text-stone-900 transition-colors">Modules</Link>
            <Link href="#pricing" className="hover:text-stone-900 transition-colors">Pricing</Link>
            <Link href="#contact" className="hover:text-stone-900 transition-colors">Contact</Link>
            <Link href="#about" className="hover:text-stone-900 transition-colors">About</Link>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-5">
            <Link href="/login" className="flex items-center gap-2 border border-orange-200 text-orange-500 px-5 py-2 rounded-full font-bold text-sm hover:bg-orange-50 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              Live Demo
            </Link>
            <Link href="/login" className="font-bold text-sm text-stone-600 hover:text-stone-900 transition-colors">
              Login
            </Link>
            <Link href="/login" className="bg-orange-400 hover:bg-orange-500 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-sm transition-all hover:shadow-md">
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-8 lg:pt-12 pb-24 overflow-hidden">
        {/* Ambient Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-400/20 blur-[100px] animate-blob"></div>
           <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full bg-yellow-400/20 blur-[100px] animate-blob animation-delay-2000"></div>
           <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] rounded-full bg-pink-400/20 blur-[100px] animate-blob animation-delay-4000"></div>
        </div>
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10 relative z-10">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="max-w-xl">
              
              <div className="inline-flex items-center gap-2 text-orange-400 font-bold text-[11px] uppercase tracking-[0.2em] mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                BUILT FOR INDIAN SCHOOLS
              </div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-[3.5rem] lg:text-[4.5rem] font-black tracking-tight leading-[1.05] mb-6 text-stone-900"
              >
                The smarter way to <br/>
                <motion.span 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-orange-400"
                >
                  run your school
                </motion.span>
              </motion.h1>
              
              <p className="text-lg text-stone-500 font-medium leading-relaxed mb-10 max-w-lg">
                Admissions, fees, salary, classes — managed from one place.<br/>
                Designed for schools across India, from small town to metro.
              </p>
              
              <div className="flex flex-col sm:flex-row items-start gap-4 mb-10">
                <button onClick={scrollToContact} className="bg-orange-400 hover:bg-orange-500 text-white px-7 py-3.5 rounded-xl font-bold text-base shadow-lg shadow-orange-400/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2">
                  Get Started Free
                  <ArrowRight size={18} strokeWidth={2.5} />
                </button>
                <Link href="/login" className="bg-white border-2 border-orange-200 text-orange-500 px-7 py-3.5 rounded-xl font-bold text-base hover:bg-orange-50 transition-all flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  Live Demo
                </Link>
              </div>

              {/* Trust Section */}
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {/* Mock Avatars */}
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-100 overflow-hidden relative shadow-sm">
                     <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=100&auto=format&fit=crop')] bg-cover"></div>
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-orange-100 overflow-hidden relative shadow-sm z-10">
                     <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=100&auto=format&fit=crop')] bg-cover"></div>
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-green-100 overflow-hidden relative shadow-sm z-20">
                     <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1580894732444-8ecded7900cd?q=80&w=100&auto=format&fit=crop')] bg-cover"></div>
                  </div>
                </div>
                <div className="flex flex-col">
                   <span className="text-sm font-black text-stone-900">Trusted by schools</span>
                   <span className="text-xs font-medium text-stone-500">across India</span>
                </div>
              </div>
              
            </div>

            {/* Right Graphic: Before & After */}
            <div className="hidden lg:flex relative w-full h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl animate-float">
               
               {/* Left Side: Before */}
               <div className="w-[55%] h-full bg-[#f8f3eb] relative p-8 border-r-2 border-dashed border-orange-200/50">
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[11px] font-black tracking-[0.2em] text-orange-300 uppercase">
                     Before
                  </div>

                  {/* Messy Papers Illustration */}
                  <div className="relative w-full h-full mt-10">
                     
                     <div className="absolute top-4 left-0 w-28 h-16 bg-white rounded-lg shadow-sm rotate-[-15deg] p-2 flex flex-col gap-1 border border-stone-200">
                        <span className="text-[7px] font-bold text-stone-400">Student Roll</span>
                        <div className="w-full h-1 bg-stone-100 rounded-full"></div>
                        <div className="w-5/6 h-1 bg-stone-100 rounded-full"></div>
                     </div>

                     <div className="absolute top-12 left-28 w-24 h-32 bg-white rounded-lg shadow-md rotate-[10deg] p-2 flex flex-col gap-1.5 border border-blue-100">
                        <span className="text-[8px] font-bold text-blue-400">Salary Book</span>
                        <div className="w-full h-1.5 bg-blue-50 rounded-full mt-1"></div>
                        <div className="w-4/5 h-1.5 bg-blue-50 rounded-full"></div>
                        <div className="w-full h-1.5 bg-blue-50 rounded-full"></div>
                        <div className="w-2/3 h-1.5 bg-blue-50 rounded-full"></div>
                     </div>

                     <div className="absolute top-36 -left-2 w-32 h-40 bg-white rounded-lg shadow-md rotate-[-5deg] p-3 flex flex-col gap-2 border border-pink-100">
                        <span className="text-[9px] font-bold text-pink-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span> Fee Register</span>
                        <div className="w-full h-1.5 bg-stone-100 rounded-full mt-2"></div>
                        <div className="w-full h-1.5 bg-stone-100 rounded-full"></div>
                        <div className="w-full h-1.5 bg-stone-100 rounded-full"></div>
                        <div className="w-full h-1.5 bg-stone-100 rounded-full"></div>
                        <div className="w-4/5 h-1.5 bg-stone-100 rounded-full"></div>
                     </div>

                     <div className="absolute top-48 left-20 w-32 h-36 bg-white rounded-lg shadow-lg rotate-[8deg] p-3 flex flex-col gap-2 border border-yellow-100">
                        <span className="text-[9px] font-bold text-yellow-500">Attendance</span>
                        <div className="w-full h-1.5 bg-stone-100 rounded-full mt-2"></div>
                        <div className="w-full h-1.5 bg-stone-100 rounded-full"></div>
                        <div className="w-full h-1.5 bg-stone-100 rounded-full"></div>
                        <div className="w-5/6 h-1.5 bg-stone-100 rounded-full"></div>
                     </div>

                     <div className="absolute top-28 right-8 text-pink-300">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                     </div>
                     <div className="absolute top-16 right-16 text-stone-300">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                     </div>
                     <div className="absolute bottom-20 right-4 text-orange-200">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                     </div>
                     
                     {/* The Books Stack at bottom */}
                     <div className="absolute bottom-0 left-2 w-48 flex flex-col items-center">
                        <div className="w-[120%] h-8 bg-[#9b7b56] rounded-t-lg rounded-b-sm border-b-2 border-stone-800/20 relative z-30 flex items-center justify-center">
                           <span className="text-[8px] font-black text-white/70 uppercase tracking-widest">Student Register</span>
                        </div>
                        <div className="w-[110%] h-6 bg-[#68533a] rounded-sm relative z-20 flex items-center justify-center"></div>
                        <div className="w-[115%] h-7 bg-[#a4845e] rounded-b-lg rounded-t-sm shadow-md relative z-10 flex items-center justify-center"></div>
                     </div>
                  </div>
               </div>

               {/* Right Side: After */}
               <div className="w-[60%] h-full bg-[#fdfbf9] relative p-8">
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[11px] font-black tracking-[0.2em] text-orange-400 uppercase">
                     After
                  </div>

                  {/* Transition Arrow over the middle */}
                  <div className="absolute top-[45%] -left-12 z-50 flex flex-col items-center drop-shadow-sm">
                     <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
                        <line x1="0" y1="12" x2="22" y2="12"></line>
                        <polyline points="15 5 22 12 15 19"></polyline>
                     </svg>
                     <span className="text-[10px] font-black tracking-widest text-orange-400 uppercase mt-1">EduFordge</span>
                  </div>

                  {/* Clean Dashboard Monitor */}
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[85%] bg-[#222] rounded-xl shadow-2xl p-1.5 pb-3">
                     <div className="w-full bg-[#111] rounded-lg h-56 flex flex-col overflow-hidden relative">
                        {/* Topbar */}
                        <div className="h-6 bg-orange-400 flex items-center justify-between px-3">
                           <span className="text-[8px] font-bold text-white flex items-center gap-1">
                              <span className="w-3 h-3 bg-white/20 rounded-md flex items-center justify-center text-white">E</span>
                              EduFordge
                           </span>
                           <span className="text-[7px] bg-black/20 px-1.5 py-0.5 rounded text-white font-bold">Admin</span>
                        </div>
                        
                        {/* Dash content */}
                        <div className="p-3">
                           <div className="grid grid-cols-3 gap-2 mb-3">
                              <div className="bg-[#222] rounded-md p-2 flex flex-col justify-center">
                                 <span className="text-[6px] font-bold text-stone-400 uppercase tracking-wider mb-1">Students</span>
                                 <span className="text-xl font-black text-white leading-none mb-1">247</span>
                                 <span className="text-[6px] text-green-400 flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Active</span>
                              </div>
                              <div className="bg-[#222] rounded-md p-2 flex flex-col justify-center">
                                 <span className="text-[6px] font-bold text-stone-400 uppercase tracking-wider mb-1">Staff</span>
                                 <span className="text-xl font-black text-white leading-none mb-1">18</span>
                                 <span className="text-[6px] text-stone-400 flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-stone-500"></span> Members</span>
                              </div>
                              <div className="bg-[#222] rounded-md p-2 flex flex-col justify-center">
                                 <span className="text-[6px] font-bold text-stone-400 uppercase tracking-wider mb-1">Fees Due</span>
                                 <span className="text-lg font-black text-green-400 flex items-center gap-1 my-1">
                                    <CheckCircle2 size={12} />
                                 </span>
                                 <span className="text-[6px] text-green-400">All Paid</span>
                              </div>
                           </div>

                           <div className="flex gap-2 h-20">
                              <div className="flex-[2] bg-[#222] rounded-md p-2 relative flex flex-col">
                                 <span className="text-[6px] font-bold text-stone-400 uppercase tracking-wider mb-2">Fee Collection</span>
                                 <div className="flex-1 flex items-end justify-between px-1 gap-1">
                                    <div className="w-full bg-orange-500 rounded-t-sm" style={{height: "30%"}}></div>
                                    <div className="w-full bg-orange-500 rounded-t-sm" style={{height: "50%"}}></div>
                                    <div className="w-full bg-orange-500 rounded-t-sm" style={{height: "80%"}}></div>
                                    <div className="w-full bg-orange-500 rounded-t-sm" style={{height: "90%"}}></div>
                                    <div className="w-full bg-orange-400 rounded-t-sm" style={{height: "100%"}}></div>
                                    <div className="w-full bg-orange-900 rounded-t-sm" style={{height: "15%"}}></div>
                                 </div>
                                 <div className="flex justify-between px-1 mt-1">
                                    <span className="text-[4px] text-stone-500">Dec</span>
                                    <span className="text-[4px] text-stone-500">Jan</span>
                                    <span className="text-[4px] text-stone-500">Feb</span>
                                    <span className="text-[4px] text-stone-500">Mar</span>
                                    <span className="text-[4px] text-stone-500">Apr</span>
                                    <span className="text-[4px] text-stone-500">May</span>
                                 </div>
                              </div>
                              <div className="flex-1 bg-[#222] rounded-md p-2">
                                 <span className="text-[6px] font-bold text-stone-400 uppercase tracking-wider mb-1 block">Tasks</span>
                                 <div className="flex items-center gap-1 mb-1.5 mt-1.5">
                                    <div className="w-2 h-2 rounded-full bg-green-500 flex items-center justify-center"><CheckCircle2 size={6} className="text-white"/></div>
                                    <div className="h-1 bg-stone-700 rounded-full flex-1"></div>
                                 </div>
                                 <div className="flex items-center gap-1 mb-1.5">
                                    <div className="w-2 h-2 rounded-full bg-green-500 flex items-center justify-center"><CheckCircle2 size={6} className="text-white"/></div>
                                    <div className="h-1 bg-stone-700 rounded-full flex-1"></div>
                                 </div>
                                 <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500 flex items-center justify-center"><CheckCircle2 size={6} className="text-white"/></div>
                                    <div className="h-1 bg-stone-700 rounded-full flex-1"></div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                     {/* Monitor Base */}
                     <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1/3 h-3 bg-[#ccc] rounded-b-lg"></div>
                     <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-1.5 bg-[#bbb] rounded-full"></div>
                  </div>

                  {/* Floating Notification Pills */}
                  <div className="absolute top-20 -left-6 bg-white shadow-xl rounded-full px-3 py-2 flex items-center gap-2 border border-stone-100 z-40">
                     <div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center text-white">
                        <Zap size={12} fill="currentColor" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-stone-900 leading-none">Auto</span>
                        <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider mt-0.5">Invoices</span>
                     </div>
                  </div>

                  <div className="absolute top-24 right-4 bg-white shadow-xl rounded-full px-3 py-2 flex items-center gap-2 border border-stone-100 z-40">
                     <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white">
                        <CheckCircle2 size={14} />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-stone-900 leading-none">PDF</span>
                        <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider mt-0.5">Sent</span>
                     </div>
                  </div>

               </div>
            </div>

          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="bg-white border-t border-stone-100 py-10 mt-10 relative z-10"
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-stone-100">
            {[
              { value: "3", label: "USER ROLES" },
              { value: "6", label: "CORE MODULES" },
              { value: "100%", label: "DIGITAL RECORDS" },
              { value: "Free", label: "ANDROID APP" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center text-center px-4">
                <div className="text-3xl md:text-4xl font-black text-orange-400 mb-1">{stat.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats/Feature Grid */}
      <section id="features" className="bg-[#fdfbf9] py-24 relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-orange-400 font-bold text-[11px] uppercase tracking-[0.2em] mb-4">WHY SCHOOLS CHOOSE EDUFORDGE</h2>
            <h3 className="text-4xl font-black tracking-tight text-stone-900 leading-[1.2]">Built to save your school<br/>time and paperwork</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.0 }}
              className="hover:-translate-y-1.5 transition-transform duration-300"
            >
               <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-500 mb-6">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
               </div>
               <h4 className="text-lg font-black text-stone-900 mb-3">Save Hours Every Week</h4>
               <p className="text-sm font-medium text-stone-500 leading-relaxed">
                 Automate fee invoices, salary slips, and reports that used to take your staff days to prepare by hand.
               </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="hover:-translate-y-1.5 transition-transform duration-300"
            >
               <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-6">
                  <FileText size={20} strokeWidth={2.5} />
               </div>
               <h4 className="text-lg font-black text-stone-900 mb-3">Go Paperless</h4>
               <p className="text-sm font-medium text-stone-500 leading-relaxed">
                 Move student records, registers, and files off paper and into one secure digital system.
               </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hover:-translate-y-1.5 transition-transform duration-300"
            >
               <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-500 mb-6">
                  <CreditCard size={20} strokeWidth={2.5} />
               </div>
               <h4 className="text-lg font-black text-stone-900 mb-3">Faster Fee Collection</h4>
               <p className="text-sm font-medium text-stone-500 leading-relaxed">
                 Auto-generated monthly invoices, instant payment recording, and PDF receipts keep collections on track.
               </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
               <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-500 mb-6">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
               </div>
               <h4 className="text-lg font-black text-stone-900 mb-3">Real-Time Reports</h4>
               <p className="text-sm font-medium text-stone-500 leading-relaxed">
                 See fee collection, attendance, and staff data at a glance — no more waiting on manual registers.
               </p>
            </motion.div>

            {/* Feature 5 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
               <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center text-teal-600 mb-6">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>
               </div>
               <h4 className="text-lg font-black text-stone-900 mb-3">Access Anywhere</h4>
               <p className="text-sm font-medium text-stone-500 leading-relaxed">
                 A web app for admins and a free Android app for staff and students — available wherever they are.
               </p>
            </motion.div>

            {/* Feature 6 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
               <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-500 mb-6">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
               </div>
               <h4 className="text-lg font-black text-stone-900 mb-3">Secure & Backed Up</h4>
               <p className="text-sm font-medium text-stone-500 leading-relaxed">
                 Each school's data is kept separate, access is controlled by role, and records are backed up automatically.
               </p>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Core Modules */}
      <section id="modules" className="bg-[#f8f9fa] py-24 relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-orange-400 font-bold text-[11px] uppercase tracking-[0.2em] mb-4">OUR CORE MODULES</h2>
            <h3 className="text-4xl font-black tracking-tight text-stone-900 leading-[1.2]">Everything your school needs,<br/>nothing it doesn't</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Module 1 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.0 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 hover:shadow-xl hover:shadow-orange-400/20 hover:-translate-y-1.5 transition-all duration-300"
            >
               <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 mb-5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
               </div>
               <h4 className="text-[15px] font-black text-stone-900 mb-2.5">Student Management</h4>
               <p className="text-[13px] font-medium text-stone-500 leading-relaxed">
                 Admissions, profiles, academic history, promotions, and document storage. Every student's journey in one place.
               </p>
            </motion.div>

            {/* Module 2 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 hover:shadow-xl hover:shadow-orange-400/20 hover:-translate-y-1.5 transition-all duration-300"
            >
               <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
               </div>
               <h4 className="text-[15px] font-black text-stone-900 mb-2.5">Staff & Salary</h4>
               <p className="text-[13px] font-medium text-stone-500 leading-relaxed">
                 Manage staff profiles, departments, and salary structures. Monthly payslips generated and emailed automatically.
               </p>
            </motion.div>

            {/* Module 3 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 hover:shadow-xl hover:shadow-orange-400/20 hover:-translate-y-1.5 transition-all duration-300"
            >
               <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 mb-5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
               </div>
               <h4 className="text-[15px] font-black text-stone-900 mb-2.5">Fee Collection</h4>
               <p className="text-[13px] font-medium text-stone-500 leading-relaxed">
                 Automated monthly invoices per student, payment recording, and PDF receipts. Track pending and paid fees instantly.
               </p>
            </motion.div>

            {/* Module 4 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 hover:shadow-xl hover:shadow-orange-400/20 hover:-translate-y-1.5 transition-all duration-300"
            >
               <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
               </div>
               <h4 className="text-[15px] font-black text-stone-900 mb-2.5">Academic Years & Classes</h4>
               <p className="text-[13px] font-medium text-stone-500 leading-relaxed">
                 Set up academic years, classes, and sections. Promote entire batches to next class in a single action at year end.
               </p>
            </motion.div>

            {/* Module 5 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 hover:shadow-xl hover:shadow-orange-400/20 hover:-translate-y-1.5 transition-all duration-300"
            >
               <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 mb-5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
               </div>
               <h4 className="text-[15px] font-black text-stone-900 mb-2.5">Auto PDF Reports</h4>
               <p className="text-[13px] font-medium text-stone-500 leading-relaxed">
                 Fee invoices, payment receipts, and salary slips are auto-generated as PDFs, stored securely, and emailed to users.
               </p>
            </motion.div>

            {/* Module 6 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 hover:shadow-xl hover:shadow-orange-400/20 hover:-translate-y-1.5 transition-all duration-300"
            >
               <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 mb-5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
               </div>
               <h4 className="text-[15px] font-black text-stone-900 mb-2.5">Works on Android</h4>
               <p className="text-[13px] font-medium text-stone-500 leading-relaxed">
                 Full-featured web app for admins. A dedicated Android app — built with your school's name and icon — for staff and students to access records on the go.
               </p>
            </motion.div>

            {/* Module 7 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow"
            >
               <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-pink-500 mb-5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
               </div>
               <h4 className="text-[15px] font-black text-stone-900 mb-2.5">Fully White-Labeled</h4>
               <p className="text-[13px] font-medium text-stone-500 leading-relaxed">
                 Your school gets its own subdomain, branding, and a custom-built Android app — your name, your logo, your colors. Students never see "EduFordge".
               </p>
            </motion.div>

            {/* Module 8 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow"
            >
               <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600 mb-5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
               </div>
               <h4 className="text-[15px] font-black text-stone-900 mb-2.5">Attendance Management</h4>
               <p className="text-[13px] font-medium text-stone-500 leading-relaxed">
                 Daily student attendance, staff clock-in/out, and leave requests — all tracked digitally with reports on demand.
               </p>
            </motion.div>

            {/* Module 9 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow"
            >
               <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
               </div>
               <h4 className="text-[15px] font-black text-stone-900 mb-2.5">Support & Help Desk</h4>
               <p className="text-[13px] font-medium text-stone-500 leading-relaxed">
                 Built-in help desk so staff and students can raise issues and get them resolved without endless phone calls.
               </p>
            </motion.div>

          </div>

        </div>
      </section>

      {/* See it in action */}
      <section className="py-24 bg-white relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-orange-400 font-bold text-[11px] uppercase tracking-[0.2em] mb-4">SEE IT IN ACTION</h2>
            <h3 className="text-4xl font-black tracking-tight text-stone-900 leading-[1.2]">A clean, modern dashboard<br/>your staff will love</h3>
            <p className="mt-4 text-sm font-medium text-stone-500 leading-relaxed">Every screen is intuitive, fast, and built for daily school workflows.</p>
          </div>

          <DashboardSlider />
        </div>
      </section>

      {/* School Life in India */}
      <section id="about" className="py-24 bg-white relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-orange-400 font-bold text-[11px] uppercase tracking-[0.2em] mb-4">SCHOOL LIFE IN INDIA</h2>
            <h3 className="text-4xl font-black tracking-tight text-stone-900 leading-[1.2]">Built for real schools,<br/>real students</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mb-16 h-auto md:h-[500px]">
             <motion.div 
               initial={{ scale: 1.2, opacity: 0 }}
               whileInView={{ scale: 1, opacity: 1 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8, ease: "easeOut" }}
               className="relative rounded-3xl overflow-hidden group h-[300px] md:h-full"
             >
                <img src="https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop" alt="Indian students in classroom" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6">
                   <h4 className="text-white font-bold tracking-widest text-xs uppercase">CLASSROOMS</h4>
                </div>
             </motion.div>
             
             <div className="flex flex-col gap-4 h-[500px] md:h-full">
                <motion.div 
                   initial={{ scale: 1.2, opacity: 0 }}
                   whileInView={{ scale: 1, opacity: 1 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.8, ease: "easeOut" }}
                   className="relative rounded-3xl overflow-hidden flex-1 group"
                >
                   <img src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop" alt="Students learning" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                   <div className="absolute bottom-6 left-6">
                      <h4 className="text-white font-bold tracking-widest text-xs uppercase">LEARNING</h4>
                   </div>
                </motion.div>
                <motion.div 
                   initial={{ scale: 1.2, opacity: 0 }}
                   whileInView={{ scale: 1, opacity: 1 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.8, ease: "easeOut" }}
                   className="relative rounded-3xl overflow-hidden flex-1 group"
                >
                   <img src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=2070&auto=format&fit=crop" alt="Student focus" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                   <div className="absolute bottom-6 left-6">
                      <h4 className="text-white font-bold tracking-widest text-xs uppercase">FOCUS</h4>
                   </div>
                </motion.div>
             </div>
          </div>
          
          <div className="bg-[#fff9f2] rounded-2xl p-8 md:p-10 border-l-[3px] border-orange-400 max-w-4xl mx-auto shadow-sm">
             <p className="text-stone-800 text-lg italic font-medium leading-relaxed mb-4">
                "EduFordge has made fee collection, salary management, and student records completely paperless for us."
             </p>
             <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">— School Administrator</p>
          </div>
        </div>
      </section>

      {/* Simple by design - How it works */}
      <section className="bg-[#f8f9fa] py-24 relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-orange-400 font-bold text-[11px] uppercase tracking-[0.2em] mb-4">SIMPLE BY DESIGN</h2>
            <h3 className="text-4xl font-black tracking-tight text-stone-900 leading-[1.2]">Up and running in minutes</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10 relative">
             <div className="hidden md:block absolute top-8 left-[15%] right-[15%] h-[2px] bg-stone-200 border-t-2 border-dashed border-stone-300"></div>
             
             <div className="relative flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white border-[4px] border-orange-400 rounded-full flex items-center justify-center text-xl font-black text-stone-900 mb-6 relative z-10 shadow-sm">01</div>
                <h4 className="text-lg font-black text-stone-900 mb-3">Set up your school</h4>
                <p className="text-sm font-medium text-stone-500 leading-relaxed max-w-[280px]">
                  Enter your school profile, departments, academic year, and class structure. Takes under 10 minutes.
                </p>
             </div>
             
             <div className="relative flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white border-[4px] border-orange-400 rounded-full flex items-center justify-center text-xl font-black text-stone-900 mb-6 relative z-10 shadow-sm">02</div>
                <h4 className="text-lg font-black text-stone-900 mb-3">Add staff & students</h4>
                <p className="text-sm font-medium text-stone-500 leading-relaxed max-w-[280px]">
                  Bulk-add or register one by one. Credentials are auto-generated and emailed to each user.
                </p>
             </div>
             
             <div className="relative flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white border-[4px] border-orange-400 rounded-full flex items-center justify-center text-xl font-black text-stone-900 mb-6 relative z-10 shadow-sm">03</div>
                <h4 className="text-lg font-black text-stone-900 mb-3">Everything runs automatically</h4>
                <p className="text-sm font-medium text-stone-500 leading-relaxed max-w-[280px]">
                  Fee invoices, salary slips, PDF generation, and email notifications — all handled on the 1st of each month.
                </p>
             </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white relative z-10">
         <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
               <h2 className="text-orange-400 font-bold text-[11px] uppercase tracking-[0.2em] mb-4">SIMPLE, TRANSPARENT PRICING</h2>
               <h3 className="text-4xl font-black tracking-tight text-stone-900 leading-[1.2]">Plans that grow with your school</h3>
               <div className="mt-8 inline-flex items-center bg-stone-100 rounded-full p-1 border border-stone-200">
                  <button onClick={() => setIsAnnual(false)} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${!isAnnual ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-900'}`}>Monthly</button>
                  <button onClick={() => setIsAnnual(true)} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${isAnnual ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-900'}`}>Annual <span className="text-[10px] text-green-600 bg-green-100 px-2 py-0.5 rounded-full ml-1">Save 2 months</span></button>
               </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
               
               {/* Free Plan */}
               <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-sm">
                  <h4 className="text-xl font-black text-stone-900 mb-2">Free</h4>
                  <div className="flex items-baseline gap-1 mb-4">
                     <span className="text-4xl font-black text-stone-900">₹0</span>
                  </div>
                  <p className="text-sm text-stone-500 font-medium mb-8 h-10">For small schools getting started with digital records.</p>
                  
                  <ul className="space-y-4 mb-8 text-sm font-medium text-stone-700">
                     <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-500 flex-shrink-0" /> Up to 5 staff</li>
                     <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-500 flex-shrink-0" /> Up to 200 students</li>
                     <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-500 flex-shrink-0" /> All core modules</li>
                     <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-500 flex-shrink-0" /> Email notifications</li>
                  </ul>
                  
                  <Link href="/login" className="block w-full py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-center rounded-xl transition-colors">
                     Get Started Free
                  </Link>
               </div>

               {/* Standard Plan */}
               <div className="bg-stone-900 rounded-3xl border border-stone-800 p-8 shadow-2xl relative transform lg:-translate-y-4">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-[0.1em] px-3 py-1 rounded-full whitespace-nowrap">
                     Most Popular
                  </div>
                  <h4 className="text-xl font-black text-white mb-2">Standard</h4>
                  <div className="flex items-baseline gap-1 mb-4">
                     <span className="text-4xl font-black text-white">{isAnnual ? '₹50,000' : '₹5,000'}</span>
                     <span className="text-stone-400 text-sm font-bold">{isAnnual ? '/ year' : '/ month'}</span>
                  </div>
                  <p className="text-sm text-stone-400 font-medium mb-8 h-10">For growing schools that need more room and priority support.</p>
                  
                  <ul className="space-y-4 mb-8 text-sm font-medium text-stone-300">
                     <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-orange-400 flex-shrink-0" /> Up to 20 staff</li>
                     <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-orange-400 flex-shrink-0" /> Up to 1,000 students</li>
                     <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-orange-400 flex-shrink-0" /> Everything in Free</li>
                     <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-orange-400 flex-shrink-0" /> White-labeled subdomain & branding</li>
                     <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-orange-400 flex-shrink-0" /> Priority email support</li>
                     <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-orange-400 flex-shrink-0" /> Onboarding assistance</li>
                     <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-orange-400 flex-shrink-0" /> Android app</li>
                  </ul>
                  
                  <Link href="#contact" className="block w-full py-3 px-4 bg-orange-400 hover:bg-orange-500 text-white font-bold text-center rounded-xl transition-colors shadow-lg shadow-orange-400/20">
                     Contact Sales
                  </Link>
               </div>

               {/* Pro Plan */}
               <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-sm">
                  <h4 className="text-xl font-black text-stone-900 mb-2">Pro</h4>
                  <div className="flex items-baseline gap-1 mb-4">
                     <span className="text-4xl font-black text-stone-900">{isAnnual ? '₹200,000' : '₹20,000'}</span>
                     <span className="text-stone-500 text-sm font-bold">{isAnnual ? '/ year' : '/ month'}</span>
                  </div>
                  <p className="text-sm text-stone-500 font-medium mb-8 h-10">For large schools and groups with bigger student bodies.</p>
                  
                  <ul className="space-y-4 mb-8 text-sm font-medium text-stone-700">
                     <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-stone-900 flex-shrink-0" /> Up to 100 staff</li>
                     <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-stone-900 flex-shrink-0" /> Up to 5,000 students</li>
                     <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-stone-900 flex-shrink-0" /> Everything in Standard</li>
                     <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-stone-900 flex-shrink-0" /> Fully white-labeled Android app</li>
                     <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-stone-900 flex-shrink-0" /> Dedicated support</li>
                     <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-stone-900 flex-shrink-0" /> Custom onboarding</li>
                  </ul>
                  
                  <Link href="#contact" className="block w-full py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-center rounded-xl transition-colors">
                     Contact Sales
                  </Link>
               </div>
            </div>
            
            <div className="mt-12 text-center bg-stone-50 rounded-2xl py-6 px-4 border border-stone-100 max-w-3xl mx-auto">
               <p className="text-sm font-bold text-stone-700">
                  Need a custom plan for a larger school? <Link href="#contact" className="text-orange-500 hover:underline">Get in touch</Link> — we'll size it to fit.
               </p>
            </div>
         </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-[#f8f9fa] relative z-10">
        <div className="max-w-[800px] mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <h2 className="text-orange-400 font-bold text-[11px] uppercase tracking-[0.2em] mb-4">GOT QUESTIONS?</h2>
            <h3 className="text-4xl font-black tracking-tight text-stone-900 leading-[1.2]">Frequently asked questions</h3>
          </div>
          
          <div className="space-y-0 border-t border-stone-200">
             {[
               "Is EduFordge really free to use?",
               "What does EduFordge include?",
               "Can students and staff access EduFordge from their phones?",
               "How do fee invoices and salary slips work?",
               "Is my school's data secure?",
               "What if my school is bigger than the Standard plan?",
               "Do I need technical staff to set it up?",
               "How do I get support?"
             ].map((question, i) => (
                <details key={i} className="group border-b border-stone-200">
                   <summary className="flex justify-between items-center font-bold cursor-pointer list-none py-5 text-stone-800 text-sm hover:text-orange-500 transition-colors [&::-webkit-details-marker]:hidden">
                      {question}
                      <span className="transition group-open:rotate-180">
                         <ChevronDown size={18} className="text-orange-400" />
                      </span>
                   </summary>
                   <div className="text-stone-500 text-sm pb-6 font-medium leading-relaxed">
                      This is a placeholder answer for the question. In a full implementation, you would expand this array to include actual objects with question and answer pairs.
                   </div>
                </details>
             ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" ref={contactFormRef} className="py-24 bg-white relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="text-orange-400 font-bold text-[11px] uppercase tracking-[0.2em] mb-4">GET IN TOUCH</h2>
            <h3 className="text-4xl font-black tracking-tight text-stone-900 leading-[1.2] mb-6">We'd love to hear from you</h3>
            <button onClick={scrollToContact} className="bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-orange-400/20 transition-colors">
               Book a free 30-min demo
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-start mt-16 max-w-5xl mx-auto">
             {/* Contact Form */}
             <div className="bg-[#f9f7f4] rounded-3xl p-8 border border-stone-200 shadow-sm">
                <form className="space-y-5" onSubmit={handleContactSubmit}>
                   {submitStatus === 'success' && (
                     <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-100">
                       Message sent successfully! We'll be in touch soon.
                     </div>
                   )}
                   {submitStatus === 'error' && (
                     <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100">
                       {errorMessage}
                     </div>
                   )}
                   <div>
                      <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-2">Your Name</label>
                      <input type="text" name="name" required value={formData.name} onChange={handleInputChange} placeholder="Enter your name" className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-2">Your Email</label>
                         <input type="email" name="email" required value={formData.email} onChange={handleInputChange} placeholder="Enter your email address" className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400" />
                      </div>
                      <div>
                         <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-2">Phone Number</label>
                         <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Enter your phone number" className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400" />
                      </div>
                   </div>
                   <div>
                      <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-2">School Name</label>
                      <input type="text" name="schoolName" value={formData.schoolName} onChange={handleInputChange} placeholder="Enter your school name" className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400" />
                   </div>
                   <div>
                      <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-2">Message</label>
                      <textarea name="message" required value={formData.message} onChange={handleInputChange} placeholder="Tell us about your school and what you need..." rows={4} className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 resize-none"></textarea>
                   </div>
                   <button type="submit" disabled={submitStatus === 'loading'} className="w-full bg-orange-400 hover:bg-orange-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-400/20 transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed">
                      {submitStatus === 'loading' ? 'Sending...' : 'Send Message'}
                   </button>
                </form>
             </div>
             
             {/* Contact Info & Map */}
             <div className="space-y-8 pl-0 md:pl-6">
                <div className="flex items-start gap-4">
                   <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-400 flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                   </div>
                   <div>
                      <h4 className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-1">Email</h4>
                      <p className="text-stone-900 font-bold text-sm">demo@edufordge.com</p>
                   </div>
                </div>
                
                <div className="flex items-start gap-4">
                   <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-400 flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                   </div>
                   <div>
                      <h4 className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-1">Phone</h4>
                      <p className="text-stone-900 font-bold text-sm">+1 (555) 123-4567</p>
                   </div>
                </div>
                
                <div className="flex items-start gap-4">
                   <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-400 flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                   </div>
                   <div>
                      <h4 className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-1">Address</h4>
                      <p className="text-stone-900 font-bold text-sm">123 Innovation Drive, Tech Park, City, Country - 000000</p>
                   </div>
                </div>
                
                <div className="mt-6 rounded-2xl overflow-hidden border border-stone-200 h-56 relative bg-stone-100">
                   <iframe 
                      title="EduFordge location" 
                      src="https://www.google.com/maps?q=New+York&z=12&output=embed" 
                      width="100%" 
                      height="100%" 
                      loading="lazy" 
                      referrerPolicy="no-referrer-when-downgrade" 
                      style={{ border: 0 }}
                   ></iframe>
                </div>
             </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-stone-900 text-white pt-20 pb-10 border-t border-stone-800 relative z-10">
         <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
               <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-white rounded-2xl p-2.5 inline-block shadow-lg shadow-black/20">
                      <img src="/logo-main.png" alt="EduFordge Logo" className="h-16 w-auto object-contain" />
                    </div>
                  </div>
                  <p className="text-stone-400 text-sm max-w-sm leading-relaxed mb-6 font-medium">
                     School Management Platform<br/>
                     123 Innovation Drive, Tech Park, City, Country - 000000
                  </p>
                  <div className="text-stone-400 text-sm font-medium space-y-1">
                     <p>demo@edufordge.com</p>
                     <p>+1 (555) 123-4567</p>
                  </div>
               </div>
               
               <div>
                  <h5 className="font-bold text-[11px] tracking-[0.1em] uppercase text-stone-500 mb-6">Product</h5>
                  <ul className="space-y-4 text-sm font-medium text-stone-300">
                     <li><Link href="#features" className="hover:text-orange-400 transition-colors">Features</Link></li>
                     <li><Link href="#modules" className="hover:text-orange-400 transition-colors">Modules</Link></li>
                     <li><Link href="#pricing" className="hover:text-orange-400 transition-colors">Pricing</Link></li>
                  </ul>
               </div>
               
               <div>
                  <h5 className="font-bold text-[11px] tracking-[0.1em] uppercase text-stone-500 mb-6">Company</h5>
                  <ul className="space-y-4 text-sm font-medium text-stone-300">
                     <li><Link href="#about" className="hover:text-orange-400 transition-colors">About</Link></li>
                     <li><Link href="#contact" className="hover:text-orange-400 transition-colors">Contact</Link></li>
                     <li><Link href="#" className="hover:text-orange-400 transition-colors">Support</Link></li>
                     <li><Link href="#" className="hover:text-orange-400 transition-colors">Privacy Policy</Link></li>
                  </ul>
               </div>

               <div>
                  <h5 className="font-bold text-[11px] tracking-[0.1em] uppercase text-stone-500 mb-6">Account</h5>
                  <ul className="space-y-4 text-sm font-medium text-stone-300">
                     <li><Link href="/login" className="hover:text-orange-400 transition-colors">Login</Link></li>
                     <li><Link href="/register" className="hover:text-orange-400 transition-colors">Register</Link></li>
                     <li><Link href="/login" className="hover:text-orange-400 transition-colors">Live Demo</Link></li>
                  </ul>
               </div>
            </div>
            
            <div className="pt-8 border-t border-stone-800 text-xs font-medium text-stone-500 flex flex-col md:flex-row justify-between items-center gap-4">
               <p>© {new Date().getFullYear()} EduFordge. All rights reserved.</p>
               <p>Made with 🧡 in India by <span className="text-stone-400 font-medium">Dev</span></p>
            </div>
         </div>
      </footer>

    </div>
  );
}
