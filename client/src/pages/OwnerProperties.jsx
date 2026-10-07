import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { formatPrice } from '../utils/format';
import FilterTabs from '../components/FilterTabs';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'rented', label: 'Rented' },
  { value: 'unlisted', label: 'Unlisted' },
];

export default function OwnerProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = () => {
    setLoading(true);
    client.get('/properties/owner/mine').then(({ data }) => setProperties(data.properties)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const c = { all: properties.length, available: 0, rented: 0, unlisted: 0 };
    properties.forEach((p) => { c[p.status] = (c[p.status] || 0) + 1; });
    return c;
  }, [properties]);

  const visible = filter === 'all' ? properties : properties.filter((p) => p.status === filter);

  const handleDelete = async (id) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    await client.delete(`/properties/${id}`);
    load();
  };

  const toggleUnlist = async (p) => {
    const status = p.status === 'unlisted' ? 'available' : 'unlisted';
    await client.put(`/properties/${p.id}`, { status });
    load();
  };

  return (
    <div className="container" style={{ padding: '40px 24px 64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1>My listings</h1>
          <p style={{ color: 'var(--muted)' }}>Create, edit and manage your rental properties.</p>
        </div>
        <Link to="/owner/properties/new" className="btn btn-primary">+ New listing</Link>
      </div>

      {properties.length > 0 && <FilterTabs tabs={TABS} active={filter} onChange={setFilter} counts={counts} />}

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : properties.length === 0 ? (
        <div className="empty-state card" style={{ marginTop: 24 }}>
          <h3>No listings yet</h3>
          <p>Create your first property listing to start receiving applications.</p>
          <Link to="/owner/properties/new" className="btn btn-primary">+ New listing</Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state card" style={{ marginTop: 10 }}>
          <h3>Nothing here</h3>
          <p>No listings with this status.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14, marginTop: 10 }}>
          {visible.map((p) => (
            <div key={p.id} className="card" style={{ padding: 18, display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 90, height: 72, borderRadius: 8, background: `var(--pine-light) url(${p.image_url || ''}) center/cover no-repeat`, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{p.title}</h3>
                  <span className={`badge badge-${p.status}`}>{p.status}</span>
                </div>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>{p.city} · {formatPrice(p.price)}/mo · {p.bedrooms} bed</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/properties/${p.id}`} className="btn btn-ghost btn-sm">View</Link>
                <Link to={`/owner/properties/${p.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                {p.status !== 'rented' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleUnlist(p)}>
                    {p.status === 'unlisted' ? 'Relist' : 'Unlist'}
                  </button>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
