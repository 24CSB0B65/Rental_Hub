import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { formatPrice, formatDate } from '../utils/format';
import FilterTabs from '../components/FilterTabs';
import ContactCard from '../components/ContactCard';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    client.get('/applications/mine').then(({ data }) => setApplications(data.applications)).finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c = { all: applications.length, pending: 0, approved: 0, rejected: 0 };
    applications.forEach((a) => { c[a.status] = (c[a.status] || 0) + 1; });
    return c;
  }, [applications]);

  const visible = filter === 'all' ? applications : applications.filter((a) => a.status === filter);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ padding: '40px 24px 64px' }}>
      <h1>My applications</h1>
      <p style={{ color: 'var(--muted)' }}>Track the status of properties you've applied to rent.</p>

      {applications.length > 0 && <FilterTabs tabs={TABS} active={filter} onChange={setFilter} counts={counts} />}

      {applications.length === 0 ? (
        <div className="empty-state card" style={{ marginTop: 24 }}>
          <h3>No applications yet</h3>
          <p>Browse properties and apply to the ones you like.</p>
          <Link to="/browse" className="btn btn-primary">Browse properties</Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state card" style={{ marginTop: 10 }}>
          <h3>Nothing here</h3>
          <p>No applications with this status.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14, marginTop: 10 }}>
          {visible.map((a) => (
            <div key={a.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 90, height: 72, borderRadius: 8, background: `var(--pine-light) url(${a.image_url || ''}) center/cover no-repeat`, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>{a.property_title}</h3>
                    <span className={`badge badge-${a.status}`}>{a.status}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>{a.city} · {formatPrice(a.price)}/mo · Applied {formatDate(a.created_at)}</p>
                  <Link to={`/properties/${a.property_id}`} style={{ fontSize: '0.85rem' }}>View property →</Link>
                </div>
              </div>

              {a.status === 'approved' && (
                <div style={{ marginTop: 14 }}>
                  <ContactCard label="Owner contact — you're approved!" name={a.owner_name} email={a.owner_email} phone={a.owner_phone} />
                </div>
              )}
              {a.status === 'rejected' && (
                <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>This application wasn't successful — keep browsing for other places.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
