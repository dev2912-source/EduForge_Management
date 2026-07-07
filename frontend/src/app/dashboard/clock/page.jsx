"use client";

import { useState, useEffect } from "react";
import { Clock, Filter, Calendar as CalendarIcon, ChevronLeft, ChevronRight, LogIn, LogOut, AlertCircle, Loader2 } from "lucide-react";

export default function MyClockPage() {
  const [history, setHistory] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clockingIn, setClockingIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchClockData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const response = await fetch(`/api/staff/clock`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch clock data");
      const data = await response.json();
      // API returns a raw array of Attendance records
      const records = Array.isArray(data) ? data : (data.history || []);
      const today = new Date().toDateString();
      const todayRecord = records.find(r => new Date(r.date).toDateString() === today) || null;
      setHistory(records);
      setTodayAttendance(todayRecord);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClockData();
  }, []);

  const handleClockIn = async () => {
    setClockingIn(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") || "";
      const response = await fetch(`/api/staff/clock`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to clock in");
      }
      await fetchClockData(); // refresh data
    } catch (err) {
      setError(err.message);
    } finally {
      setClockingIn(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-[#FF9933] rounded-full"></div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">My Clock</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-2">
          <AlertCircle size={20} />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {/* Main Clock Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
        {/* Top Decorative bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-[#FF9933]"></div>
        
        <div>
          <p className="text-[13px] font-black uppercase tracking-widest text-stone-400 mb-2">
            {currentTime.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <div className="text-5xl sm:text-6xl font-black text-stone-900 tracking-tighter flex items-center justify-center gap-3">
            {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })} 
            <span className="text-2xl sm:text-3xl font-bold text-stone-400 mt-2 sm:mt-4">
              {currentTime.getHours() >= 12 ? 'pm' : 'am'}
            </span>
          </div>
        </div>

        {loading ? (
          <Loader2 className="animate-spin text-stone-400" size={32} />
        ) : todayAttendance ? (
          <>
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-green-50 text-green-600 font-bold text-sm gap-2 border border-green-200">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Clocked In
            </div>
            <div>
              <p className="text-stone-500 font-medium text-[15px]">You clocked in at {todayAttendance.time || formatTime(todayAttendance.date)}</p>
            </div>
            <button disabled className="bg-stone-300 text-stone-500 px-10 py-3.5 rounded-xl text-[15px] font-black flex items-center gap-2.5 transition-all shadow-sm cursor-not-allowed">
              <Clock size={20} strokeWidth={2.5} /> Clocked In
            </button>
          </>
        ) : (
          <>
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-stone-100 text-stone-500 font-bold text-sm gap-2">
              <div className="w-2 h-2 rounded-full bg-stone-400"></div>
              Not In
            </div>
            <div>
              <p className="text-stone-500 font-medium text-[15px]">You haven't clocked in yet</p>
            </div>
            <button 
              onClick={handleClockIn}
              disabled={clockingIn}
              className="bg-stone-900 hover:bg-stone-800 text-white px-10 py-3.5 rounded-xl text-[15px] font-black flex items-center gap-2.5 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
            >
              {clockingIn ? <Loader2 className="animate-spin" size={20} /> : <Clock size={20} strokeWidth={2.5} />}
              {clockingIn ? "Clocking In..." : "Clock In"}
            </button>
          </>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-6 border-b border-stone-200 px-2 overflow-x-auto">
        <button className="pb-3 text-[13px] font-black tracking-wide text-[#FF9933] border-b-2 border-[#FF9933] whitespace-nowrap">
          Clock History
        </button>
        <button className="pb-3 text-[13px] font-bold tracking-wide text-stone-400 hover:text-stone-600 transition-colors whitespace-nowrap">
          Monthly Summary
        </button>
        <button className="pb-3 text-[13px] font-bold tracking-wide text-stone-400 hover:text-stone-600 transition-colors whitespace-nowrap">
          Yearly Summary
        </button>
      </div>

      {/* History Section */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* Date Filter Toolbar */}
        <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-3 bg-stone-50/30">
          <div className="relative w-full sm:w-72">
            <input 
              type="text" 
              defaultValue="Last 30 Days"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm cursor-pointer"
              readOnly
            />
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <CalendarIcon size={16} />
            </div>
          </div>
          <button className="w-full sm:w-auto px-5 py-2.5 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 flex items-center justify-center gap-2 hover:bg-stone-50 transition-colors shadow-sm">
            <Filter size={16} /> Filter
          </button>
        </div>

        {/* History List */}
        <div className="divide-y divide-stone-100 min-h-[200px]">
          {loading ? (
             <div className="flex items-center justify-center h-32 text-orange-400">
               <Loader2 className="animate-spin" size={32} />
             </div>
          ) : history.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-32 text-stone-500">
               <p className="font-bold">No clock history found.</p>
             </div>
          ) : history.map((record, i) => {
            // Note: In our current simple model, all marks are "Clocked In" (present)
            // A more complex model would track 'in' and 'out' events separately.
            const isLate = false; // Could determine late status based on time
            return (
              <div key={i} className="flex items-center justify-between p-4 sm:px-6 hover:bg-stone-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                    record.status === 'present' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    <LogIn size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-[14px] text-stone-900">
                        Clocked In
                      </p>
                      {isLate && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200/50">
                          Late
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-[12px] text-stone-500 mt-0.5">{formatDate(record.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-[15px] text-stone-900 tracking-tight">{record.time || formatTime(record.date)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-stone-200 flex items-center justify-between bg-stone-50/50">
          <button className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-600 flex items-center gap-1.5 hover:bg-stone-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <ChevronLeft size={16} /> Prev
          </button>
          <div className="text-[13px] font-bold text-stone-500">
            Page <span className="font-black text-stone-900">1</span> of 1
          </div>
          <button className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-600 flex items-center gap-1.5 hover:bg-stone-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            Next <ChevronRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
