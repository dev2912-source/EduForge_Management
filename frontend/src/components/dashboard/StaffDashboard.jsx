"use client";

import { useState, useEffect } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StaffDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState({});

  const todaysClasses = [
    { subject: "Hindi", class: "Class 2 • A", time: "8:00 AM – 8:45 AM", color: "bg-red-500" },
    { subject: "Mathematics", class: "Class 1 • B", time: "8:45 AM – 9:30 AM", color: "bg-emerald-500" },
    { subject: "Environmental Studies", class: "Class 2 • A", time: "9:30 AM – 10:15 AM", color: "bg-[#FF9933]" },
    { subject: "Computer Science", class: "Class 1 • A", time: "10:15 AM – 11:00 AM", color: "bg-blue-500" },
    { subject: "Art & Craft", class: "Class 1 • A", time: "11:30 AM – 12:15 PM", color: "bg-orange-500" },
    { subject: "Physical Education", class: "Class 1 • A", time: "12:15 PM – 1:00 PM", color: "bg-purple-500" },
    { subject: "English", class: "Class 2 • A", time: "1:00 PM – 1:45 PM", color: "bg-indigo-500" },
    { subject: "Hindi", class: "Class 2 • A", time: "1:45 PM – 2:30 PM", color: "bg-pink-500" },
  ];

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUserProfile(JSON.parse(userData));
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const response = await fetch(`/api/dashboard/staff`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error("Failed to fetch dashboard data");
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getInitials = (name) => {
    if (!name) return "ST";
    return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-orange-400">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 m-4">
        Error loading dashboard: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#FF9933] text-white flex items-center justify-center text-xl font-black shadow-sm flex-shrink-0">
            {getInitials(userProfile.name)}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-tight">{getGreeting()}, {userProfile.name || "Staff"}</h1>
            <p className="text-[13px] font-medium text-stone-500 mt-1">Teacher</p>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <div className="px-3 py-1 bg-[#FDF1E6] text-[#D47115] rounded-md text-[10px] font-black uppercase tracking-widest border border-orange-200/50 self-start sm:self-auto">
            {userProfile.profile?.rollNumber || userProfile.schoolId || "STAFF-ID"}
          </div>
          <p className="text-[11px] font-bold text-stone-500">
            {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Clock */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-stone-400 mb-4">Today's Clock</h3>
            <div className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase mb-3 border ${
                data.todayClock === 'Clocked In' || data.todayClock === 'Present' ? 'bg-green-50 text-green-600 border-green-200' :
                'bg-stone-100 text-stone-600 border-stone-200'
            }`}>
              {data.todayClock}
            </div>
            <p className="text-[15px] font-bold text-stone-700">
              {data.todayClock === 'Clocked In' || data.todayClock === 'Present' ? "You have clocked in today" : "Haven't clocked in yet"}
            </p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/clock')}
            className="mt-6 text-[12px] font-black text-[#FF9933] hover:text-orange-600 flex items-center gap-1 transition-colors self-start"
          >
            Go to Clock <ChevronRight size={14} strokeWidth={3} />
          </button>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-stone-400 mb-4">This Month</h3>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-3xl font-black text-stone-900 leading-none">0</span>
              <span className="text-sm font-bold text-stone-500">/ 0 days</span>
            </div>
            <p className="text-[11px] font-bold text-stone-400">present this month</p>
          </div>
          <div className="mt-4">
             <div className="inline-block px-2.5 py-1 bg-stone-50 text-stone-500 rounded-md text-[10px] font-black tracking-widest uppercase border border-stone-100">
               -
             </div>
          </div>
        </div>

        {/* Leave Status */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-stone-400 mb-4">Leave Status</h3>
            <div className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border ${
              data.pendingLeaves > 0 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-stone-100 text-stone-600 border-stone-200'
            }`}>
              {data.pendingLeaves > 0 ? `${data.pendingLeaves} pending` : "No pending"}
            </div>
          </div>
          <button 
            onClick={() => router.push('/dashboard/leave')}
            className="mt-6 text-[12px] font-black text-[#FF9933] hover:text-orange-600 flex items-center gap-1 transition-colors self-start"
          >
            Manage leave <ChevronRight size={14} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Today's Classes */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-[#FF9933] rounded-full"></div>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-stone-500">Today's Classes</h2>
          </div>
          <p className="text-[11px] font-bold text-stone-400">
            {new Date().toLocaleDateString("en-US", { weekday: "long" })}
          </p>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x">
          {todaysClasses.map((cls, i) => (
            <div key={i} className="flex-shrink-0 w-[170px] bg-white border border-stone-200 rounded-xl overflow-hidden relative shadow-sm snap-start">
              {/* Color Top Border Line */}
              <div className={`h-[5px] w-full ${cls.color}`}></div>
              <div className="p-4">
                <h3 className="text-[13px] font-black text-stone-800 leading-tight mb-1">{cls.subject}</h3>
                <p className="text-[10px] font-bold text-stone-400 mb-2.5">{cls.class}</p>
                <p className="text-[11px] font-black text-stone-600">{cls.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Latest Salary Slip */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-4 bg-[#FF9933] rounded-full"></div>
              <h2 className="text-[11px] font-black uppercase tracking-widest text-stone-500">Latest Salary Slip</h2>
            </div>
            
            {data.latestSalary ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[14px] font-black text-stone-900">
                    {new Date(data.latestSalary.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </h3>
                  <div className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${
                    data.latestSalary.status === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {data.latestSalary.status}
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="font-bold text-stone-500">Gross Salary</span>
                    <span className="font-black text-stone-800">₹{data.latestSalary.grossSalary || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="font-bold text-stone-500">Deductions</span>
                    <span className="font-black text-red-500">-₹{data.latestSalary.deductions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-[13px] pt-3 mt-1 border-t border-stone-100">
                    <span className="font-black text-stone-900">Net Salary</span>
                    <span className="font-black text-green-600">₹{data.latestSalary.netSalary || 0}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm font-bold text-stone-400 py-8 text-center">No salary slips found</div>
            )}
          </div>
          
          <button 
            onClick={() => router.push('/dashboard/salary')}
            className="text-[12px] font-black text-[#FF9933] hover:text-orange-600 flex items-center gap-1 transition-colors self-start"
          >
            View all slips <ChevronRight size={14} strokeWidth={3} />
          </button>
        </div>

        {/* Recent Leave Requests */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-4 bg-[#FF9933] rounded-full"></div>
              <h2 className="text-[11px] font-black uppercase tracking-widest text-stone-500">Recent Leave Requests</h2>
            </div>

            {/* Note: In a real app we'd fetch the actual recent leave from backend, 
                for now we just use a static placeholder as it was in the original if no data is explicitly sent for latest leave */}
            <div className="flex justify-between items-start mb-6">
              <div className="text-sm font-bold text-stone-400 py-6 text-center w-full">
                {data.pendingLeaves > 0 ? "You have pending leave requests" : "No recent leave requests"}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto">
            <button 
              onClick={() => router.push('/dashboard/leave')}
              className="text-[12px] font-black text-[#FF9933] hover:text-orange-600 flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight size={14} strokeWidth={3} />
            </button>
            <button 
              onClick={() => router.push('/dashboard/leave')}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-[12px] font-black transition-colors shadow-sm"
            >
              Apply for leave
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
