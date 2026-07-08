"use client";

import { Construction } from 'lucide-react';

export default function SectionSalaryStructures() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center"><Construction size={20} className="text-amber-500" /></div>
          <p className="text-sm font-bold text-stone-900">Coming Soon</p>
          <p className="text-xs text-stone-400 font-medium max-w-xs text-center">Salary structure configuration will be available in a future update. Individual salary slips can be generated from the Staff &rarr; Salary section.</p>
        </div>
      </div>
    </div>
  );
}
