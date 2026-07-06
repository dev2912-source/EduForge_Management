'use client';
import { 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Eye, 
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function MyPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/student/payments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPayments(data);
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const totalPaidRaw = payments.reduce((acc, curr) => {
    return acc + parseInt(curr.amount.replace(/[^0-9]/g, ''), 10) || 0;
  }, 0);
  const totalPaidStr = '₹' + totalPaidRaw.toLocaleString();

  return (
    <div className="h-full flex flex-col gap-4 p-5 overflow-hidden bg-[#FAFAFA]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex-shrink-0">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-5 bg-[#F97316] rounded-full"></div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">
              My Payments
            </h1>
          </div>
          <p className="text-sm text-stone-500 font-medium ml-3.5">
            All fee payments and receipts
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap text-xs font-bold">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-100">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"></span>
            Total Paid: {totalPaidStr}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
            {payments.length} Payments
          </span>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        
        {/* Table Toolbar */}
        <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-3 flex-shrink-0">
          <div className="flex-1"></div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-[#F97316] transition-colors pointer-events-none" />
            <input 
              className="block rounded-lg border border-stone-200 bg-white pl-9 pr-4 py-1.5 text-sm text-stone-800 shadow-sm transition-all focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 w-44 sm:w-60" 
              placeholder="Search receipt, invoice…" 
              type="text" 
            />
          </div>
          <div className="relative flex-shrink-0">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all whitespace-nowrap bg-white text-stone-600 border-stone-200 hover:border-stone-300">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full min-w-[600px]">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="border-b border-stone-200">
                <th className="text-left py-3 px-4">
                  <button className="flex items-center gap-1.5 group text-sm font-bold text-stone-700 hover:text-stone-900 transition-colors">
                    Receipt #
                    <ArrowUpDown className="w-3.5 h-3.5 transition-colors text-stone-300 group-hover:text-stone-500" strokeWidth={2.5} />
                  </button>
                </th>
                <th className="hidden md:table-cell text-left py-3 px-4">
                  <span className="text-sm font-bold text-stone-700">Invoice #</span>
                </th>
                <th className="text-left py-3 px-4">
                  <button className="flex items-center gap-1.5 group text-sm font-bold text-stone-700 hover:text-stone-900 transition-colors">
                    Amount
                    <ArrowUpDown className="w-3.5 h-3.5 transition-colors text-stone-300 group-hover:text-stone-500" strokeWidth={2.5} />
                  </button>
                </th>
                <th className="hidden sm:table-cell text-left py-3 px-4">
                  <button className="flex items-center gap-1.5 group text-sm font-bold text-stone-700 hover:text-stone-900 transition-colors">
                    Method
                    <ArrowUpDown className="w-3.5 h-3.5 transition-colors text-stone-300 group-hover:text-stone-500" strokeWidth={2.5} />
                  </button>
                </th>
                <th className="text-left py-3 px-4">
                  <button className="flex items-center gap-1.5 group text-sm font-bold text-stone-700 hover:text-stone-900 transition-colors">
                    Date
                    <ArrowUpDown className="w-3.5 h-3.5 transition-colors text-[#F97316]" strokeWidth={2.5} />
                  </button>
                </th>
                <th className="text-left py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-stone-400">Loading...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-stone-400">No payments found.</td>
                </tr>
              ) : payments.map((payment, idx) => (
                <tr key={idx} className="group transition-all duration-100 cursor-pointer hover:bg-stone-50/70">
                  <td className="py-2.5 px-4">
                    <span className="font-mono text-xs font-bold text-stone-800">{payment.receiptId}</span>
                  </td>
                  <td className="hidden md:table-cell py-2.5 px-4">
                    <span className="font-mono text-xs text-stone-600">{payment.invoiceId || '—'}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-sm font-bold text-green-700">{payment.amount}</span>
                  </td>
                  <td className="hidden sm:table-cell py-2.5 px-4">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border bg-stone-50 text-stone-600 border-stone-200">
                      {payment.method || 'Online'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-sm text-stone-600">{payment.date || new Date(payment.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </td>
                  <td className="text-right py-2.5 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-lg text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Preview Receipt">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Download Receipt">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between gap-3 flex-shrink-0">
          <span className="text-xs font-bold text-stone-500 whitespace-nowrap">
            1–{payments.length} of <span className="text-stone-800 font-black">{payments.length}</span>
          </span>
          <div className="flex items-center gap-3">
            <div className="relative w-20">
              <button className="w-full flex items-center justify-between gap-2 text-left rounded-lg transition-all duration-150 border-[1.5px] bg-white px-2.5 py-1.5 text-xs border-stone-200 hover:border-stone-300" type="button">
                <span className="flex items-center gap-1.5 min-w-0 flex-1 text-stone-800 font-medium">
                  <span className="truncate">10</span>
                </span>
                <span className="flex items-center gap-1 flex-shrink-0">
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" strokeWidth={2.5} />
                </span>
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-[#F97316] hover:border-[#F97316]/30 hover:bg-[#F97316]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all" disabled>
                <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
              </button>
              <button className="min-w-[32px] h-8 rounded-lg text-xs font-black transition-all border bg-[#F97316] border-[#F97316] text-white shadow-sm shadow-[#F97316]/20">
                1
              </button>
              <button className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-[#F97316] hover:border-[#F97316]/30 hover:bg-[#F97316]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all" disabled>
                <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
