import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await client.get('/notifications');
      setUnread(data.notifications.filter((n) => !n.is_read).length);
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header style={{ background: 'var(--paper)', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'baseline', gap: 4, textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.4rem', color: 'var(--pine-dark)' }}>RentalHub</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <NavLink to="/browse" style={navStyle}>Browse</NavLink>
          {user?.role === 'renter' && (
            <>
              <NavLink to="/applications" style={navStyle}>Applications</NavLink>
              <NavLink to="/leases" style={navStyle}>My Rentals</NavLink>
            </>
          )}
          {user?.role === 'owner' && (
            <>
              <NavLink to="/owner/properties" style={navStyle}>My Listings</NavLink>
              <NavLink to="/owner/applications" style={navStyle}>Applications</NavLink>
              <NavLink to="/leases" style={navStyle}>Leases</NavLink>
              <NavLink to="/owner/maintenance" style={navStyle}>Maintenance</NavLink>
            </>
          )}
          {user && (
            <NavLink to="/notifications" style={navStyle}>
              Notifications{unread > 0 && <span style={dotStyle}>{unread}</span>}
            </NavLink>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>{user.name}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Log out</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

const navStyle = ({ isActive }) => ({
  fontSize: '0.92rem',
  fontWeight: 600,
  color: isActive ? 'var(--pine-dark)' : 'var(--muted)',
  textDecoration: 'none',
  position: 'relative',
});

const dotStyle = {
  marginLeft: 6,
  background: 'var(--clay)',
  color: '#fff',
  borderRadius: 999,
  fontSize: '0.68rem',
  padding: '1px 6px',
  fontWeight: 700,
};
