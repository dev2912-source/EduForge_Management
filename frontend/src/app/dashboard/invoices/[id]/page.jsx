"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Loader2, X as XIcon, ArrowLeft } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

function parseAmount(str) {
  if (!str) return 0;
  const num = parseInt(String(str).replace(/[^0-9.-]/g, ""), 10);
  return isNaN(num) ? 0 : num;
}

function formatINR(num) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/admin/invoices/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Invoice not found");
      const data = await res.json();
      if (!mountedRef.current) return;
      setInvoice(data.data);
    } catch (err) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [params.id]);

  const fetchPayments = useCallback(async () => {
    if (!invoice?.invoiceId) return;
    setPaymentsLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/admin/payments?invoice_id=${encodeURIComponent(invoice.invoiceId)}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch payments");
      const data = await res.json();
      if (!mountedRef.current) return;
      const items = Array.isArray(data) ? data : data.data || [];
      setPayments(items);
    } catch {
      // silently fail
    } finally {
      if (mountedRef.current) setPaymentsLoading(false);
    }
  }, [invoice?.invoiceId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchInvoice();
    return () => { mountedRef.current = false; };
  }, [fetchInvoice]);

  useEffect(() => {
    if (invoice) fetchPayments();
  }, [invoice, fetchPayments]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-orange-400" size={48} />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-stone-200 py-16 text-center">
          <p className="text-stone-400 font-medium">{error || "Invoice not found."}</p>
          <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-bold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const amt = parseAmount(invoice.amount);
  const paid = parseAmount(invoice.paidAmount);
  const bal = parseAmount(invoice.balance || invoice.amount) - paid;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-4">

      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-all"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <div className="w-0.5 h-5 bg-stone-200 rounded-full" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 bg-[#FF9933] rounded-full"></div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Invoice Detail</h1>
          </div>
        </div>
      </div>

      {/* Invoice Info Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-4">
        {/* Invoice Number + Status + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Invoice Number</p>
            <p className="text-2xl font-black text-stone-900 font-mono mt-0.5">{invoice.invoiceId || "—"}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusBadge status={(invoice.status || "pending").toLowerCase()} />
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-stone-100">
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Student</p>
            <p className="text-sm font-bold text-stone-800 mt-0.5">{invoice.studentName || invoice.student?.name || "—"}</p>
            <p className="text-xs font-mono text-stone-400">{invoice.student?.schoolId || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Due Date</p>
            <p className="text-sm font-bold text-stone-800 mt-0.5">{formatDate(invoice.dueDate)}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Academic Year</p>
            <p className="text-sm font-bold text-stone-800 mt-0.5">{invoice.academicYear || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Created</p>
            <p className="text-sm font-bold text-stone-800 mt-0.5">{formatDate(invoice.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100">
          <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Fee Breakdown</h2>
        </div>
        <div className="divide-y divide-stone-50">
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm font-medium text-stone-700">Tuition Fee</span>
            <span className="text-sm font-bold text-stone-800">{formatINR(amt)}</span>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-stone-100 bg-stone-50/40 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-stone-500 font-medium">Total Amount</span>
            <span className="font-bold text-stone-800">{formatINR(amt)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500 font-medium">Amount Paid</span>
            <span className="font-bold text-green-600">{formatINR(paid)}</span>
          </div>
          <div className="flex justify-between text-base font-black pt-2 border-t border-stone-200">
            <span className="text-stone-700">Balance Due</span>
            <span className={bal > 0 ? "text-red-600" : "text-green-600"}>
              {bal > 0 ? formatINR(bal) : "Paid in Full"}
            </span>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100">
          <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Payment History</h2>
        </div>
        {paymentsLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="animate-spin text-orange-400" size={24} />
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center text-stone-400 font-medium">
            No payments yet.
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {payments.map((p) => (
              <div key={p._id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-bold text-stone-800">{formatINR(parseAmount(p.amount))}</p>
                  <p className="text-xs text-stone-400 capitalize">
                    {(p.method || "").replace(/_/g, " ")}
                    {p.receiptId && <> · {p.receiptId}</>}
                  </p>
                </div>
                <p className="text-xs font-medium text-stone-500">{formatDate(p.date || p.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
