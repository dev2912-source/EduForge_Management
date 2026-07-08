"use client";

import Link from 'next/link';
import { Clock, ArrowUpRight } from 'lucide-react';

const PERIODS = [
  { num: 1, time: '8:00 AM - 8:45 AM' },
  { num: 2, time: '8:45 AM - 9:30 AM' },
  { num: 3, time: '9:30 AM - 10:15 AM' },
  { num: 4, time: '10:15 AM - 11:00 AM' },
  { num: null, time: '11:00 AM - 11:30 AM (Lunch)', lunch: true },
  { num: 5, time: '11:30 AM - 12:15 PM' },
  { num: 6, time: '12:15 PM - 1:00 PM' },
  { num: 7, time: '1:00 PM - 1:45 PM' },
  { num: 8, time: '1:45 PM - 2:30 PM' },
];

export default function SectionTimetablePeriods() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 flex items-center gap-3 border-b border-stone-100">
          <div className="w-9 h-9 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center"><Clock size={16} /></div>
          <div><h2 className="text-base font-bold text-stone-900">Timetable Periods</h2><p className="text-[12px] font-bold text-stone-500">Default school timetable with 8 periods and lunch break</p></div>
        </div>
        <div className="divide-y divide-stone-50">
          {PERIODS.map((p, i) => (
            <div key={i} className={`flex items-center gap-4 px-5 py-3 ${p.lunch ? 'bg-stone-50/50' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-black ${p.lunch ? 'bg-amber-50 text-amber-600' : 'bg-stone-100 text-stone-600'}`}>
                {p.lunch ? 'L' : `P${p.num}`}
              </div>
              <span className={`text-sm ${p.lunch ? 'font-bold text-amber-700' : 'font-bold text-stone-800'}`}>{p.time}</span>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-stone-100">
          <Link href="/dashboard/timetable" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#FF9933] hover:text-[#e8841f] transition-colors">
            Manage Timetable <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
