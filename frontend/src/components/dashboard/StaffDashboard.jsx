import { 
  Clock, 
  CalendarDays, 
  FileText, 
  Wallet,
  ArrowRight,
  BookOpen
} from "lucide-react";

export default function StaffDashboard() {
  const todaysClasses = [
    { subject: "Art & Craft", class: "Class 1 · A", time: "8:00 AM – 8:45 AM" },
    { subject: "Physical Education", class: "Class 1 · A", time: "8:45 AM – 9:30 AM" },
    { subject: "English", class: "Class 2 · A", time: "9:30 AM – 10:15 AM" },
    { subject: "Hindi", class: "Class 2 · A", time: "10:15 AM – 11:00 AM" },
    { subject: "Mathematics", class: "Class 1 · B", time: "11:30 AM – 12:15 PM" },
    { subject: "Environmental Studies", class: "Class 2 · A", time: "12:15 PM – 1:00 PM" },
    { subject: "Computer Science", class: "Class 1 · A", time: "1:00 PM – 1:45 PM" },
    { subject: "Art & Craft", class: "Class 1 · A", time: "1:45 PM – 2:30 PM" },
  ];

  const recentLeave = [
    { date: "15 Dec 2025 – 16 Dec 2025", reason: "Family function", status: "Approved" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Good afternoon, Rishabh</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-bold text-orange-400">Computer Science</span>
            <span className="text-sm text-stone-400">&middot;</span>
            <span className="text-sm font-medium text-stone-600">Teacher</span>
            <span className="text-sm font-mono text-stone-400 bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200">STF-2026-0001</span>
          </div>
        </div>
        <div className="text-sm font-bold text-stone-600 bg-white px-4 py-2 rounded-xl border border-stone-200 shadow-sm">
          Saturday, 4 July 2026
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Clock Card */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock size={18} className="text-stone-400" />
              <h3 className="font-bold text-stone-900">Today's Clock</h3>
            </div>
            <p className="text-xl font-black text-stone-900 mb-1">Not Clocked In</p>
            <p className="text-sm font-medium text-stone-400">Haven't clocked in yet</p>
          </div>
          <button className="mt-4 w-full bg-orange-400 text-white font-bold py-2 rounded-xl text-sm shadow-sm hover:bg-orange-400-500 transition-colors">
            Go to Clock
          </button>
        </div>

        {/* Attendance Card */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays size={18} className="text-stone-400" />
              <h3 className="font-bold text-stone-900">This Month</h3>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-black text-stone-900">0</span>
              <span className="text-lg font-bold text-stone-400">/ 4 days</span>
            </div>
            <p className="text-sm font-medium text-stone-400">present this month</p>
            <p className="text-sm font-bold text-red-500 mt-1">4 absent</p>
          </div>
        </div>

        {/* Leave Status Card */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText size={18} className="text-stone-400" />
              <h3 className="font-bold text-stone-900">Leave Status</h3>
            </div>
            <p className="text-xl font-black text-stone-900 mb-1">No pending</p>
          </div>
          <button className="mt-4 w-full bg-stone-50 text-stone-900 font-bold border border-stone-200 py-2 rounded-xl text-sm hover:border-orange-400 hover:text-orange-400 transition-colors">
            Manage leave
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Classes */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-stone-200 flex justify-between items-center bg-stone-50/50">
            <h3 className="font-bold text-lg text-stone-900">Today's Classes</h3>
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider bg-orange-400-50 px-3 py-1 rounded-lg">Saturday</span>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {todaysClasses.map((cls, idx) => (
              <div key={idx} className="flex gap-3 items-start p-3 rounded-xl border border-stone-200 hover:border-orange-400/30 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 rounded-xl bg-orange-400-50 text-orange-400 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 group-hover:text-orange-400 transition-colors">{cls.subject}</h4>
                  <p className="text-xs font-bold text-stone-600 mt-0.5">{cls.class}</p>
                  <p className="text-xs font-medium text-stone-400 mt-1">{cls.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Latest Salary Slip */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex items-center gap-2">
              <Wallet size={18} className="text-stone-400" />
              <h3 className="font-bold text-lg text-stone-900">Latest Salary Slip</h3>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-stone-900">March 2026</span>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">Pending</span>
              </div>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600 font-medium">Gross Salary</span>
                  <span className="font-bold text-stone-900">₹23,750</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600 font-medium">Deductions</span>
                  <span className="font-bold text-red-500">-₹2,300</span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-stone-200 mt-2">
                  <span className="font-bold text-stone-900">Net Salary</span>
                  <span className="font-black text-stone-900">₹21,450</span>
                </div>
              </div>
              <button className="w-full text-sm font-bold text-orange-400 hover:text-orange-400-500 flex items-center justify-center gap-1 transition-colors">
                View all slips <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Recent Leave Requests */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-stone-400" />
                <h3 className="font-bold text-lg text-stone-900">Leave Requests</h3>
              </div>
              <button className="text-sm font-bold text-orange-400 hover:text-orange-400-500">
                View all
              </button>
            </div>
            <div className="divide-y divide-card-border">
              {recentLeave.map((leave, idx) => (
                <div key={idx} className="p-4 hover:bg-stone-50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm text-stone-900">{leave.date}</span>
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md uppercase tracking-wider">{leave.status}</span>
                  </div>
                  <p className="text-xs font-medium text-stone-600">{leave.reason}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-stone-200 bg-stone-50/50">
              <button className="w-full bg-white text-stone-900 font-bold border border-stone-200 py-2.5 rounded-xl text-sm hover:border-orange-400 hover:text-orange-400 shadow-sm transition-all">
                + Apply for leave
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
