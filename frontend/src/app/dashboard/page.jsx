"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import StaffDashboard from "@/components/dashboard/StaffDashboard";
import StudentDashboard from "@/components/dashboard/StudentDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setRole(parsed.role || "student");
      } catch (e) {
        console.error(e);
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  if (!role) {
    return <div className="p-8 font-bold text-stone-400">Loading dashboard...</div>;
  }

  return (
    <>
      {role === "admin" && <AdminDashboard />}
      {role === "staff" && <StaffDashboard />}
      {role === "student" && <StudentDashboard />}
    </>
  );
}
