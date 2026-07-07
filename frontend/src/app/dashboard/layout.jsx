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
  Bell,
  Search,
  Plus,
  Users,
  CircleDollarSign,
  Settings,
  Trash2,
  CalendarPlus,
  CheckCircle
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState("student");
  const [userName, setUserName] = useState("");
  const [userInitials, setUserInitials] = useState("U");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUserRole(parsed.role || "student");
        
        let name = "User";
        if (parsed.role === 'admin') name = "Admin User";
        if (parsed.role === 'staff') name = "Staff Member";
        if (parsed.role === 'student') name = "Student Name";
        
        setUserName(name);
        setUserInitials(name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase());
      } catch (e) {
        console.error(e);
      }
    } else {
      router.push("/login");
    }
  }, [router]);

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
            { name: "Staff", href: "/dashboard/staff", icon: Users },
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
          { name: "Settings", href: "/dashboard/settings", icon: Settings },
        ]
      }
    ];
  };

  const navSections = getNavItems(userRole);

  return (
    <div className="min-h-screen bg-stone-50 flex overflow-hidden font-sans selection:bg-orange-400/20 selection:text-orange-500">
      
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[220px] bg-white border-r border-stone-200 transform transition-transform duration-300 ease-in-out flex flex-col ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${!sidebarOpen ? "lg:w-16" : "lg:w-[220px]"}`}
      >
        <div className="h-14 flex items-center justify-between px-3 border-b border-stone-200 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center flex-shrink-0">
              <img src="/logo-main.png" alt="EduFordge Logo" className="h-full w-auto object-contain" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="font-black text-[15px] tracking-tight text-stone-900 leading-none">EduFordge P...</span>
                <span className="text-[11px] font-medium text-stone-400 mt-0.5">School Ecosystem</span>
              </div>
            )}
          </Link>
          {sidebarOpen && (
            <button 
              className="hidden lg:flex text-stone-300 hover:text-stone-600 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <ChevronsLeft size={15} strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-3 no-scrollbar">
          {!sidebarOpen && (
            <button 
              className="hidden lg:flex items-center justify-center w-full p-2 mb-1 text-stone-400 hover:text-[#d97706] hover:bg-orange-50 rounded-lg transition-all"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={16} />
            </button>
          )}
          
          {navSections.slice(0, -1).map((section, idx) => (
            <div key={idx} className="flex flex-col gap-0.5">
              {section.section && sidebarOpen && (
                <div className="text-[11px] font-black text-stone-400 uppercase tracking-[0.12em] mb-1 px-2 mt-1">
                  {section.section}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                
                // Dashboard active styling
                if (item.name === "Dashboard" && isActive && sidebarOpen) {
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-2.5 py-2 pl-2.5 pr-3 bg-[#FFEDD5] text-[#C2410C] rounded-r-lg border-l-[3px] border-[#F97316] font-bold transition-all"
                    >
                      <item.icon size={18} strokeWidth={2.5} className="flex-shrink-0 text-[#C2410C]" />
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  );
                }

                // Regular items
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all group ${
                      isActive 
                        ? "bg-[#F5F1E6] text-[#1F2937] font-semibold" 
                        : "text-stone-600 hover:bg-stone-50 hover:text-stone-900 font-medium"
                    }`}
                    title={!sidebarOpen ? item.name : ""}
                  >
                    <item.icon size={18} className={`flex-shrink-0 ${isActive ? "text-stone-800" : "text-stone-500 group-hover:text-stone-900"}`} strokeWidth={1.75} />
                    {sidebarOpen && <span className="text-sm">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="px-3 py-3 border-t border-stone-200 flex flex-col gap-1 bg-white">
          {navSections[navSections.length - 1].items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2.5 px-2.5 py-2 w-full rounded-lg transition-all group ${
                  isActive 
                    ? "bg-[#F5F1E6] text-[#1F2937] font-semibold" 
                    : "text-stone-600 hover:bg-stone-50 hover:text-stone-900 font-medium"
                }`}
                title={!sidebarOpen ? item.name : ""}
              >
                <item.icon size={18} className={`flex-shrink-0 ${isActive ? "text-stone-800" : "text-stone-500 group-hover:text-stone-900"}`} strokeWidth={1.75} />
                {sidebarOpen && <span className="text-sm">{item.name}</span>}
              </Link>
            );
          })}

          <button 
            className={`flex items-center ${sidebarOpen ? 'justify-center gap-2.5' : 'justify-center'} px-2.5 py-2 mt-1 text-[#EF4444] hover:bg-red-50 font-bold transition-all w-full rounded-lg`}
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/login";
            }}
            title={!sidebarOpen ? "Sign Out" : ""}
          >
            <LogOut size={18} className="flex-shrink-0" strokeWidth={2.5} />
            {sidebarOpen && <span className="text-sm">Sign Out</span>}
          </button>
          
          {sidebarOpen && (
            <div className="text-center mt-3 mb-1">
              <span className="text-[11px] font-black text-stone-400 tracking-wider">V0.0.1</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0 sticky top-0 z-30 shadow-sm">
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
            {userRole !== "student" && (
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF9F43] hover:bg-[#ff8f23] text-white text-sm font-bold rounded-md transition-colors shadow-sm">
                <Plus size={16} strokeWidth={3} />
                Add
              </button>
            )}
            
            <button className="text-stone-600 hover:text-stone-900 transition-colors">
              <Bell size={20} strokeWidth={2} />
            </button>
            
            <div className="flex items-center cursor-pointer">
              <div className="p-0.5 border-2 border-stone-200 rounded-full">
                <div className="w-8 h-8 bg-[#FF9F43] text-white text-xs font-black rounded-full flex items-center justify-center">
                  {userInitials || "DE"}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-hidden bg-[#FAFAFA] h-full">
          {children}
        </div>
        
      </main>
    </div>
  );
}
