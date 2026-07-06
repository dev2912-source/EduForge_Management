'use client';
import { useState, useEffect } from 'react';
import { 
  Users, 
  UserSquare2, 
  IndianRupee, 
  AlertCircle,
  Calendar,
  ChevronDown,
  ArrowRight,
  Loader2
} from "lucide-react";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/dashboard/admin`);
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-orange-400">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
        Error loading dashboard: {error}
      </div>
    );
  }

  const { stats, recentPayments, pendingInvoices } = data;

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}>
      <div className="space-y-5">
        
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Dashboard</h1>
          <p className="text-sm font-medium text-stone-600 mt-1">Welcome back, demo@edufordge.com</p>
        </div>
        
        {/* Top Control Bar */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Period</span>
            <div className="flex bg-stone-100 rounded-lg p-0.5">
              <button className="px-3 py-1 text-xs font-bold rounded-md transition-all duration-150 bg-stone-800 text-white shadow-sm">Month</button>
              <button className="px-3 py-1 text-xs font-bold rounded-md transition-all duration-150 text-stone-500 hover:text-stone-700">Year</button>
              <button className="px-3 py-1 text-xs font-bold rounded-md transition-all duration-150 text-stone-500 hover:text-stone-700">Custom</button>
            </div>
          </div>
          <div className="w-px h-6 bg-stone-200 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Period</span>
            <div className="relative">
              <button className="form-input py-1 px-3 text-sm border-stone-200 bg-stone-50 rounded-lg flex items-center gap-2 cursor-pointer hover:border-stone-300 transition-colors">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span className="font-bold text-stone-700">Jul 2026</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>
            </div>
          </div>
          <div className="flex-1"></div>
          <div className="hidden md:flex items-center gap-5">
            <div className="text-right">
              <p className="text-lg font-bold text-stone-800 leading-tight">0</p>
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Pending</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-stone-800 leading-tight">0</p>
              <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Overdue</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-[40px] flex items-end justify-start pl-2 pb-2">
              <Users className="w-5 h-5 text-orange-400" strokeWidth={1.75} />
            </div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Students</p>
            <p className="text-2xl font-bold text-stone-800 mt-1">{stats.students}</p>
            <p className="text-[10px] text-stone-400 mt-1">Active enrollment</p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-[40px] flex items-end justify-start pl-2 pb-2">
              <UserSquare2 className="w-5 h-5 text-emerald-500" strokeWidth={1.75} />
            </div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Staff</p>
            <p className="text-2xl font-bold text-stone-800 mt-1">{stats.staff}</p>
            <p className="text-[10px] text-stone-400 mt-1">Active members</p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-[40px] flex items-end justify-start pl-2 pb-2">
              <IndianRupee className="w-5 h-5 text-green-500" strokeWidth={1.75} />
            </div>
            <p className="text-[10px] font-black text-green-500 uppercase tracking-wider">Collected</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.collected}</p>
            <p className="text-[10px] text-stone-400 mt-1">Total fees received</p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-[40px] flex items-end justify-start pl-2 pb-2">
              <AlertCircle className="w-5 h-5 text-red-400" strokeWidth={1.75} />
            </div>
            <p className="text-[10px] font-black text-red-400 uppercase tracking-wider">Outstanding</p>
            <p className="text-2xl font-bold text-red-500 mt-1">{stats.outstanding}</p>
            <p className="text-[10px] text-stone-400 mt-1">0 pending invoices</p>
          </div>

        </div>

        {/* Charts Grid - Render exactly as HTML placeholders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-stone-800 uppercase tracking-widest">Revenue Overview</h2>
                <p className="text-xs text-stone-400 mt-0.5">Daily collection for Jul 2026</p>
              </div>
            </div>
            <div className="h-64 bg-stone-50 rounded-lg border border-dashed border-stone-200 flex items-center justify-center text-stone-400 text-sm font-medium">Chart Canvas</div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-stone-800 uppercase tracking-widest">Payment Methods</h2>
              </div>
            </div>
            <div className="h-64 bg-stone-50 rounded-lg border border-dashed border-stone-200 flex items-center justify-center text-stone-400 text-sm font-medium">Chart Canvas</div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-stone-800 uppercase tracking-widest">Invoice Status</h2>
                <p className="text-xs text-stone-400 mt-0.5">Monthly breakdown for 2026</p>
              </div>
            </div>
            <div className="h-64 bg-stone-50 rounded-lg border border-dashed border-stone-200 flex items-center justify-center text-stone-400 text-sm font-medium">Chart Canvas</div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-stone-800 uppercase tracking-widest">Class-wise Collection</h2>
                <p className="text-xs text-stone-400 mt-0.5">Collected vs outstanding for 2026</p>
              </div>
            </div>
            <div className="h-64 bg-stone-50 rounded-lg border border-dashed border-stone-200 flex items-center justify-center text-stone-400 text-sm font-medium">Chart Canvas</div>
          </div>

        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-stone-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-stone-900">Recent Payments</h3>
              <button className="text-sm font-bold text-orange-400 hover:text-orange-500 flex items-center gap-1">
                View all <ArrowRight size={16} />
              </button>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <tbody className="text-sm divide-y divide-stone-200">
                  {recentPayments.map((payment, idx) => (
                    <tr key={idx} className="hover:bg-orange-50/20 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-stone-900">{payment.studentName}</div>
                        <div className="text-xs text-stone-400 font-medium mt-0.5">{payment.receiptId}</div>
                      </td>
                      <td className="p-4 font-bold text-stone-900 text-right">{payment.amount}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-stone-50 text-stone-500 border border-stone-200 uppercase tracking-widest">
                          {payment.method}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-stone-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-stone-900">Pending Invoices</h3>
              <button className="text-sm font-bold text-orange-400 hover:text-orange-500 flex items-center gap-1">
                View all <ArrowRight size={16} />
              </button>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <tbody className="text-sm divide-y divide-stone-200">
                  {pendingInvoices.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-orange-50/20 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-stone-900">{inv.studentName}</div>
                        <div className="text-xs text-stone-400 font-medium mt-0.5">{inv.invoiceId} &middot; {inv.dueDate}</div>
                      </td>
                      <td className="p-4 font-bold text-stone-900 text-right">{inv.amount}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-red-50 text-red-500 border border-red-200 uppercase tracking-widest">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
