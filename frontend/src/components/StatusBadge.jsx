const STATUS_STYLES = {
  active: "bg-green-50 text-green-700",
  inactive: "bg-stone-100 text-stone-500",
  graduated: "bg-blue-50 text-blue-700",
  pending: "bg-amber-50 text-amber-600",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
  paid: "bg-green-50 text-green-700",
  partial: "bg-blue-50 text-blue-700",

  overdue: "bg-red-50 text-red-600",
  unpaid: "bg-red-50 text-red-600",
  late: "bg-orange-50 text-orange-700",
  present: "bg-green-50 text-green-700",
  absent: "bg-red-50 text-red-600",
};

export default function StatusBadge({ status, className = "" }) {
  const s = (status || "active").toLowerCase();
  const style = STATUS_STYLES[s] || "bg-stone-100 text-stone-600";
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase ${style} ${className}`}>
      {s}
    </span>
  );
}
