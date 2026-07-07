'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  UserSquare2, 
  IndianRupee, 
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Loader2,
  RefreshCw
} from "lucide-react";

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month');
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUserName(parsed.name || 'User');
        setUserEmail(parsed.email || '');
      } catch {}
    }
  }, []);

  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set('period', period);
    if (period === 'month') {
      params.set('month', currentMonth + 1);
      params.set('year', currentYear);
    } else if (period === 'year') {
      params.set('year', currentYear);
    }
    return params.toString();
  };

  const fetchData = async (q) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/dashboard/admin?${q}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(buildQuery());
  }, [period, currentMonth, currentYear]);

  const handlePeriodChange = (p) => {
    setShowMonthPicker(false);
    setPeriod(p);
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64 text-orange-400">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
        Error loading dashboard: {error}
      </div>
    );
  }

  const HorizontalComparisonBar = ({ collected, outstanding }) => {
    const collectedVal = typeof collected === 'number' ? collected : parseFloat(String(collected).replace(/[^0-9.]/g, '')) || 0;
    const outstandingVal = typeof outstanding === 'number' ? outstanding : parseFloat(String(outstanding).replace(/[^0-9.]/g, '')) || 0;
    const total = collectedVal + outstandingVal;
    const collectedPct = total > 0 ? (collectedVal / total) * 100 : 0;
    const outstandingPct = total > 0 ? (outstandingVal / total) * 100 : 0;
    return (
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-bold text-green-600">Collected</span>
            <span className="font-bold text-stone-700">{collected}</span>
          </div>
          <div className="h-4 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all" style={{ width: `${collectedPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-bold text-red-500">Outstanding</span>
            <span className="font-bold text-stone-700">{outstanding}</span>
          </div>
          <div className="h-4 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all" style={{ width: `${outstandingPct}%` }} />
          </div>
        </div>
        <div className="text-center text-xs text-stone-400 font-medium pt-1">
          Total: {(collectedVal + outstandingVal).toLocaleString('en-IN')}
        </div>
      </div>
    );
  };

  const DonutChart = ({ data: chartData, size = 160, strokeWidth = 28 }) => {
    const total = chartData.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return <div className="text-stone-400 text-sm font-medium text-center py-8">No data available</div>;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const half = size / 2;
    let cumulativePercent = 0;
    return (
      <div className="flex flex-col items-center gap-3">
        <svg width={size} height={size} className="transform -rotate-90">
          {chartData.map((d, i) => {
            const percent = d.value / total;
            const segmentLength = circumference * percent;
            const offset = -cumulativePercent * circumference;
            cumulativePercent += percent;
            return (
              <circle
                key={i}
                cx={half}
                cy={half}
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={offset}
              />
            );
          })}
        </svg>
        <div className="flex flex-wrap gap-3 justify-center">
          {chartData.map((d, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-xs text-stone-600 font-medium">{d.label}: {d.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const StackedBar = ({ data: chartData }) => {
    const total = chartData.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return <div className="text-stone-400 text-sm font-medium text-center py-8">No data available</div>;
    return (
      <div className="space-y-4">
        <div className="h-8 bg-stone-100 rounded-full overflow-hidden flex">
          {chartData.map((d, i) => {
            const pct = (d.value / total) * 100;
            return (
              <div
                key={i}
                className="h-full transition-all first:rounded-l-full last:rounded-r-full"
                style={{ width: `${pct}%`, backgroundColor: d.color, minWidth: pct > 0 ? '4px' : '0' }}
              />
            );
          })}
        </div>
        <div className="space-y-2">
          {chartData.map((d, i) => {
            const pct = ((d.value / total) * 100).toFixed(1);
            return (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: d.color }} />
                  <span className="font-medium text-stone-700">{d.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-stone-800">{d.value}</span>
                  <span className="text-stone-400 text-xs w-12 text-right">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const HorizontalBarChart = ({ data: chartData }) => {
    if (!chartData || chartData.length === 0) return <div className="text-stone-400 text-sm font-medium text-center py-8">No data available</div>;
    const max = Math.max(...chartData.map(d => d.value));
    return (
      <div className="space-y-3">
        {chartData.map((d, i) => {
          const pct = max > 0 ? (d.value / max) * 100 : 0;
          return (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-stone-700">{d.label}</span>
                <span className="font-bold text-stone-800">{d.value} students</span>
              </div>
              <div className="h-5 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: d.color || '#FF9F43' }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const { stats, recentPayments, pendingInvoices, pendingCount, overdueCount, paymentMethodData, invoiceStatusData, classWiseData } = data;

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}>
      <div className="space-y-5">
        
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">Dashboard</h1>
            <p className="text-sm font-medium text-stone-600 mt-1">Welcome back, {userName}</p>
          </div>
          <button
            onClick={() => fetchData(buildQuery())}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-stone-500 hover:text-stone-800 bg-white rounded-lg border border-stone-200 hover:border-stone-300 shadow-sm transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        
        {/* Top Control Bar */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Period</span>
            <div className="flex bg-stone-100 rounded-lg p-0.5">
              <button
                onClick={() => handlePeriodChange('month')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all duration-150 ${period === 'month' ? 'bg-stone-800 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                Month
              </button>
              <button
                onClick={() => handlePeriodChange('year')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all duration-150 ${period === 'year' ? 'bg-stone-800 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                Year
              </button>
              <button
                onClick={() => handlePeriodChange('custom')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all duration-150 ${period === 'custom' ? 'bg-stone-800 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                Custom
              </button>
            </div>
          </div>
          <div className="w-px h-6 bg-stone-200 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
              {period === 'year' ? 'Year' : 'Month'}
            </span>
            <div className="relative">
              <button
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="form-input py-1 px-3 text-sm border-stone-200 bg-stone-50 rounded-lg flex items-center gap-2 cursor-pointer hover:border-stone-300 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span className="font-bold text-stone-700">
                  {period === 'year' ? currentYear : `${MONTHS[currentMonth]} ${currentYear}`}
                </span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>
              {showMonthPicker && (
                <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-stone-200 p-3 z-40 min-w-[220px]">
                  {period === 'year' ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between mb-2">
                        <button onClick={() => setCurrentYear(y => y - 1)} className="p-1 hover:bg-stone-100 rounded"><ChevronLeft size={14} /></button>
                        <span className="text-sm font-bold text-stone-800">{currentYear}</span>
                        <button onClick={() => setCurrentYear(y => y + 1)} className="p-1 hover:bg-stone-100 rounded"><ChevronRight size={14} /></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <button onClick={prevMonth} className="p-1 hover:bg-stone-100 rounded"><ChevronLeft size={14} /></button>
                        <span className="text-sm font-bold text-stone-800">{MONTHS[currentMonth]} {currentYear}</span>
                        <button onClick={nextMonth} className="p-1 hover:bg-stone-100 rounded"><ChevronRight size={14} /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {MONTHS.map((m, idx) => (
                          <button
                            key={m}
                            onClick={() => { setCurrentMonth(idx); setShowMonthPicker(false); }}
                            className={`px-2 py-1.5 text-xs font-bold rounded-md transition-colors ${idx === currentMonth ? 'bg-[#FF9F43] text-white' : 'text-stone-600 hover:bg-stone-100'}`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1"></div>
          <div className="hidden md:flex items-center gap-5">
            <div className="text-right">
              <p className="text-lg font-bold text-stone-800 leading-tight">{pendingCount || 0}</p>
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Pending</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-stone-800 leading-tight">{overdueCount || 0}</p>
              <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Overdue</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/students')}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-[40px] flex items-end justify-start pl-2 pb-2">
              <Users className="w-5 h-5 text-orange-400" strokeWidth={1.75} />
            </div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Students</p>
            <p className="text-2xl font-bold text-stone-800 mt-1">{stats?.students}</p>
            <p className="text-[10px] text-stone-400 mt-1">Active enrollment</p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/staff')}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-[40px] flex items-end justify-start pl-2 pb-2">
              <UserSquare2 className="w-5 h-5 text-emerald-500" strokeWidth={1.75} />
            </div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Staff</p>
            <p className="text-2xl font-bold text-stone-800 mt-1">{stats?.staff}</p>
            <p className="text-[10px] text-stone-400 mt-1">Active members</p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/finance/payments')}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-[40px] flex items-end justify-start pl-2 pb-2">
              <IndianRupee className="w-5 h-5 text-green-500" strokeWidth={1.75} />
            </div>
            <p className="text-[10px] font-black text-green-500 uppercase tracking-wider">Collected</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats?.collected}</p>
            <p className="text-[10px] text-stone-400 mt-1">Total fees received</p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/finance/invoices')}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-[40px] flex items-end justify-start pl-2 pb-2">
              <AlertCircle className="w-5 h-5 text-red-400" strokeWidth={1.75} />
            </div>
            <p className="text-[10px] font-black text-red-400 uppercase tracking-wider">Outstanding</p>
            <p className="text-2xl font-bold text-red-500 mt-1">{stats?.outstanding}</p>
            <p className="text-[10px] text-stone-400 mt-1">{pendingCount || 0} pending invoices</p>
          </div>

        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-stone-800 uppercase tracking-widest">Revenue Overview</h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  {period === 'month' ? `${MONTHS[currentMonth]} ${currentYear}` : period === 'year' ? `Year ${currentYear}` : 'Custom period'}
                </p>
              </div>
            </div>
            <div className="bg-stone-50 rounded-lg border border-dashed border-stone-200 p-4">
              <HorizontalComparisonBar collected={stats?.collected} outstanding={stats?.outstanding} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-stone-800 uppercase tracking-widest">Payment Methods</h2>
              </div>
            </div>
            <div className="bg-stone-50 rounded-lg border border-dashed border-stone-200 p-4 flex items-center justify-center">
              {paymentMethodData ? (
                <DonutChart data={paymentMethodData} />
              ) : (
                <span className="text-stone-400 text-sm font-medium">No data available</span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-stone-800 uppercase tracking-widest">Invoice Status</h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  {period === 'month' ? `${MONTHS[currentMonth]} ${currentYear}` : `Year ${currentYear}`}
                </p>
              </div>
            </div>
            <div className="bg-stone-50 rounded-lg border border-dashed border-stone-200 p-4">
              {invoiceStatusData ? (
                <StackedBar data={invoiceStatusData} />
              ) : (
                <span className="text-stone-400 text-sm font-medium">No data available</span>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-stone-800 uppercase tracking-widest">Class-wise Collection</h2>
                <p className="text-xs text-stone-400 mt-0.5">Collected vs outstanding for {currentYear}</p>
              </div>
            </div>
            <div className="bg-stone-50 rounded-lg border border-dashed border-stone-200 p-4 overflow-y-auto max-h-64">
              {classWiseData ? (
                <HorizontalBarChart data={classWiseData} />
              ) : (
                <span className="text-stone-400 text-sm font-medium">No data available</span>
              )}
            </div>
          </div>

        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-stone-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-stone-900">Recent Payments</h3>
              <button
                onClick={() => router.push('/dashboard/finance/payments')}
                className="text-sm font-bold text-orange-400 hover:text-orange-500 flex items-center gap-1"
              >
                View all <ArrowRight size={16} />
              </button>
            </div>
            <div className="overflow-x-auto flex-1">
              {recentPayments?.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <tbody className="text-sm divide-y divide-stone-200">
                    {recentPayments.map((payment, idx) => (
                      <tr key={idx} className="hover:bg-orange-50/20 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/finance/payments')}>
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
              ) : (
                <div className="p-8 text-center text-stone-400 text-sm font-medium">No payments recorded yet</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-stone-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-stone-900">Pending Invoices</h3>
              <button
                onClick={() => router.push('/dashboard/finance/invoices')}
                className="text-sm font-bold text-orange-400 hover:text-orange-500 flex items-center gap-1"
              >
                View all <ArrowRight size={16} />
              </button>
            </div>
            <div className="overflow-x-auto flex-1">
              {pendingInvoices?.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <tbody className="text-sm divide-y divide-stone-200">
                    {pendingInvoices.map((inv, idx) => (
                      <tr key={idx} className="hover:bg-orange-50/20 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/finance/invoices')}>
                        <td className="p-4">
                          <div className="font-bold text-stone-900">{inv.studentName}</div>
                          <div className="text-xs text-stone-400 font-medium mt-0.5">{inv.invoiceId} &middot; {inv.dueDate}</div>
                        </td>
                        <td className="p-4 font-bold text-stone-900 text-right">{inv.amount}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            inv.status === 'Paid' ? 'bg-green-50 text-green-600 border border-green-200' :
                            inv.status === 'Pending' ? 'bg-red-50 text-red-500 border border-red-200' :
                            'bg-amber-50 text-amber-600 border border-amber-200'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-stone-400 text-sm font-medium">No pending invoices</div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
