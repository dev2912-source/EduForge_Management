'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpen,
  TrendingUp,
  LayoutGrid,
  Calendar,
  AlignLeft,
  FileText,
  CreditCard,
  BarChart2,
  CalendarDays,
  Clock,
  LogOut,
  ChevronsLeft,
  Menu,
  Users,
  CircleDollarSign,
  Settings,
  Trash2,
  CalendarPlus,
  CheckCircle
} from "lucide-react";
import AddMenu from "@/components/layout/AddMenu";
import NotificationPanel from "@/components/layout/NotificationPanel";
import ProfileDropdown from "@/components/layout/ProfileDropdown";
import { logoutUser } from "@/actions/auth";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState("student");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userInitials, setUserInitials] = useState("U");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUserRole(parsed.role || "student");
        
        const name = parsed.name || "User";
        setUserName(name);
        setUserEmail(parsed.email || "");
        setUserInitials(name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase());
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const getNavItems = (role) => {
    if (role === "admin") {
      return [
        {
          items: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }
          ]
        },
        {
          section: "ACADEMIC",
          items: [
            { name: "Student Directory", href: "/dashboard/students", icon: BookOpen },
            { name: "Promotions", href: "/dashboard/promotions", icon: TrendingUp },
            { name: "Classes", href: "/dashboard/classes", icon: LayoutGrid },
            { name: "Timetable", href: "/dashboard/timetable", icon: Calendar },
          ]
        },
        {
          section: "FINANCE",
          items: [
            { name: "Fee Structures", href: "/dashboard/finance/structures", icon: AlignLeft },
            { name: "Invoices", href: "/dashboard/finance/invoices", icon: FileText },
            { name: "Payments", href: "/dashboard/finance/payments", icon: CreditCard },
          ]
        },
        {
          section: "ATTENDANCE",
          items: [
            { name: "Reports", href: "/dashboard/attendance/reports", icon: BarChart2 },
            { name: "Leave Requests", href: "/dashboard/attendance/leave", icon: Calendar },
            { name: "Staff Clock", href: "/dashboard/attendance/clock", icon: Clock },
          ]
        },
        {
          section: "STAFF",
          items: [
            { name: "Staff Directory", href: "/dashboard/staff", icon: Users },
            { name: "Salary Slips", href: "/dashboard/staff/salary", icon: CircleDollarSign },
          ]
        },
        {
          section: "SYSTEM",
          items: [
            { name: "Settings", href: "/dashboard/settings", icon: Settings },
            { name: "Trash", href: "/dashboard/trash", icon: Trash2 },
          ]
        }
      ];
    }
    // Student nav
    if (role === "student") {
      return [
        {
          items: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }
          ]
        },
        {
          section: "ACADEMIC",
          items: [
            { name: "Timetable", href: "/dashboard/timetable", icon: Calendar },
            { name: "Attendance", href: "/dashboard/attendance", icon: BarChart2 },
            { name: "Academic History", href: "/dashboard/history", icon: BookOpen },
          ]
        },
        {
          section: "FINANCE",
          items: [
            { name: "My Fees", href: "/dashboard/fees", icon: FileText },
            { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
          ]
        },
        {
          items: [
            { name: "Leave Requests", href: "/dashboard/leave", icon: CalendarDays },
            { name: "Settings", href: "/dashboard/settings", icon: Settings },
          ]
        }
      ];
    }
    // Staff nav
    return [
      {
        items: [
          { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }
        ]
      },
      {
        section: "ACADEMIC",
        items: [
          { name: "Students", href: "/dashboard/students", icon: Users },
          { name: "My Timetable", href: "/dashboard/timetable", icon: Calendar },
          { name: "Mark Attendance", href: "/dashboard/attendance", icon: CalendarPlus },
          { name: "Leave Approvals", href: "/dashboard/leave-approvals", icon: CheckCircle },
        ]
      },
      {
        section: "FEES",
        items: [
          { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
          { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
        ]
      },
      {
        items: [
          { name: "Clock In / Out", href: "/dashboard/clock", icon: Clock },
          { name: "Leave Requests", href: "/dashboard/leave", icon: CalendarDays },
          { name: "Salary Slips", href: "/dashboard/salary", icon: FileText },
          { name: "Settings", href: "/dashboard/settings/profile", icon: Settings },
        ]
      }
    ];
  };

  const navSections = getNavItems(userRole);

  const isExpanded = sidebarOpen || mobileMenuOpen;

  return (
    <div className="h-screen bg-stone-50 flex overflow-hidden font-sans selection:bg-orange-400/20 selection:text-orange-500 relative">
      
      {/* Floating Background Shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-orange-400/20 blur-[120px] pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] rounded-full bg-orange-300/20 blur-[140px] pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
      <div className="absolute top-[20%] right-[20%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-stone-200/50 blur-[100px] pointer-events-none mix-blend-multiply"></div>

        {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/30 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        onMouseEnter={() => {
          if (window.innerWidth >= 1024) setSidebarOpen(true);
        }}
        onMouseLeave={() => {
          if (window.innerWidth >= 1024) setSidebarOpen(false);
        }}
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white/95 backdrop-blur-xl border-r border-stone-200/60 lg:m-4 lg:rounded-3xl lg:shadow-[0_8px_30px_rgb(0,0,0,0.06)] lg:border lg:border-stone-200/60 transform transition-all duration-300 ease-in-out flex flex-col lg:h-[calc(100vh-32px)] overflow-hidden ${
          mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        } ${!sidebarOpen ? "w-[260px] lg:w-[80px]" : "w-[260px] lg:w-[260px]"}`}
      >
        <div className="h-16 flex items-center px-6 border-b border-stone-100 flex-shrink-0 transition-all duration-300">
          <Link href="/dashboard" className="flex items-center overflow-hidden whitespace-nowrap">
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              <img src="/logo-main.png" alt="Logo" className="h-full w-auto object-contain" />
            </div>
            <div className={`flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-w-[200px] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0'}`}>
              <span className="font-black text-[15px] tracking-tight text-stone-900 leading-none">EduFordge</span>
              <span className="text-[10px] font-bold text-orange-500 mt-0.5 tracking-wider uppercase">Workspace</span>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-4 flex flex-col gap-2 no-scrollbar">
          {navSections.slice(0, -1).map((section, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              {section.section && (
                <div className={`text-[10px] font-black text-stone-400 uppercase tracking-[0.15em] px-3 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-10 opacity-100 mt-2 mb-1.5' : 'max-h-0 opacity-0 mt-0 mb-0'}`}>
                  {section.section}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                      isActive 
                        ? "bg-gradient-to-r from-orange-50 to-orange-100/50 text-orange-600 shadow-sm" 
                        : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                    }`}
                    title={!isExpanded ? item.name : ""}
                  >
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-orange-500 rounded-r-full transition-all duration-300 ease-in-out ${isActive && isExpanded ? 'h-5 opacity-100' : 'h-0 opacity-0'}`} />
                    <div className="w-6 flex items-center justify-center flex-shrink-0">
                      <item.icon size={18} className={`transition-colors duration-200 ${isActive ? "text-orange-500" : "text-stone-400 group-hover:text-stone-600"}`} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-w-[200px] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0'} ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="px-4 py-4 border-t border-stone-200/60 flex flex-col gap-1 bg-transparent flex-shrink-0">
          {navSections[navSections.length - 1].items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? "bg-gradient-to-r from-orange-50 to-orange-100/50 text-orange-600 shadow-sm" 
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                }`}
                title={!isExpanded ? item.name : ""}
              >
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-orange-500 rounded-r-full transition-all duration-300 ease-in-out ${isActive && isExpanded ? 'h-5 opacity-100' : 'h-0 opacity-0'}`} />
                <div className="w-6 flex items-center justify-center flex-shrink-0">
                  <item.icon size={18} className={`transition-colors duration-200 ${isActive ? "text-orange-500" : "text-stone-400 group-hover:text-stone-600"}`} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-w-[200px] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0'} ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
              </Link>
            );
          })}

          <button 
            className={`flex items-center px-3 py-2.5 mt-2 text-red-500 hover:bg-red-50 hover:text-red-600 transition-all w-full rounded-xl group relative`}
            onClick={async () => {
              await logoutUser();
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/login";
            }}
            title={!isExpanded ? "Sign Out" : ""}
          >
            <div className="w-6 flex items-center justify-center flex-shrink-0">
              <LogOut size={18} className="group-hover:scale-110 transition-transform" strokeWidth={2} />
            </div>
            <span className={`text-sm font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-w-[200px] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0'}`}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border border-stone-200/60 rounded-2xl flex items-center justify-between px-4 sm:px-6 lg:px-6 flex-shrink-0 sticky top-4 z-30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mx-4 mt-4 lg:mx-6 lg:mr-8 lg:mt-4 transition-all duration-300">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-stone-400 hover:text-stone-900"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-bold text-stone-900">EduFordge Public School</span>
              <span className="text-[10px] font-medium text-stone-500 font-mono mt-0.5">Code: EDUFORDGE</span>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <AddMenu userRole={userRole} />
            <NotificationPanel />
            <ProfileDropdown userInitials={userInitials} userName={userName} userEmail={userEmail} />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-transparent h-full pt-4 pb-8 px-4 lg:px-6 lg:pr-8 no-scrollbar">
          {children}
        </div>
        
      </main>
    </div>
  );
}
