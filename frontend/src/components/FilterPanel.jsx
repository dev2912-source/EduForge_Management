"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, SlidersHorizontal, ChevronDown } from "lucide-react";

export default function FilterPanel({ fields = [], namespace = "filter", onFieldChange, onApply }) {
  const [open, setOpen] = useState(false);
  const [localValues, setLocalValues] = useState({});
  const [dropdowns, setDropdowns] = useState({});
  const ref = useRef(null);

  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const activeCount = fields.filter(f => {
    const v = localValues[f.key];
    if (!v) return false;
    if (Array.isArray(v)) return v.length > 0;
    return v !== "";
  }).length;

  const handleChange = useCallback((key, value) => {
    setLocalValues(prev => ({ ...prev, [key]: value }));
    onFieldChange?.({ field: key, value });
  }, [onFieldChange]);

  const clearValue = useCallback((key) => {
    setLocalValues(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    onFieldChange?.({ field: key, value: null });
  }, [onFieldChange]);

  const handleApply = () => {
    const result = fields.map(f => ({
      field: f.key,
      value: localValues[f.key]
    }));
    onApply?.(result);
    setOpen(false);
  };

  const handleClear = () => {
    setLocalValues({});
    const cleared = fields.map(f => ({ field: f.key, value: "" }));
    onApply?.(cleared);
    fields.forEach(f => onFieldChange?.({ field: f.key, value: null }));
    setOpen(false);
  };

  const renderDate = (field) => (
    <div key={field.key} className="space-y-1">
      <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">{field.label}</div>
      <input type="date" value={localValues[field.key] || ''}
        onChange={e => handleChange(field.key, e.target.value)}
        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
    </div>
  );

  const renderSelect = (field) => {
    const val = localValues[field.key];
    const isMulti = field.multiple;
    const selected = isMulti ? (Array.isArray(val) ? val : []) : val;

    if (isMulti) {
      const toggle = (optVal) => {
        const arr = [...(Array.isArray(localValues[field.key]) ? localValues[field.key] : [])];
        const idx = arr.indexOf(optVal);
        if (idx >= 0) arr.splice(idx, 1);
        else arr.push(optVal);
        handleChange(field.key, arr.length > 0 ? arr : "");
      };
      return (
        <div key={field.key} className="space-y-1">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">{field.label}</div>
          <div className="space-y-0.5">
            {(field.options || []).map(opt => (
              <label key={opt.value} className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-stone-50 text-[13px] font-medium">
                <input type="checkbox" checked={selected.includes(opt.value)} onChange={() => toggle(opt.value)}
                  className="w-3.5 h-3.5 rounded border-stone-300 text-orange-500 focus:ring-orange-500" />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div key={field.key} className="space-y-1">
        <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">{field.label}</div>
        <select value={selected || ""} onChange={e => handleChange(field.key, e.target.value)}
          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
          <option value="">All {field.label}s</option>
          {(field.options || []).map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm">
        <SlidersHorizontal size={14} />
        Filters
        {activeCount > 0 && (
          <span className="bg-orange-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-black ml-0.5">
            {activeCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-30 p-4 min-w-[220px] space-y-3"
          onClick={e => e.stopPropagation()}>
          {fields.map(field => {
            if (field.dependsOn && !localValues[field.dependsOn]) return null;
            if (field.type === 'date') return renderDate(field);
            return renderSelect(field);
          })}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <button onClick={handleClear} className="text-[12px] font-bold text-stone-400 hover:text-red-500 transition-colors">Clear</button>
            <button onClick={handleApply}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[12px] font-bold transition-colors">Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}
