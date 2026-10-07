import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/format';

export default function PropertyCard({ property }) {
  return (
    <Link to={`/properties/${property.id}`} className="card" style={{ display: 'block', overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        height: 180, background: `var(--pine-light) url(${property.image_url || ''}) center/cover no-repeat`,
      }} />
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{property.title}</h3>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '4px 0 10px' }}>{property.city}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ color: 'var(--pine-dark)', fontSize: '1.05rem' }}>{formatPrice(property.price)}<span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '0.8rem' }}>/mo</span></strong>
          <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{property.bedrooms} bed · {property.bathrooms} bath</span>
        </div>
      </div>
    </Link>
  );
}
