"use client";
import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown } from "lucide-react";

export default function ExportMenu({ onCsv, onExcel, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-stone-700 hover:bg-stone-50 border border-stone-200 shadow-sm transition-colors">
        <Download size={14} /> Export <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-20 py-1 min-w-[150px]">
          <button onClick={() => { onCsv?.(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => { onExcel?.(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors">
            <Download size={14} className="text-green-600" /> Export Excel
          </button>
        </div>
      )}
    </div>
  );
}
