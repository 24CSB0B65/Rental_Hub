import { useEffect, useMemo, useState } from 'react';
import client, { apiErrorMessage } from '../api/client';
import { formatDate } from '../utils/format';
import FilterTabs from '../components/FilterTabs';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
];

export default function MyMaintenance() {
  const [requests, setRequests] = useState([]);
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ leaseId: '', title: '', description: '', priority: 'normal' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    const [r, l] = await Promise.all([client.get('/maintenance/mine'), client.get('/leases/mine')]);
    setRequests(r.data.requests);
    setLeases(l.data.leases.filter((x) => x.status === 'active'));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const c = { all: requests.length, open: 0, in_progress: 0, resolved: 0 };
    requests.forEach((r) => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [requests]);

  const visible = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await client.post('/maintenance', form);
      setForm({ leaseId: '', title: '', description: '', priority: 'normal' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ padding: '40px 24px 64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1>Maintenance requests</h1>
          <p style={{ color: 'var(--muted)' }}>Report an issue with your rented property.</p>
        </div>
        {leases.length > 0 && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ New request'}</button>
        )}
      </div>

      {leases.length === 0 && (
        <div className="alert" style={{ background: 'var(--pine-light)', color: 'var(--pine-dark)', marginTop: 20 }}>
          You need an active lease to submit a maintenance request.
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ padding: 22, marginTop: 20 }}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="field">
            <label htmlFor="leaseId">Property</label>
            <select id="leaseId" required value={form.leaseId} onChange={(e) => setForm({ ...form, leaseId: e.target.value })}>
              <option value="">Select a property…</option>
              {leases.map((l) => <option key={l.id} value={l.id}>{l.property_title}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="title">Issue title</label>
            <input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Kitchen faucet leaking" />
          </div>
          <div className="field">
            <label htmlFor="description">Details</label>
            <textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="priority">Priority</label>
            <select id="priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit request'}</button>
        </form>
      )}

      {requests.length > 0 && <FilterTabs tabs={TABS} active={filter} onChange={setFilter} counts={counts} />}

      {requests.length === 0 ? (
        <div className="empty-state card" style={{ marginTop: 24 }}>
          <h3>No requests yet</h3>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>{r.title}</h3>
                <span className={`badge badge-${r.status}`}>{r.status.replace('_', ' ')}</span>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>{r.property_title} · Priority: {r.priority} · Reported {formatDate(r.created_at)}</p>
              {r.description && <p style={{ margin: '8px 0 0', fontSize: '0.9rem' }}>{r.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
