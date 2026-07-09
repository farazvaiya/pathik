import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../hooks/useSocket';
import { fetchNotifications, markNotificationsRead, timeAgo } from '../api';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { notifications: data, unreadCount: count } = await fetchNotifications({ limit: 20 });
      setNotifications(data);
      setUnreadCount(count);
    } catch (e) {
      // Silently ignore 401 (expired/invalid token) — user may have logged out
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    loadNotifications();

    const s = getSocket();
    const handleNotif = (notif) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);
    };
    s.on('notification:new', handleNotif);
    return () => s.off('notification:new', handleNotif);
  }, [user?.id, loadNotifications]);

  async function handleMarkRead() {
    setUnreadCount(0);
    await markNotificationsRead();
  }

  if (!user?.id) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); if (!open) handleMarkRead(); }}
        className="relative px-3 py-2 rounded-xl text-sm font-semibold hover:bg-slate-100 transition"
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 m-0">Notifications</h3>
              <button onClick={handleMarkRead} className="text-[11px] text-emerald-600 hover:underline">
                Mark all read
              </button>
            </div>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">No notifications yet</div>
            ) : (
              <div>
                {notifications.map((n, i) => (
                  <div key={n._id || i} className="px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition">
                    <div className="flex items-start gap-2">
                      <span className="text-lg mt-0.5">
                        {n.type === 'sos_alert' ? '🚨' : n.type === 'sighting_nearby' ? '👁️' : n.type === 'sighting_confirmed' ? '✅' : '🔔'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 m-0">{n.title}</p>
                        <p className="text-[11px] text-slate-500 m-0 mt-0.5 truncate">{n.body}</p>
                        <p className="text-[10px] text-slate-400 m-0 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
