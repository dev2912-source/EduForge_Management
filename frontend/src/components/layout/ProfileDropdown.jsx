'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut } from 'lucide-react';

export default function ProfileDropdown({ userInitials, userName, userEmail }) {
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

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center cursor-pointer"
      >
        <div className="p-0.5 border-2 border-stone-200 rounded-full hover:border-[#FF9F43] transition-colors">
          <div className="w-8 h-8 bg-[#FF9F43] text-white text-xs font-black rounded-full flex items-center justify-center select-none">
            {userInitials || 'U'}
          </div>
        </div>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-stone-200 z-50">
          <div className="px-4 py-3 border-b border-stone-200">
            <p className="text-sm font-bold text-stone-900 truncate">{userName || 'User'}</p>
            <p className="text-xs text-stone-500 truncate mt-0.5">{userEmail || ''}</p>
          </div>
          <div className="py-1">
            <button
              onClick={() => { router.push('/dashboard/settings'); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-orange-50 hover:text-[#C2410C] transition-colors text-left"
            >
              <User size={18} className="text-stone-400" strokeWidth={1.75} />
              My Profile
            </button>
            <button
              onClick={() => { router.push('/dashboard/settings'); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-orange-50 hover:text-[#C2410C] transition-colors text-left"
            >
              <Settings size={18} className="text-stone-400" strokeWidth={1.75} />
              Settings
            </button>
          </div>
          <div className="border-t border-stone-200 py-1">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut size={18} strokeWidth={2} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
