import { useEffect, useState, useCallback } from 'react';
import client from '../api/client';
import PropertyCard from '../components/PropertyCard';

const TYPES = ['', 'apartment', 'house', 'studio', 'pg'];

export default function Browse() {
  const [filters, setFilters] = useState({ q: '', city: '', minPrice: '', maxPrice: '', bedrooms: '', propertyType: '' });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const search = useCallback(async (f) => {
    setLoading(true);
    const params = {};
    Object.entries(f).forEach(([k, v]) => { if (v) params[k] = v; });
    try {
      const { data } = await client.get('/properties', { params });
      setProperties(data.properties);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { search(filters); }, []); // eslint-disable-line

  const handleSubmit = (e) => {
    e.preventDefault();
    search(filters);
  };

  return (
    <div className="container" style={{ padding: '40px 24px 64px' }}>
      <h1>Browse properties</h1>
      <p style={{ color: 'var(--muted)' }}>Search by city, price and bedrooms to find your next place.</p>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 20, margin: '20px 0 32px' }}>
        <div className="field-row">
          <div className="field">
            <label htmlFor="q">Keyword</label>
            <input id="q" placeholder="Title, description, address…" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="city">City</label>
            <input id="city" placeholder="e.g. Hyderabad" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="minPrice">Min rent</label>
            <input id="minPrice" type="number" min="0" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="maxPrice">Max rent</label>
            <input id="maxPrice" type="number" min="0" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="bedrooms">Min bedrooms</label>
            <input id="bedrooms" type="number" min="0" value={filters.bedrooms} onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="propertyType">Type</label>
            <select id="propertyType" value={filters.propertyType} onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}>
              {TYPES.map((t) => <option key={t} value={t}>{t ? t[0].toUpperCase() + t.slice(1) : 'Any'}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-primary">Search</button>
      </form>

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : properties.length === 0 ? (
        <div className="empty-state card">
          <h3>No properties match your search</h3>
          <p>Try widening your filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}
    </div>
  );
}
