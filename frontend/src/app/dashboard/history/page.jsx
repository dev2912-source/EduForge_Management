'use client';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AcademicHistoryPage() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/student/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHistoryData(data);
        }
      } catch (error) {
        console.error('Error fetching academic history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="h-full flex flex-col gap-4 p-5 overflow-hidden bg-[#FAFAFA]">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-[#F97316] rounded-full"></div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">
            Academic History
          </h1>
        </div>
        <p className="text-sm text-stone-500 font-medium ml-3.5 mt-1">
          Your year-by-year academic record
        </p>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full min-w-[560px]">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="border-b border-stone-200">
                <th className="text-left py-3 px-4">
                  <span className="text-sm font-bold text-stone-700">Academic Year</span>
                </th>
                <th className="text-left py-3 px-4">
                  <span className="text-sm font-bold text-stone-700">Class</span>
                </th>
                <th className="hidden sm:table-cell text-left py-3 px-4">
                  <span className="text-sm font-bold text-stone-700">Section</span>
                </th>
                <th className="text-left py-3 px-4">
                  <span className="text-sm font-bold text-stone-700">Status</span>
                </th>
                <th className="hidden md:table-cell text-left py-3 px-4">
                  <span className="text-sm font-bold text-stone-700">Remarks</span>
                </th>
                <th className="hidden sm:table-cell text-left py-3 px-4">
                  <span className="text-sm font-bold text-stone-700">Recorded On</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-stone-400">Loading...</td>
                </tr>
              ) : historyData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-stone-400">No academic history records found.</td>
                </tr>
              ) : historyData.map((row, idx) => (
                <tr key={idx} className="group transition-all duration-100 cursor-pointer hover:bg-stone-50/70">
                  <td className="py-2.5 px-4">
                    <span className="text-sm font-bold text-stone-900">{row.academicYear}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-sm text-stone-700 font-medium">{row.className}</span>
                  </td>
                  <td className="hidden sm:table-cell py-2.5 px-4">
                    <span className="text-sm text-stone-600">{row.section}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    {row.status === 'promoted' ? (
                      <span className="bg-green-50 text-green-700 border-green-100 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border">
                        promoted
                      </span>
                    ) : (
                      <span className="bg-stone-50 text-stone-500 border-stone-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border">
                        {row.status}
                      </span>
                    )}
                  </td>
                  <td className="hidden md:table-cell py-2.5 px-4">
                    <span className="text-xs text-stone-500 italic">{row.remarks}</span>
                  </td>
                  <td className="hidden sm:table-cell py-2.5 px-4">
                    <span className="text-sm text-stone-500">{new Date(row.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between gap-3 flex-shrink-0">
          <span className="text-xs font-bold text-stone-500 whitespace-nowrap">
            1–{historyData.length} of <span className="text-stone-800 font-black">{historyData.length}</span>
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
