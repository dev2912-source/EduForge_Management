"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Loader2, X, AlertCircle, FileText, DollarSign, Download, CreditCard, Zap } from 'lucide-react';

const STATUS_TABS = ['All', 'Pending', 'Paid', 'Partial', 'Overdue'];

const STATUS_BADGE = {
    Paid: 'bg-green-50 text-green-700 border-green-200',
    Overdue: 'bg-red-50 text-red-700 border-red-200',
    Pending: 'bg-orange-50 text-orange-600 border-orange-200',
    Partial: 'bg-amber-50 text-amber-600 border-amber-200',
};

const PAYMENT_METHODS = ['Cash', 'Cheque', 'Bank Transfer', 'Online', 'DD'];

function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function parseCurrency(str) {
    if (!str) return 0;
    return parseInt(str.replace(/[₹,]/g, '')) || 0;
}

function getStatusBadge(status) {
    const s = (status || '').charAt(0).toUpperCase() + (status || '').slice(1).toLowerCase();
    const colors = STATUS_BADGE[s] || 'bg-stone-50 text-stone-600 border-stone-200';
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${colors}`}>
            {s || 'Pending'}
        </span>
    );
}

export default function FeeInvoicesPage() {
    const [invoices, setInvoices] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sort, setSort] = useState({ key: 'createdAt', dir: 'desc' });
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(() => {
        if (typeof window !== 'undefined') {
            return parseInt(localStorage.getItem('invoicesPerPage')) || 10;
        }
        return 10;
    });
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({ studentName: '', amount: '', dueDate: '', status: 'Pending' });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    // Record Payment state
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentInvoice, setPaymentInvoice] = useState(null);
    const [paymentData, setPaymentData] = useState({ amount: '', method: 'Cash', date: '' });
    const [paying, setPaying] = useState(false);
    const [paymentError, setPaymentError] = useState(null);

    // Auto-generate state
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generateData, setGenerateData] = useState({ className: '', academicYear: '' });
    const [generating, setGenerating] = useState(false);
    const [generateResult, setGenerateResult] = useState(null);
    const [generateError, setGenerateError] = useState(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch invoices
    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            let url = `http://localhost:5000/api/admin/invoices?page=${page}&limit=${perPage}&search=${debouncedSearch}&sort=${sort.key}:${sort.dir}`;
            if (statusFilter !== 'All') {
                url += `&status=${statusFilter.toLowerCase()}`;
            }
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            if (data.success) {
                setInvoices(data.data);
                setTotal(data.total);
            } else {
                throw new Error(data.message || 'Failed to fetch');
            }
        } catch (err) {
            setError(err.message);
            setInvoices([]);
            setTotal(0);
        }
        setLoading(false);
    }, [page, perPage, debouncedSearch, sort, statusFilter]);

    useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const startItem = total === 0 ? 0 : (page - 1) * perPage + 1;
    const endItem = Math.min(page * perPage, total);

    const handleSort = (key) => {
        setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
    };

    const SortIcon = ({ columnKey }) => {
        if (sort.key !== columnKey) return <ChevronDown size={12} className="text-stone-400 opacity-0 group-hover:opacity-100" strokeWidth={3} />;
        return sort.dir === 'asc'
            ? <ChevronUp size={12} style={{ color: 'var(--orange)' }} strokeWidth={3} />
            : <ChevronDown size={12} style={{ color: 'var(--orange)' }} strokeWidth={3} />;
    };

    // Sorting is server-side via API. The `invoices` state is already sorted from backend.

    const openAddModal = () => {
        setEditingItem(null);
        setFormData({ studentName: '', amount: '', dueDate: '', status: 'Pending' });
        setFormError(null);
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({
            studentName: item.studentName,
            amount: item.amount,
            dueDate: item.dueDate,
            status: item.status
        });
        setFormError(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setFormError(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);
        try {
            const token = localStorage.getItem('token');
            const url = editingItem
                ? `http://localhost:5000/api/admin/invoices/${editingItem._id}`
                : 'http://localhost:5000/api/admin/invoices';
            const method = editingItem ? 'PUT' : 'POST';
            const body = editingItem ? formData : { ...formData };
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save');
            closeModal();
            fetchInvoices();
        } catch (err) {
            setFormError(err.message);
        }
        setSubmitting(false);
    };

    const openDeleteModal = (id) => {
        setDeletingId(id);
        setDeleteError(null);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeletingId(null);
        setDeleteError(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/admin/invoices/${deletingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete');
            closeDeleteModal();
            fetchInvoices();
        } catch (err) {
            setDeleteError(err.message);
        }
        setDeleting(false);
    };

    const handlePerPageChange = (val) => {
        setPerPage(val);
        localStorage.setItem('invoicesPerPage', val.toString());
        setPage(1);
    };

    // Record Payment
    const openPaymentModal = (invoice) => {
        setPaymentInvoice(invoice);
        const paid = parseCurrency(invoice.paidAmount);
        const totalAmt = parseCurrency(invoice.amount);
        const remaining = totalAmt - paid;
        setPaymentData({
            amount: remaining > 0 ? `₹${remaining.toLocaleString('en-IN')}` : '',
            method: 'Cash',
            date: new Date().toISOString().split('T')[0]
        });
        setPaymentError(null);
        setShowPaymentModal(true);
    };

    const closePaymentModal = () => {
        setShowPaymentModal(false);
        setPaymentInvoice(null);
        setPaymentError(null);
    };

    const handlePaymentChange = (e) => {
        const { name, value } = e.target;
        setPaymentData(prev => ({ ...prev, [name]: value }));
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!paymentInvoice) return;
        setPaying(true);
        setPaymentError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/admin/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    invoiceId: paymentInvoice.invoiceId,
                    studentName: paymentInvoice.studentName,
                    amount: paymentData.amount,
                    method: paymentData.method,
                    date: paymentData.date
                })
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Payment failed');
            closePaymentModal();
            fetchInvoices();
        } catch (err) {
            setPaymentError(err.message);
        }
        setPaying(false);
    };

    // Auto-generate invoices
    const openGenerateModal = () => {
        setGenerateData({ className: '', academicYear: '' });
        setGenerateResult(null);
        setGenerateError(null);
        setShowGenerateModal(true);
    };

    const closeGenerateModal = () => {
        setShowGenerateModal(false);
        setGenerateResult(null);
        setGenerateError(null);
    };

    const handleGenerateSubmit = async (e) => {
        e.preventDefault();
        setGenerating(true);
        setGenerateError(null);
        setGenerateResult(null);
        try {
            const token = localStorage.getItem('token');
            const body = {};
            if (generateData.className) body.className = generateData.className;
            if (generateData.academicYear) body.academicYear = generateData.academicYear;
            const res = await fetch('http://localhost:5000/api/admin/invoices/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Generation failed');
            setGenerateResult(data);
            fetchInvoices();
        } catch (err) {
            setGenerateError(err.message);
        }
        setGenerating(false);
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            let start = Math.max(2, page - 1);
            let end = Math.min(totalPages - 1, page + 1);
            if (page <= 2) { start = 2; end = Math.min(4, totalPages - 1); }
            if (page >= totalPages - 1) { start = Math.max(totalPages - 3, 2); end = totalPages - 1; }
            if (start > 2) pages.push('...');
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: 'var(--orange)' }}></div>
                        <h1 className="text-xl font-bold text-stone-900 tracking-tight">Fee Invoices</h1>
                    </div>
                    <p className="text-sm text-stone-500 font-medium pl-3.5">
                        <span className="font-bold" style={{ color: 'var(--orange)' }}>{total}</span> total invoices
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button className="flex items-center gap-1.5 py-2 px-4 text-sm font-semibold rounded-xl border border-stone-300 bg-white text-stone-600 hover:border-stone-400 hover:bg-stone-50 transition-all shadow-sm">
                        <Download size={16} /> Export
                    </button>
                    <button onClick={openGenerateModal} className="flex items-center gap-1.5 py-2 px-4 text-sm font-semibold rounded-xl border border-stone-300 bg-white text-stone-600 hover:border-stone-400 hover:bg-stone-50 transition-all shadow-sm">
                        <Zap size={16} /> Generate
                    </button>
                    <button onClick={openAddModal} className="flex items-center gap-1.5 py-2 px-5 text-sm font-semibold rounded-xl text-white transition-all shadow-sm hover:opacity-90" style={{ backgroundColor: '#111' }}>
                        <Plus size={16} strokeWidth={3} /> Create Invoice
                    </button>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                {/* Search & Status Filter Bar */}
                <div className="px-3 py-3 border-b border-stone-100 bg-white">
                    <div className="flex items-center gap-2">
                        <div className="relative group flex-1 max-w-xs">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-orange">
                                <Search size={14} strokeWidth={2.5} />
                            </div>
                            <input
                                type="text"
                                className="block rounded-lg border border-stone-200 bg-white pl-8 pr-7 py-1.5 text-sm text-stone-800 shadow-sm transition-all focus:outline-none focus:ring-2 w-full"
                                placeholder="Search by ID or student..."
                                style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                            {STATUS_TABS.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setStatusFilter(tab); setPage(1); }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        statusFilter === tab
                                            ? 'bg-stone-900 text-white shadow-sm'
                                            : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <AlertCircle size={40} className="text-red-300 mb-3" />
                        <p className="text-sm font-semibold text-stone-600 mb-3">{error}</p>
                        <button onClick={fetchInvoices} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-900 text-white hover:opacity-90 transition-all">
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!error && !loading && invoices.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <FileText size={40} className="text-stone-300 mb-3" />
                        {debouncedSearch || statusFilter !== 'All' ? (
                            <>
                                <p className="text-sm font-semibold text-stone-600 mb-1">No invoices match your search</p>
                                <p className="text-xs text-stone-400">Try different search terms or clear filters</p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-semibold text-stone-600 mb-1">No invoices yet</p>
                                <p className="text-xs text-stone-400 mb-4">Create your first invoice or auto-generate from fee structures</p>
                                <div className="flex items-center gap-2">
                                    <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all" style={{ backgroundColor: '#111' }}>
                                        <Plus size={14} /> Create Invoice
                                    </button>
                                    <button onClick={openGenerateModal} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-stone-300 text-stone-600 hover:bg-stone-50 transition-all">
                                        <Zap size={14} /> Generate
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Table */}
                {!error && (loading || invoices.length > 0) && (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead>
                                <tr className="bg-white border-b border-stone-200 text-left">
                                    <th className="w-12 py-4 pl-5 pr-2">
                                        <div className="w-4 h-4 rounded border-2 border-stone-300" />
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('invoiceId')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Invoice ID <SortIcon columnKey="invoiceId" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('studentName')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Student Name <SortIcon columnKey="studentName" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('amount')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Amount <SortIcon columnKey="amount" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('paidAmount')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Paid <SortIcon columnKey="paidAmount" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('balance')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Balance <SortIcon columnKey="balance" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('dueDate')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Due Date <SortIcon columnKey="dueDate" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('status')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Status <SortIcon columnKey="status" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3 pr-5">
                                        <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Created At <SortIcon columnKey="createdAt" />
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="py-8 text-center">
                                            <div className="flex items-center justify-center gap-2 text-sm text-stone-400">
                                                <Loader2 size={16} className="animate-spin" />
                                                Loading invoices...
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map((invoice) => (
                                        <tr
                                            key={invoice._id}
                                            className="group transition-all duration-100 cursor-pointer hover:bg-stone-50/70"
                                        >
                                            <td className="w-12 py-3 pl-5 pr-2">
                                                <div className="w-4 h-4 rounded border-2 border-stone-300" />
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs font-mono font-bold text-stone-500 group-hover:text-stone-800">{invoice.invoiceId}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-sm font-black text-stone-700">{invoice.studentName}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-sm font-semibold text-stone-600">{invoice.amount}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-sm font-semibold text-green-600">{invoice.paidAmount}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className={`text-sm font-black ${parseCurrency(invoice.balance) > 0 ? 'text-red-600' : 'text-stone-800'}`}>
                                                    {invoice.balance}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs font-semibold text-stone-500">{formatDate(invoice.dueDate)}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                {getStatusBadge(invoice.status)}
                                            </td>
                                            <td className="py-3 px-3 pr-5">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-stone-400 font-medium whitespace-nowrap flex-1">
                                                        {formatDateTime(invoice.createdAt)}
                                                    </span>
                                                    {invoice.status !== 'Paid' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openPaymentModal(invoice); }}
                                                            className="p-1 text-stone-400 hover:text-green-500 transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Record Payment"
                                                        >
                                                            <CreditCard size={13} strokeWidth={2.5} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openEditModal(invoice); }}
                                                        className="p-1 text-stone-400 hover:text-orange-500 transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={13} strokeWidth={2.5} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openDeleteModal(invoice._id); }}
                                                        className="p-1 text-stone-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={13} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!error && total > 0 && (
                    <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-stone-500 whitespace-nowrap">
                            {startItem}–{endItem} of <span className="text-stone-800 font-black">{total}</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <select
                                    value={perPage}
                                    onChange={(e) => handlePerPageChange(Number(e.target.value))}
                                    className="appearance-none rounded-lg border-[1.5px] bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 border-[#E8E0D4] hover:border-[#C8BEB4] focus:outline-none cursor-pointer pr-6"
                                >
                                    {[10, 25, 50, 100].map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400" />
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                {getPageNumbers().map((p, idx) =>
                                    p === '...' ? (
                                        <span key={`ellipsis-${idx}`} className="px-1 text-xs text-stone-400">...</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`min-w-[32px] h-8 rounded-lg text-xs font-black transition-all border ${
                                                page === p
                                                    ? 'bg-[#F9932B] border-[#F9932B] text-white shadow-sm shadow-orange-500/20'
                                                    : 'bg-white border-stone-200 text-stone-500 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    )
                                )}
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={closeModal}>
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-stone-900">{editingItem ? 'Edit Invoice' : 'Generate Invoice'}</h2>
                            <button onClick={closeModal} className="p-1 text-stone-400 hover:text-stone-600 transition-colors"><X size={20} /></button>
                        </div>
                        {formError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm font-medium text-red-700">{formError}</div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Student Name</label>
                                <input type="text" name="studentName" value={formData.studentName} onChange={handleChange} required
                                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Amount</label>
                                <input type="text" name="amount" value={formData.amount} onChange={handleChange} required placeholder="e.g. ₹50,000"
                                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Due Date</label>
                                <input type="text" name="dueDate" value={formData.dueDate} onChange={handleChange} required placeholder="e.g. 10 Feb 2026"
                                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Status</label>
                                <select name="status" value={formData.status} onChange={handleChange}
                                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
                                    <option value="Pending">Pending</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Partial">Partial</option>
                                    <option value="Overdue">Overdue</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed" style={{ backgroundColor: '#FF9F43' }}>
                                    {submitting && <Loader2 size={14} className="animate-spin" />}
                                    {editingItem ? 'Update' : 'Generate'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={closeDeleteModal}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                                <Trash2 size={18} className="text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-stone-900">Delete Invoice</h2>
                                <p className="text-sm text-stone-500">This action cannot be undone.</p>
                            </div>
                        </div>
                        {deleteError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm font-medium text-red-700">{deleteError}</div>
                        )}
                        <p className="text-sm text-stone-600 mb-6">Are you sure you want to delete this invoice?</p>
                        <div className="flex items-center justify-end gap-2">
                            <button onClick={closeDeleteModal} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors">Cancel</button>
                            <button onClick={handleDeleteConfirm} disabled={deleting} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                {deleting && <Loader2 size={14} className="animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Record Payment Modal */}
            {showPaymentModal && paymentInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={closePaymentModal}>
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-stone-900">Record Payment</h2>
                            <button onClick={closePaymentModal} className="p-1 text-stone-400 hover:text-stone-600 transition-colors"><X size={20} /></button>
                        </div>
                        {paymentError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm font-medium text-red-700">{paymentError}</div>
                        )}
                        <div className="mb-4 p-3 rounded-lg bg-stone-50 border border-stone-200">
                            <p className="text-xs font-semibold text-stone-500">Invoice: <span className="text-stone-800">{paymentInvoice.invoiceId}</span></p>
                            <p className="text-xs font-semibold text-stone-500">Student: <span className="text-stone-800">{paymentInvoice.studentName}</span></p>
                            <p className="text-xs font-semibold text-stone-500">Total: <span className="text-stone-800">{paymentInvoice.amount}</span></p>
                            <p className="text-xs font-semibold text-stone-500">Paid: <span className="text-green-600">{paymentInvoice.paidAmount}</span></p>
                            <p className="text-xs font-semibold text-stone-500">Balance: <span className={parseCurrency(paymentInvoice.balance) > 0 ? 'text-red-600' : 'text-stone-800'}>{paymentInvoice.balance}</span></p>
                        </div>
                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Amount</label>
                                <input type="text" name="amount" value={paymentData.amount} onChange={handlePaymentChange} required placeholder="e.g. ₹5,000"
                                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Payment Method</label>
                                <select name="method" value={paymentData.method} onChange={handlePaymentChange}
                                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
                                    {PAYMENT_METHODS.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Date</label>
                                <input type="date" name="date" value={paymentData.date} onChange={handlePaymentChange} required
                                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={closePaymentModal} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors">Cancel</button>
                                <button type="submit" disabled={paying} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed" style={{ backgroundColor: '#16A34A' }}>
                                    {paying && <Loader2 size={14} className="animate-spin" />}
                                    <DollarSign size={14} /> Record Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Auto-generate Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={closeGenerateModal}>
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-stone-900">Generate Invoices</h2>
                            <button onClick={closeGenerateModal} className="p-1 text-stone-400 hover:text-stone-600 transition-colors"><X size={20} /></button>
                        </div>
                        {generateResult ? (
                            <div>
                                <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-center">
                                    <FileText size={32} className="mx-auto mb-2 text-green-500" />
                                    <p className="text-lg font-black text-green-700">{generateResult.created}</p>
                                    <p className="text-sm font-semibold text-green-600">invoices generated</p>
                                </div>
                                <button onClick={closeGenerateModal} className="w-full py-2 rounded-lg text-sm font-semibold bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors">Done</button>
                            </div>
                        ) : (
                            <form onSubmit={handleGenerateSubmit} className="space-y-4">
                                {generateError && (
                                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm font-medium text-red-700">{generateError}</div>
                                )}
                                <p className="text-sm text-stone-600">Generate invoices for active students based on fee structures. Leave fields blank to generate for all.</p>
                                <div>
                                    <label className="block text-sm font-semibold text-stone-700 mb-1">Class Name (optional)</label>
                                    <input type="text" name="className" value={generateData.className} onChange={(e) => setGenerateData(prev => ({ ...prev, className: e.target.value }))}
                                        placeholder="Leave blank for all classes"
                                        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-stone-700 mb-1">Academic Year (optional)</label>
                                    <input type="text" name="academicYear" value={generateData.academicYear} onChange={(e) => setGenerateData(prev => ({ ...prev, academicYear: e.target.value }))}
                                        placeholder="e.g. 2025-26"
                                        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <button type="button" onClick={closeGenerateModal} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors">Cancel</button>
                                    <button type="submit" disabled={generating} className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed" style={{ backgroundColor: '#111' }}>
                                        {generating && <Loader2 size={14} className="animate-spin" />}
                                        <Zap size={14} /> Generate
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
