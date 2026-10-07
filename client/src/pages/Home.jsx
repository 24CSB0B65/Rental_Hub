import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import client from '../api/client';
import PropertyCard from '../components/PropertyCard';

const STEPS = [
  { label: 'Discover', text: 'Search and filter rental properties, view details, images and location on a map.' },
  { label: 'Rent', text: 'Contact the owner, schedule a visit, submit an application and move to a lease.' },
  { label: 'Manage', text: 'Track tenants, rent payments and maintenance requests after the property is rented.' },
];

export default function Home() {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    client.get('/properties').then(({ data }) => setProperties(data.properties.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div>
      <section style={{ background: 'var(--pine-dark)', color: '#fff' }}>
        <div className="container" style={{ padding: '88px 24px 96px', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 48, alignItems: 'center' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: '2.9rem', maxWidth: 560 }}>Find a place to live, then everything after.</h1>
            <p style={{ color: '#CBD8D0', fontSize: '1.1rem', maxWidth: 480 }}>
              RentalHub brings scattered listings, applications, leases, rent and maintenance into one platform — for renters and owners alike.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              <Link to="/browse" className="btn btn-clay">Browse properties</Link>
              <Link to="/register" className="btn" style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}>List a property</Link>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {STEPS.map((s, i) => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#DDB79A' }}>{i + 1}</span>
                  <div>
                    <h4 style={{ color: '#fff', marginBottom: 4 }}>{s.label}</h4>
                    <p style={{ color: '#C4D2CB', fontSize: '0.9rem', margin: 0 }}>{s.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {properties.length > 0 && (
        <section className="container" style={{ padding: '56px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
            <h2>Recently listed</h2>
            <Link to="/browse">See all →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
