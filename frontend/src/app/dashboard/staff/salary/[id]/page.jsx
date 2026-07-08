"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, ChevronLeft, ArrowLeft } from 'lucide-react';

function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatMonth(d) {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getStatusBadge(status) {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return <span className="px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-green-50 text-green-700 border border-green-100">PAID</span>;
    return <span className="px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">PENDING</span>;
}

export default function SalarySlipDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [slip, setSlip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingPdf, setProcessingPdf] = useState(false);
    const [markingPaid, setMarkingPaid] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/staff/salary/${params.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Salary slip not found');
                const data = await res.json();
                if (!data.success) throw new Error(data.message || 'Not found');
                setSlip(data.data);
            } catch (err) {
                setError(err.message);
            }
            setLoading(false);
        })();
    }, [params.id]);

    const totalDeductions = (slip?.pf_deduction || 0) + (slip?.tax_deduction || 0) + (slip?.other_deductions || 0);

    const handleGeneratePdf = async () => {
        setProcessingPdf(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/staff/salary/${params.id}/pdf`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSlip(prev => ({ ...prev, pdf_path: data.data.url }));
            }
        } catch {
            alert('Failed to generate PDF');
        }
        setProcessingPdf(false);
    };

    const handleMarkPaid = async () => {
        if (!confirm(`Mark ${slip.staff_name}'s ${formatMonth(slip.slip_month)} salary as paid?`)) return;
        setMarkingPaid(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/staff/salary/${params.id}/mark-paid`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ payment_date: new Date().toISOString().split('T')[0] })
            });
            const data = await res.json();
            if (data.success) {
                setSlip(prev => ({ ...prev, payment_status: 'paid', payment_date: new Date().toISOString() }));
            }
        } catch {
            alert('Failed to update status');
        }
        setMarkingPaid(false);
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
                <div className="flex items-center justify-center py-12 text-sm text-stone-400">
                    <Loader2 size={16} className="animate-spin mr-2" /> Loading...
                </div>
            </div>
        );
    }

    if (error || !slip) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-8 text-center">
                    <p className="text-sm font-semibold text-stone-500 mb-3">{error || 'Salary slip not found'}</p>
                    <button onClick={() => router.push('/dashboard/staff/salary')} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-900 text-white hover:opacity-90">Back to Salary Slips</button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-4">
            {/* Header */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex items-center gap-3">
                <button onClick={() => router.push('/dashboard/staff/salary')} className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-all">
                    <ChevronLeft size={20} />
                </button>
                <div className="w-0.5 h-5 bg-stone-200 rounded-full" />
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 rounded-full bg-orange-500" />
                        <h1 className="text-xl font-bold text-stone-900 tracking-tight">Salary Slip</h1>
                    </div>
                </div>
            </div>

            {/* Salary Slip Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
                {/* Title Row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-stone-100">
                    <div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Salary Slip</p>
                        <p className="text-2xl font-black text-stone-900 mt-0.5">{formatMonth(slip.slip_month)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {getStatusBadge(slip.payment_status)}
                        <button
                            onClick={handleGeneratePdf}
                            disabled={processingPdf}
                            title={slip.pdf_path ? 'Regenerate PDF' : 'Generate PDF (not yet generated)'}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
                                slip.pdf_path
                                    ? 'text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-200'
                                    : 'text-red-500 bg-red-50 hover:bg-red-100 border-red-200'
                            }`}
                        >
                            {processingPdf ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            )}
                        </button>
                        {slip.pdf_path && (
                            <>
                                <button
                                    onClick={() => window.open(slip.pdf_path, '_blank')}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-500 hover:text-stone-700 transition-all"
                                    title="Preview PDF"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </button>
                                <a
                                    href={slip.pdf_path}
                                    download
                                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 transition-all"
                                    title="Download PDF"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </a>
                            </>
                        )}
                        {slip.payment_status !== 'paid' && (
                            <button
                                onClick={handleMarkPaid}
                                disabled={markingPaid}
                                className="w-9 h-9 rounded-xl flex items-center justify-center bg-green-50 hover:bg-green-100 border border-green-200 text-green-600 transition-all disabled:opacity-50"
                                title="Mark as Paid"
                            >
                                {markingPaid ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Staff Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Staff</p>
                        <p className="text-sm font-bold text-stone-800 mt-0.5">{slip.staff_name}</p>
                        <p className="text-xs font-mono text-stone-400">{slip.staff_code}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Department</p>
                        <p className="text-sm font-bold text-stone-800 mt-0.5">{slip.department || '—'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Payment Date</p>
                        <p className="text-sm font-bold text-stone-800 mt-0.5">{slip.payment_date ? formatDate(slip.payment_date) : 'Pending'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Generated</p>
                        <p className="text-sm font-bold text-stone-800 mt-0.5">{formatDate(slip.created_at)}</p>
                    </div>
                </div>
            </div>

            {/* Earnings & Deductions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-stone-100">
                        <h2 className="text-[10px] font-black text-green-600 uppercase tracking-widest">Earnings</h2>
                    </div>
                    <div className="divide-y divide-stone-50 text-sm">
                        <div className="flex justify-between px-5 py-2.5">
                            <span className="text-stone-600">Basic Salary</span>
                            <span className="font-bold text-stone-800">{formatCurrency(slip.basic)}</span>
                        </div>
                        <div className="flex justify-between px-5 py-2.5">
                            <span className="text-stone-600">HRA</span>
                            <span className="font-bold text-stone-800">{formatCurrency(slip.hra)}</span>
                        </div>
                        <div className="flex justify-between px-5 py-2.5">
                            <span className="text-stone-600">DA</span>
                            <span className="font-bold text-stone-800">{formatCurrency(slip.da)}</span>
                        </div>
                        <div className="flex justify-between px-5 py-2.5">
                            <span className="text-stone-600">TA</span>
                            <span className="font-bold text-stone-800">{formatCurrency(slip.ta)}</span>
                        </div>
                        <div className="flex justify-between px-5 py-2.5">
                            <span className="text-stone-600">Other Allowances</span>
                            <span className="font-bold text-stone-800">{formatCurrency(slip.other_allowances)}</span>
                        </div>
                        <div className="flex justify-between px-5 py-3 border-t border-stone-100 bg-green-50/40">
                            <span className="text-sm font-black text-green-700 uppercase tracking-wide">Gross Salary</span>
                            <span className="text-sm font-black text-green-700">{formatCurrency(slip.gross_salary)}</span>
                        </div>
                    </div>
                </div>

                {/* Deductions */}
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-stone-100">
                            <h2 className="text-[10px] font-black text-red-500 uppercase tracking-widest">Deductions</h2>
                        </div>
                        <div className="divide-y divide-stone-50 text-sm">
                            <div className="flex justify-between px-5 py-2.5">
                                <span className="text-stone-600">PF Deduction</span>
                                <span className="font-bold text-red-600">-{formatCurrency(slip.pf_deduction)}</span>
                            </div>
                            <div className="flex justify-between px-5 py-2.5">
                                <span className="text-stone-600">Tax Deduction</span>
                                <span className="font-bold text-red-600">-{formatCurrency(slip.tax_deduction)}</span>
                            </div>
                            <div className="flex justify-between px-5 py-2.5">
                                <span className="text-stone-600">Other Deductions</span>
                                <span className="font-bold text-red-600">-{formatCurrency(slip.other_deductions)}</span>
                            </div>
                            <div className="flex justify-between px-5 py-3 border-t border-stone-100 bg-red-50/40">
                                <span className="text-sm font-black text-red-600 uppercase tracking-wide">Total Deductions</span>
                                <span className="text-sm font-black text-red-600">-{formatCurrency(totalDeductions)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Net Salary */}
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Net Salary</p>
                            <p className="text-[9px] text-stone-400 mt-0.5">Take home after deductions</p>
                        </div>
                        <p className="text-2xl font-black" style={{ color: 'var(--orange)' }}>{formatCurrency(slip.net_salary)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
