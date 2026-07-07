'use client';
import { Calendar, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function LeaveRequestsPage() {
  const [leaves, setLeaves] = useState([]);
  const [formData, setFormData] = useState({ fromDate: '', toDate: '', reason: '' });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const endpoint = user.role === 'staff' ? '/api/staff/leave' : '/api/student/leave';
      
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeaves(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fromDate || !formData.toDate || !formData.reason) {
      return setMsg({ type: 'error', text: 'Please fill all fields' });
    }
    
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const endpoint = user.role === 'staff' ? '/api/staff/leave' : '/api/student/leave';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setMsg({ type: 'success', text: 'Leave request submitted!' });
        setFormData({ fromDate: '', toDate: '', reason: '' });
        fetchLeaves(); // refresh list
      } else {
        setMsg({ type: 'error', text: 'Failed to submit request' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Server error' });
    }
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-y-auto bg-[#FAFAFA]">
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-5">
        
        {/* Header */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-2">
          <div className="w-1.5 h-5 bg-[#F97316] rounded-full"></div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">
            My Leave Requests
          </h1>
        </div>

        {/* Apply For Leave Form */}
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <h2 className="text-[11px] font-black text-stone-500 uppercase tracking-widest">
              APPLY FOR LEAVE
            </h2>
            {msg.text && (
              <span className={`text-[10px] font-bold px-2 py-1 rounded ${msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {msg.text}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                FROM
              </label>
              <div className="relative">
                <input 
                  type="date"
                  value={formData.fromDate}
                  onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                  className="w-full pl-3 pr-10 py-2 text-sm border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                TO
              </label>
              <div className="relative">
                <input 
                  type="date"
                  value={formData.toDate}
                  onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                  className="w-full pl-3 pr-10 py-2 text-sm border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
              REASON
            </label>
            <textarea 
              placeholder="Reason for leave" 
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full p-3 text-sm border border-stone-200 rounded-lg text-stone-800 resize-y focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]"
            ></textarea>
          </div>

          <div className="flex justify-end mt-1">
            <button type="submit" className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
              Submit Request
            </button>
          </div>
        </form>

        {/* Request History */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col">
          {/* History Header */}
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[11px] font-black text-stone-500 uppercase tracking-widest">
                REQUEST HISTORY
              </h2>
              <span className="text-xs font-medium text-stone-500">
                {leaves.length} records
              </span>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 rounded-lg transition-colors">
              <Filter className="w-3.5 h-3.5" />
              <span className="text-[11px] font-black tracking-widest uppercase">FILTER</span>
            </button>
          </div>

          {/* History List */}
          <div className="flex flex-col divide-y divide-stone-100">
            {loading ? (
              <div className="p-8 text-center text-stone-400">Loading...</div>
            ) : leaves.length === 0 ? (
              <div className="p-8 text-center text-stone-400">No leave requests found.</div>
            ) : leaves.map((leave, idx) => (
              <div key={idx} className="p-5 flex items-center justify-between hover:bg-stone-50/50 transition-colors">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-stone-900">
                    {new Date(leave.fromDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} – {new Date(leave.toDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-xs text-stone-500">
                    {leave.reason}
                  </span>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                  leave.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                  leave.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                  'bg-yellow-100 text-yellow-700 border-yellow-200'
                }`}>
                  {leave.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
