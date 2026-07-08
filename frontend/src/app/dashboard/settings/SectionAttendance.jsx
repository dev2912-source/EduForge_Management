"use client";

import Link from 'next/link';
import { CalendarCheck, Clock, ClipboardList, ArrowUpRight, CalendarRange } from 'lucide-react';

const LINKS = [
  { href: '/dashboard/attendance/reports', label: 'Attendance Reports', icon: CalendarRange, desc: 'View and export student attendance reports by class, section, and date range', color: 'border-l-green-400' },
  { href: '/dashboard/attendance/leave', label: 'Leave Requests', icon: ClipboardList, desc: 'Approve or reject student and staff leave applications', color: 'border-l-orange-400' },
  { href: '/dashboard/attendance/clock', label: 'Staff Clock', icon: Clock, desc: 'Monitor staff clock-in/out status for the day', color: 'border-l-blue-400' },
  { href: '/dashboard/timetable', label: 'Timetable', icon: CalendarCheck, desc: 'Manage class-wise subject schedules and period assignments', color: 'border-l-purple-400' }
];

export default function SectionAttendance() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 flex items-center gap-3 border-b border-stone-100">
          <div className="w-9 h-9 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center"><CalendarCheck size={16} /></div>
          <div><h2 className="text-base font-bold text-stone-900">Attendance & Schedule</h2><p className="text-[12px] font-bold text-stone-500">Quick access to attendance and timetable modules</p></div>
        </div>
        <div className="divide-y divide-stone-50">
          {LINKS.map(l => {
            const Icon = l.icon;
            return (
              <Link key={l.href} href={l.href} className={`flex items-start gap-4 px-5 py-4 hover:bg-stone-50/50 transition-colors border-l-2 ${l.color}`}>
                <div className="w-9 h-9 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center flex-shrink-0 mt-0.5"><Icon size={16} /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-stone-900">{l.label}</h3>
                    <ArrowUpRight size={13} className="text-stone-400" />
                  </div>
                  <p className="text-xs text-stone-500 font-medium mt-0.5">{l.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
