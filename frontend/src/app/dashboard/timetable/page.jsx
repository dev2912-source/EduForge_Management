'use client';
import { useEffect, useState } from 'react';
import StudentTimetable from '@/components/dashboard/StudentTimetable';
import AdminTimetable from '@/components/dashboard/admin/AdminTimetable';

export default function TimetablePage() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setRole(user.role);
      } catch (e) {
        console.error('Failed to parse user role', e);
      }
    }
  }, []);

  if (!role) {
    return <div className="h-full flex items-center justify-center text-stone-400">Loading timetable...</div>;
  }

  if (role === 'admin') {
    return <AdminTimetable />;
  }

  // Fallback to student timetable for 'student' and 'staff' (for now)
  return <StudentTimetable />;
}
