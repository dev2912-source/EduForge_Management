"use client";

import { useState } from "react";
import { 
  Users, 
  CheckCircle2, 
  Clock,
  XCircle,
  Search,
  Filter,
  Plus,
  MoreHorizontal
} from "lucide-react";

export default function AdmissionsPage() {
  const stats = [
    { label: "Total Applications", value: "342", icon: Users, color: "text-blue-600 bg-blue-50 border-blue-100" },
    { label: "Approved", value: "215", icon: CheckCircle2, color: "text-green-600 bg-green-50 border-green-100" },
    { label: "Pending Review", value: "84", icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-100" },
    { label: "Rejected", value: "43", icon: XCircle, color: "text-red-600 bg-red-50 border-red-100" },
  ];

  const applications = [
    { id: "APP-2026-1042", name: "Aarav Sharma", grade: "Grade 4", date: "06 Jul 2026", status: "Approved", score: "88%" },
    { id: "APP-2026-1043", name: "Priya Patel", grade: "Grade 1", date: "05 Jul 2026", status: "Pending", score: "-" },
    { id: "APP-2026-1044", name: "Rahul Verma", grade: "Grade 6", date: "04 Jul 2026", status: "Approved", score: "92%" },
    { id: "APP-2026-1045", name: "Neha Gupta", grade: "Grade 3", date: "03 Jul 2026", status: "Rejected", score: "45%" },
    { id: "APP-2026-1046", name: "Vivaan Singh", grade: "Grade 8", date: "02 Jul 2026", status: "Pending", score: "78%" },
    { id: "APP-2026-1047", name: "Ananya Desai", grade: "Grade 2", date: "01 Jul 2026", status: "Approved", score: "85%" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-main tracking-tight">Admissions Pipeline</h1>
          <p className="text-sm font-medium text-text-secondary mt-1">Manage new student applications and enrollments.</p>
        </div>
        
        <button className="bg-orange hover:bg-orange-hover text-white font-bold py-2.5 px-5 rounded-xl text-sm shadow-md shadow-orange/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2">
          <Plus size={18} />
          New Application
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-4 sm:p-5 rounded-2xl border border-card-border shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0 ${stat.color}`}>
              <stat.icon size={24} strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-text-muted uppercase tracking-wider mb-0.5">{stat.label}</p>
              <h3 className="text-2xl font-black text-text-main">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-2xl border border-card-border shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-card-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-stone-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or ID..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none bg-white border border-card-border hover:border-orange text-text-main font-bold py-2 px-4 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2">
              <Filter size={16} /> Filter
            </button>
            <select className="flex-1 sm:flex-none bg-white border border-card-border rounded-xl text-sm font-bold py-2 px-4 focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 shadow-sm appearance-none cursor-pointer">
              <option>All Grades</option>
              <option>Grade 1</option>
              <option>Grade 2</option>
              <option>Grade 3</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-main text-xs font-bold text-text-muted uppercase tracking-wider">
                <th className="p-4 border-b border-card-border">Application ID</th>
                <th className="p-4 border-b border-card-border">Student Name</th>
                <th className="p-4 border-b border-card-border">Grade Applied</th>
                <th className="p-4 border-b border-card-border">Entrance Score</th>
                <th className="p-4 border-b border-card-border">Date</th>
                <th className="p-4 border-b border-card-border">Status</th>
                <th className="p-4 border-b border-card-border w-16"></th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-card-border">
              {applications.map((app, idx) => (
                <tr key={idx} className="hover:bg-orange-light/20 transition-colors">
                  <td className="p-4 font-bold text-text-secondary">{app.id}</td>
                  <td className="p-4">
                    <div className="font-bold text-text-main">{app.name}</div>
                  </td>
                  <td className="p-4 font-semibold text-text-secondary">{app.grade}</td>
                  <td className="p-4 font-bold text-text-main">{app.score}</td>
                  <td className="p-4 font-medium text-text-muted">{app.date}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                      app.status === 'Approved' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : app.status === 'Rejected'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button className="text-text-muted hover:text-orange transition-colors p-1 rounded-md hover:bg-orange-light">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-card-border flex items-center justify-between text-sm text-text-muted font-medium bg-stone-50/50">
          <div>Showing 1 to 6 of 342 entries</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-card-border rounded-lg bg-white hover:border-orange hover:text-orange disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 border border-orange rounded-lg bg-orange text-white font-bold">1</button>
            <button className="px-3 py-1 border border-card-border rounded-lg bg-white hover:border-orange hover:text-orange">2</button>
            <button className="px-3 py-1 border border-card-border rounded-lg bg-white hover:border-orange hover:text-orange">3</button>
            <button className="px-3 py-1 border border-card-border rounded-lg bg-white hover:border-orange hover:text-orange">Next</button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
