import { useEffect, useMemo, useState } from 'react';
import client, { apiErrorMessage } from '../api/client';
import { formatDate } from '../utils/format';
import FilterTabs from '../components/FilterTabs';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function OwnerApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = () => {
    setLoading(true);
    client.get('/applications/owner').then(({ data }) => setApplications(data.applications)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const c = { all: applications.length, pending: 0, approved: 0, rejected: 0 };
    applications.forEach((a) => { c[a.status] = (c[a.status] || 0) + 1; });
    return c;
  }, [applications]);

  const visible = filter === 'all' ? applications : applications.filter((a) => a.status === filter);

  const decide = async (id, status) => {
    setError('');
    setBusyId(id);
    try {
      await client.put(`/applications/${id}`, { status });
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ padding: '40px 24px 64px' }}>
      <h1>Applications</h1>
      <p style={{ color: 'var(--muted)' }}>Review applications submitted for your listings.</p>
      {error && <div className="alert alert-error">{error}</div>}

      <FilterTabs tabs={TABS} active={filter} onChange={setFilter} counts={counts} />

      {applications.length === 0 ? (
        <div className="empty-state card" style={{ marginTop: 10 }}>
          <h3>No applications yet</h3>
          <p>You'll see renter applications here once they come in.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state card" style={{ marginTop: 10 }}>
          <h3>Nothing here</h3>
          <p>No applications with this status.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14, marginTop: 10 }}>
          {visible.map((a) => {
            const phone = a.contact_phone || a.renter_profile_phone;
            return (
              <div key={a.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h3 style={{ margin: 0, fontSize: '1rem' }}>{a.property_title}</h3>
                      <span className={`badge badge-${a.status}`}>{a.status}</span>
                    </div>
                    <p style={{ margin: '4px 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
                      Applicant: <strong>{a.renter_name}</strong> · Applied {formatDate(a.created_at)}
                    </p>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
                      <a href={`mailto:${a.renter_email}`} style={{ fontSize: '0.85rem' }}>✉ {a.renter_email}</a>
                      {phone ? <a href={`tel:${phone}`} style={{ fontSize: '0.85rem' }}>☎ {phone}</a> : <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>No phone provided</span>}
                    </div>
                    {a.message && <p style={{ margin: '10px 0 0', fontSize: '0.9rem' }}>"{a.message}"</p>}
                  </div>
                  {a.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button className="btn btn-primary btn-sm" disabled={busyId === a.id} onClick={() => decide(a.id, 'approved')}>Approve</button>
                      <button className="btn btn-danger btn-sm" disabled={busyId === a.id} onClick={() => decide(a.id, 'rejected')}>Reject</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
