import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client, { apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import { formatPrice } from '../utils/format';

export default function PropertyDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [applyState, setApplyState] = useState({ busy: false, error: '', success: '' });

  useEffect(() => {
    client.get(`/properties/${id}`).then(({ data }) => setProperty(data.property))
      .catch(() => setProperty(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (user?.phone) setContactPhone((prev) => prev || user.phone);
  }, [user]);

  const handleApply = async () => {
    if (!user) return navigate('/login', { state: { from: `/properties/${id}` } });
    setApplyState({ busy: true, error: '', success: '' });
    try {
      await client.post('/applications', { propertyId: id, message, contactPhone });
      setApplyState({ busy: false, error: '', success: 'Application submitted! Track it under "Applications".' });
    } catch (err) {
      setApplyState({ busy: false, error: apiErrorMessage(err), success: '' });
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!property) return (
    <div className="container" style={{ padding: '64px 24px' }}>
      <div className="empty-state card"><h3>Property not found</h3><Link to="/browse">Back to browse</Link></div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '32px 24px 64px' }}>
      <Link to="/browse" style={{ fontSize: '0.9rem' }}>← Back to browse</Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 36, marginTop: 16 }}>
        <div>
          <div style={{
            height: 340, borderRadius: 'var(--radius)', background: `var(--pine-light) url(${property.image_url || ''}) center/cover no-repeat`,
            marginBottom: 20,
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ marginBottom: 4 }}>{property.title}</h1>
              <p style={{ color: 'var(--muted)' }}>{property.address}, {property.city}</p>
            </div>
            <span className={`badge badge-${property.status}`}>{property.status}</span>
          </div>

          <div style={{ display: 'flex', gap: 24, margin: '16px 0 24px', color: 'var(--muted)', fontSize: '0.92rem' }}>
            <span>{property.bedrooms} bedrooms</span>
            <span>{property.bathrooms} bathrooms</span>
            {property.area_sqft && <span>{property.area_sqft} sq ft</span>}
            <span style={{ textTransform: 'capitalize' }}>{property.property_type}</span>
          </div>

          <h3>About this property</h3>
          <p style={{ color: 'var(--ink)' }}>{property.description || 'No description provided.'}</p>

          <h3 style={{ marginTop: 28 }}>Location</h3>
          <MapView latitude={property.latitude} longitude={property.longitude} title={property.title} address={property.address} />
        </div>

        <div>
          <div className="card" style={{ padding: 24, position: 'sticky', top: 88 }}>
            <strong style={{ fontSize: '1.5rem', color: 'var(--pine-dark)' }}>{formatPrice(property.price)}<span style={{ fontWeight: 400, fontSize: '0.85rem', color: 'var(--muted)' }}>/month</span></strong>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '4px 0 18px' }}>Listed by {property.owner_name}</p>

            {user?.role === 'owner' ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Owners cannot apply to properties.</p>
            ) : property.status !== 'available' ? (
              <div className="alert alert-error">This property is no longer available.</div>
            ) : (
              <>
                {applyState.success && <div className="alert alert-success">{applyState.success}</div>}
                {applyState.error && <div className="alert alert-error">{applyState.error}</div>}
                {!applyState.success && (
                  <>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 14 }}>
                      Applying as <strong>{user ? user.name : 'guest'}</strong>. The owner will see your name, email and the phone number below once you apply — and if they approve you, you'll see their contact details too.
                    </p>
                    <div className="field">
                      <label htmlFor="contactPhone">Your contact phone</label>
                      <input id="contactPhone" type="tel" placeholder="e.g. +91 98765 43210" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                    </div>
                    <div className="field">
                      <label htmlFor="message">Message to owner (optional)</label>
                      <textarea id="message" rows={4} placeholder="Introduce yourself, ask a question, or request a visit…" value={message} onChange={(e) => setMessage(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleApply} disabled={applyState.busy}>
                      {applyState.busy ? 'Submitting…' : 'Apply to rent'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
