"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BookOpen } from 'lucide-react';

const API = 'http://localhost:5000/api/admin';

function getToken() { return localStorage.getItem('token'); }

const MEDIUM_COLORS = {
  ENGLISH: 'bg-green-100 text-green-700 border-green-200',
  HINDI: 'bg-orange-100 text-orange-700 border-orange-200',
  MARATHI: 'bg-blue-100 text-blue-700 border-blue-200',
  GUJARATI: 'bg-purple-100 text-purple-700 border-purple-200'
};

export default function SectionClassMediums() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await fetch(`${API}/classes?limit=200`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        const d = await res.json();
        if (d.success) setClasses(d.data || []);
      } catch {} finally { setLoading(false); }
    }
    fetch();
  }, []);

  const mediums = ['ENGLISH', 'HINDI', 'MARATHI', 'GUJARATI'].map(m => ({
    name: m,
    count: classes.filter(c => c.medium === m).length
  }));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 flex items-center gap-3 border-b border-stone-100">
          <div className="w-9 h-9 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center"><BookOpen size={16} /></div>
          <div><h2 className="text-base font-bold text-stone-900">Class Mediums</h2><p className="text-[12px] font-bold text-stone-500">Available mediums and their usage across classes</p></div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm font-bold text-stone-400 animate-pulse">Loading...</div>
        ) : (
          <div className="divide-y divide-stone-50">
            {mediums.map(m => (
              <div key={m.name} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wide border ${MEDIUM_COLORS[m.name]}`}>{m.name}</span>
                  <span className="text-xs text-stone-400 font-medium">{m.count} class{m.count !== 1 ? 'es' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="p-4 border-t border-stone-100">
          <Link href="/dashboard/classes" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#FF9933] hover:text-[#e8841f] transition-colors">
            Manage Classes <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
