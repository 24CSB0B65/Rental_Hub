import { useEffect, useMemo, useState } from 'react';
import client, { apiErrorMessage } from '../api/client';
import { formatDate } from '../utils/format';
import FilterTabs from '../components/FilterTabs';

const NEXT_STATUS = { open: 'in_progress', in_progress: 'resolved' };
const NEXT_LABEL = { open: 'Start progress', in_progress: 'Mark resolved' };

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
];

export default function OwnerMaintenance() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = () => {
    setLoading(true);
    client.get('/maintenance/mine').then(({ data }) => setRequests(data.requests)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const c = { all: requests.length, open: 0, in_progress: 0, resolved: 0 };
    requests.forEach((r) => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [requests]);

  const visible = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  const advance = async (r) => {
    const status = NEXT_STATUS[r.status];
    if (!status) return;
    setError('');
    setBusyId(r.id);
    try {
      await client.put(`/maintenance/${r.id}`, { status });
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
      <h1>Maintenance requests</h1>
      <p style={{ color: 'var(--muted)' }}>Requests reported by tenants across your properties.</p>
      {error && <div className="alert alert-error">{error}</div>}

      {requests.length > 0 && <FilterTabs tabs={TABS} active={filter} onChange={setFilter} counts={counts} />}

      {requests.length === 0 ? (
        <div className="empty-state card" style={{ marginTop: 24 }}>
          <h3>No requests</h3>
          <p>Maintenance requests from your tenants will appear here.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state card" style={{ marginTop: 10 }}>
          <h3>Nothing here</h3>
          <p>No requests with this status.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14, marginTop: 10 }}>
          {visible.map((r) => (
            <div key={r.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>{r.title}</h3>
                    <span className={`badge badge-${r.status}`}>{r.status.replace('_', ' ')}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'capitalize' }}>{r.priority} priority</span>
                  </div>
                  <p style={{ margin: '4px 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
                    {r.property_title} · Reported by {r.renter_name} · {formatDate(r.created_at)}
                  </p>
                  {r.description && <p style={{ margin: '8px 0 0', fontSize: '0.9rem' }}>{r.description}</p>}
                </div>
                {NEXT_STATUS[r.status] && (
                  <button className="btn btn-primary btn-sm" disabled={busyId === r.id} onClick={() => advance(r)}>
                    {NEXT_LABEL[r.status]}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
