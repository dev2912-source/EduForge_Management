'use client';
import { useState, useRef, useEffect } from 'react';
import { Bell, Loader2, CheckCheck, X } from 'lucide-react';

function timeSince(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/notifications/unread-count', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch {}
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/notifications', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleMarkRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        className="relative text-stone-600 hover:text-stone-900 transition-colors"
      >
        <Bell size={20} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-stone-200 z-50 flex flex-col max-h-[420px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
            <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-bold text-[#FF9F43] hover:text-[#ff8f23] transition-colors"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-[#FF9F43]" size={20} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-stone-400">
                <Bell size={32} strokeWidth={1.5} className="mb-2 text-stone-300" />
                <p className="text-sm font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`px-4 py-3 border-b border-stone-100 hover:bg-stone-50 transition-colors ${!n.isRead ? 'bg-orange-50/40' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#FF9F43] flex-shrink-0" />
                        )}
                        <p className={`text-sm ${!n.isRead ? 'font-bold text-stone-900' : 'font-semibold text-stone-700'}`}>
                          {n.title}
                        </p>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-stone-400 font-medium mt-1">{timeSince(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n._id)}
                        className="text-stone-300 hover:text-stone-600 transition-colors flex-shrink-0"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
