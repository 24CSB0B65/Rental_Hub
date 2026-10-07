import { useEffect, useState } from 'react';
import client from '../api/client';
import { timeAgo } from '../utils/format';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    client.get('/notifications').then(({ data }) => setNotifications(data.notifications)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await client.put(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
  };

  const markAllRead = async () => {
    await client.put('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="container" style={{ maxWidth: 720, padding: '40px 24px 64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1>Notifications</h1>
          <p style={{ color: 'var(--muted)' }}>Updates about your rentals, applications and requests.</p>
        </div>
        {hasUnread && <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all as read</button>}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state card" style={{ marginTop: 24 }}>
          <h3>You're all caught up</h3>
          <p>New activity on your account will show up here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10, marginTop: 24 }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              className="card"
              style={{
                padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                borderLeft: n.is_read ? '1px solid var(--line)' : '3px solid var(--clay)',
                background: n.is_read ? 'var(--paper)' : '#FFFDFB',
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: '0.92rem' }}>{n.message}</p>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{timeAgo(n.created_at)}</span>
              </div>
              {!n.is_read && <button className="btn btn-ghost btn-sm" onClick={() => markRead(n.id)}>Mark read</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
