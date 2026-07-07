'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, UserPlus, CreditCard } from 'lucide-react';

export default function AddMenu({ userRole }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const items = [];
  if (userRole === 'admin' || userRole === 'staff') {
    items.push({ label: 'Admit Student', icon: UserPlus, action: () => { router.push('/dashboard/students'); setOpen(false); } });
    items.push({ label: 'Record Payment', icon: CreditCard, action: () => { router.push('/dashboard/finance/payments'); setOpen(false); } });
  }

  if (items.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF9F43] hover:bg-[#ff8f23] text-white text-sm font-bold rounded-md transition-colors shadow-sm"
      >
        <Plus size={16} strokeWidth={3} />
        Add
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-stone-200 py-1 z-50">
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={item.action}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-orange-50 hover:text-[#C2410C] transition-colors text-left"
            >
              <item.icon size={18} className="text-stone-400" strokeWidth={1.75} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
