"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tag, ArrowUpRight } from 'lucide-react';

const API = 'http://localhost:5000/api/admin';

function getToken() { return localStorage.getItem('token'); }

export default function SectionFeeCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await fetch(`${API}/fee-structures?limit=200`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        const d = await res.json();
        if (d.success) {
          const cats = [...new Set((d.data || []).map(f => f.category).filter(Boolean))].sort();
          setCategories(cats);
        }
      } catch {} finally { setLoading(false); }
    }
    fetch();
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 flex items-center gap-3 border-b border-stone-100">
          <div className="w-9 h-9 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center"><Tag size={16} /></div>
          <div><h2 className="text-base font-bold text-stone-900">Fee Categories</h2><p className="text-[12px] font-bold text-stone-500">Categories used across fee structures</p></div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm font-bold text-stone-400 animate-pulse">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-sm font-bold text-stone-400">No fee categories found. Create fee structures to see categories here.</div>
        ) : (
          <div className="p-4 flex flex-wrap gap-2">
            {categories.map(c => (
              <span key={c} className="px-3 py-1.5 rounded-full text-[12px] font-bold bg-stone-100 text-stone-700 border border-stone-200">{c}</span>
            ))}
          </div>
        )}
        <div className="p-4 border-t border-stone-100">
          <Link href="/dashboard/finance/structures" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#FF9933] hover:text-[#e8841f] transition-colors">
            Manage Fee Structures <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
