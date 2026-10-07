import { useEffect, useMemo, useState } from 'react';
import client, { apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatPrice, formatDate } from '../utils/format';
import FilterTabs from '../components/FilterTabs';
import ContactCard from '../components/ContactCard';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'ended', label: 'Ended' },
  { value: 'terminated', label: 'Terminated' },
];

export default function Leases() {
  const { user } = useAuth();
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [payments, setPayments] = useState({});
  const [error, setError] = useState('');
  const [dueForm, setDueForm] = useState({ dueDate: '', amount: '' });
  const [filter, setFilter] = useState('all');
  const [endingId, setEndingId] = useState(null);

  const load = () => {
    setLoading(true);
    client.get('/leases/mine').then(({ data }) => setLeases(data.leases)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const c = { all: leases.length, active: 0, ended: 0, terminated: 0 };
    leases.forEach((l) => { c[l.status] = (c[l.status] || 0) + 1; });
    return c;
  }, [leases]);

  const visible = filter === 'all' ? leases : leases.filter((l) => l.status === filter);

  const toggle = async (leaseId) => {
    if (expanded === leaseId) { setExpanded(null); return; }
    setExpanded(leaseId);
    if (!payments[leaseId]) {
      const { data } = await client.get(`/leases/${leaseId}`);
      setPayments((p) => ({ ...p, [leaseId]: data.payments }));
    }
  };

  const refreshPayments = async (leaseId) => {
    const { data } = await client.get(`/leases/${leaseId}`);
    setPayments((p) => ({ ...p, [leaseId]: data.payments }));
  };

  const addDue = async (leaseId, rentAmount) => {
    setError('');
    try {
      await client.post(`/leases/${leaseId}/rent`, { dueDate: dueForm.dueDate, amount: dueForm.amount ? Number(dueForm.amount) : rentAmount });
      setDueForm({ dueDate: '', amount: '' });
      refreshPayments(leaseId);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const markPaid = async (leaseId, paymentId) => {
    setError('');
    try {
      await client.put(`/leases/rent/${paymentId}/pay`);
      refreshPayments(leaseId);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const endLease = async (lease) => {
    const verb = user?.role === 'owner' ? 'end this lease' : 'move out and end this lease';
    if (!confirm(`Are you sure you want to ${verb} for "${lease.property_title}"? The property will become available again and this can't be undone.`)) return;
    setError('');
    setEndingId(lease.id);
    try {
      await client.put(`/leases/${lease.id}/end`);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setEndingId(null);
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ padding: '40px 24px 64px' }}>
      <h1>{user?.role === 'owner' ? 'Leases' : 'My rentals'}</h1>
      <p style={{ color: 'var(--muted)' }}>
        {user?.role === 'owner' ? 'Manage active leases, contact tenants and track rent.' : 'Your active and past leases, owner contact and rent history.'}
      </p>
      {error && <div className="alert alert-error">{error}</div>}

      {leases.length > 0 && <FilterTabs tabs={TABS} active={filter} onChange={setFilter} counts={counts} />}

      {leases.length === 0 ? (
        <div className="empty-state card" style={{ marginTop: 24 }}>
          <h3>No leases yet</h3>
          <p>{user?.role === 'owner' ? 'Leases are created automatically when you approve an application.' : 'A lease is created once an owner approves your application.'}</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state card" style={{ marginTop: 10 }}>
          <h3>Nothing here</h3>
          <p>No leases with this status.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14, marginTop: 10 }}>
          {visible.map((l) => (
            <div key={l.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => toggle(l.id)}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>{l.property_title}</h3>
                    <span className={`badge badge-${l.status}`}>{l.status}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
                    {user?.role === 'owner' ? `Tenant: ${l.renter_name}` : `Owner: ${l.owner_name}`} · {formatPrice(l.rent_amount)}/mo · Since {formatDate(l.start_date)}
                  </p>
                </div>
                <button className="btn btn-ghost btn-sm">{expanded === l.id ? 'Hide details' : 'View details'}</button>
              </div>

              {expanded === l.id && (
                <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                  <div style={{ marginBottom: 18 }}>
                    <ContactCard
                      label={user?.role === 'owner' ? 'Tenant contact' : 'Owner contact'}
                      name={user?.role === 'owner' ? l.renter_name : l.owner_name}
                      email={user?.role === 'owner' ? l.renter_email : l.owner_email}
                      phone={user?.role === 'owner' ? l.renter_phone : l.owner_phone}
                    />
                  </div>

                  {user?.role === 'owner' && l.status === 'active' && (
                    <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <label htmlFor={`due-${l.id}`}>Due date</label>
                        <input id={`due-${l.id}`} type="date" value={dueForm.dueDate} onChange={(e) => setDueForm({ ...dueForm, dueDate: e.target.value })} />
                      </div>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <label htmlFor={`amt-${l.id}`}>Amount</label>
                        <input id={`amt-${l.id}`} type="number" placeholder={l.rent_amount} value={dueForm.amount} onChange={(e) => setDueForm({ ...dueForm, amount: e.target.value })} />
                      </div>
                      <button className="btn btn-primary btn-sm" disabled={!dueForm.dueDate} onClick={() => addDue(l.id, l.rent_amount)}>Add rent due</button>
                    </div>
                  )}

                  {!payments[l.id] || payments[l.id].length === 0 ? (
                    <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No rent entries yet.</p>
                  ) : (
                    <table>
                      <thead><tr><th>Due date</th><th>Amount</th><th>Status</th><th>Paid on</th><th></th></tr></thead>
                      <tbody>
                        {payments[l.id].map((p) => (
                          <tr key={p.id}>
                            <td>{formatDate(p.due_date)}</td>
                            <td>{formatPrice(p.amount)}</td>
                            <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                            <td>{formatDate(p.paid_date)}</td>
                            <td>
                              {p.status !== 'paid' && (
                                <button className="btn btn-ghost btn-sm" onClick={() => markPaid(l.id, p.id)}>Mark paid</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {l.status === 'active' && (
                    <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                      <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 10 }}>
                        {user?.role === 'owner'
                          ? 'Ending the lease marks it complete and relists the property as available.'
                          : "Moving out? Ending the lease notifies the owner and relists the property."}
                      </p>
                      <button className="btn btn-danger btn-sm" disabled={endingId === l.id} onClick={() => endLease(l)}>
                        {endingId === l.id ? 'Ending…' : user?.role === 'owner' ? 'End lease' : 'End lease / Moving out'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
