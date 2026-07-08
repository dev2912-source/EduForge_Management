"use client";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const DAY_NAMES = [
  { value: 0, label: "Monday", short: "Mon" },
  { value: 1, label: "Tuesday", short: "Tue" },
  { value: 2, label: "Wednesday", short: "Wed" },
  { value: 3, label: "Thursday", short: "Thu" },
  { value: 4, label: "Friday", short: "Fri" },
  { value: 5, label: "Saturday", short: "Sat" },
  { value: 6, label: "Sunday", short: "Sun" },
];

const SUBJECT_COLORS = [
  "#3B82F6", "#FF9933", "#7C3AED", "#059669", "#E11D48",
  "#0891B2", "#D97706", "#4F46E5", "#BE185D",
];

function hashColor(key) {
  if (!key) return SUBJECT_COLORS[0];
  let h = 0;
  for (const c of String(key)) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return SUBJECT_COLORS[h % SUBJECT_COLORS.length];
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [hh, mm] = timeStr.split(":").map(Number);
  const ampm = hh >= 12 ? "PM" : "AM";
  return `${hh % 12 || 12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

export default function StaffTimetable() {
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState([]);
  const [entries, setEntries] = useState([]);

  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const visibleDays = DAY_NAMES.filter(d => d.value < 6);

  const subjectMap = {};
  for (const e of entries) {
    if (e.subject?.name) {
      subjectMap[e.subject.name] = subjectMap[e.subject.name] || {
        id: e.subject.name,
        name: e.subject.name,
        color: hashColor(e.subject.name),
      };
    }
  }
  const subjectList = Object.values(subjectMap);

  const getEntry = (periodId, dayVal) =>
    entries.find(e => e.period_id === periodId && e.day_of_week === dayVal) || null;

  useEffect(() => {
    const fetchTimetable = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch("/api/staff/timetable/my-class", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load timetable");
        const d = await res.json();
        const data = d.data || {};
        setPeriods(data.periods || []);
        setEntries(data.entries || []);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, []);

  const hasAnySubject = entries.some(e => e.subject);
  const gridColumns = `80px repeat(${visibleDays.length}, 1fr)`;

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-2">
        <div className="w-1.5 h-5 bg-orange-500 rounded-full" />
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Class Timetable</h1>
          <p className="text-sm text-stone-500 font-medium">Your weekly class schedule</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-stone-200 py-16 flex justify-center">
          <Loader2 className="animate-spin text-orange-400" size={48} />
        </div>
      ) : !hasAnySubject ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 text-stone-500">
            <p className="font-bold text-stone-700">Timetable not set up yet</p>
            <p className="text-sm font-medium text-stone-400">
              Your class timetable has not been configured yet. Check back later.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="border-b-2 border-stone-100" style={{ display: "grid", gridTemplateColumns: gridColumns }}>
            <div className="border-r border-stone-100" style={{ minWidth: "80px", width: "80px" }} />
            {visibleDays.map(day => (
              <div
                key={day.value}
                className={`py-3 text-center border-r border-stone-100 last:border-r-0 ${
                  day.value === todayIndex ? "bg-orange-50" : ""
                }`}
              >
                <p className={`text-[11px] font-black uppercase tracking-widest ${
                  day.value === todayIndex ? "text-orange-500" : "text-stone-400"
                }`}>
                  {day.short}
                </p>
                {day.value === todayIndex ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mx-auto mt-1.5" />
                ) : (
                  <div className="h-3" />
                )}
              </div>
            ))}
          </div>

          {periods.map(period => {
            const isBreak = period.is_break;

            if (isBreak) {
              return (
                <div key={period.id} className="flex items-center border-b border-stone-100 bg-amber-50">
                  <div className="flex-none flex items-center py-2 px-3 border-r border-stone-100"
                    style={{ width: "80px", minWidth: "80px" }}>
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                      {formatTime(period.start_time)}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center gap-3 px-4 py-3">
                    <div className="h-px flex-1 bg-amber-200" />
                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest whitespace-nowrap px-1">
                      {period.name}&ensp;{formatTime(period.start_time)} – {formatTime(period.end_time)}
                    </span>
                    <div className="h-px flex-1 bg-amber-200" />
                  </div>
                </div>
              );
            }

            return (
              <div key={period.id}
                className="border-b border-stone-50 last:border-b-0"
                style={{ display: "grid", gridTemplateColumns: gridColumns }}>
                <div className="px-3 py-3 border-r border-stone-100 flex flex-col gap-0.5"
                  style={{ minWidth: "80px", width: "80px" }}>
                  <p className="text-[11px] font-bold text-stone-600 leading-none">{period.name}</p>
                  <p className="text-[10px] text-stone-400 font-medium leading-none mt-1">{formatTime(period.start_time)}</p>
                  <p className="text-[10px] text-stone-300 font-medium leading-none">{formatTime(period.end_time)}</p>
                </div>
                {visibleDays.map(day => {
                  const entry = getEntry(period.id, day.value);
                  const colorKey = entry?.subject?.name || "";
                  return (
                    <div key={day.value}
                      className={`px-1.5 py-1.5 border-r border-stone-100 last:border-r-0 min-h-[72px] ${
                        day.value === todayIndex ? "bg-orange-50" : ""
                      }`}>
                      {entry?.subject ? (
                        <div className="rounded-xl px-2.5 py-2 h-full flex flex-col justify-between min-h-[56px]"
                          style={{ backgroundColor: hashColor(colorKey) }}>
                          <p className="text-[11px] font-bold text-white leading-snug line-clamp-2">{entry.subject.name}</p>
                          <p className="text-[10px] font-semibold mt-1 leading-none" style={{ color: "rgba(255,255,255,0.72)" }}>
                            {entry.class?.name}{entry.section?.name ? ` • ${entry.section.name}` : ""}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {subjectList.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-4 py-3 flex flex-wrap gap-3 items-center">
          <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest mr-1">Subjects</span>
          {subjectList.map(subj => (
            <div key={subj.id} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: subj.color }} />
              <span className="text-xs font-semibold text-stone-600">{subj.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
