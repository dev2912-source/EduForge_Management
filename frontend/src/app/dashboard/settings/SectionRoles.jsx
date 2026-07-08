"use client";

import { Shield, UserCheck, UserCog, Users } from 'lucide-react';

const ROLES = [
  { name: 'Admin', icon: UserCog, desc: 'Full system access — manage classes, staff, students, fees, attendance, settings, and all modules', color: 'bg-red-50 text-red-600 border-red-200' },
  { name: 'Staff', icon: Users, desc: 'Limited access — mark attendance, manage timetable, view student profiles, submit leave requests', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { name: 'Student', icon: UserCheck, desc: 'Self-service access — view attendance, timetable, fee invoices, submit leave requests, update profile', color: 'bg-green-50 text-green-600 border-green-200' }
];

export default function SectionRoles() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 flex items-center gap-3 border-b border-stone-100">
          <div className="w-9 h-9 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center"><Shield size={16} /></div>
          <div><h2 className="text-base font-bold text-stone-900">System Roles</h2><p className="text-[12px] font-bold text-stone-500">Pre-defined roles with module-level access control</p></div>
        </div>
        <div className="divide-y divide-stone-50">
          {ROLES.map(r => {
            const Icon = r.icon;
            return (
              <div key={r.name} className="flex items-start gap-4 px-5 py-4">
                <div className={`w-9 h-9 rounded-full ${r.color.split(' ')[0]} flex items-center justify-center flex-shrink-0 mt-0.5 border ${r.color.split(' ')[2]}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-stone-900">{r.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${r.color}`}>{r.name}</span>
                  </div>
                  <p className="text-xs text-stone-500 font-medium mt-1">{r.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
