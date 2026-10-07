import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import client, { apiErrorMessage } from '../api/client';
import LocationPicker from '../components/LocationPicker';

const EMPTY = {
  title: '', description: '', propertyType: 'apartment', address: '', city: '',
  price: '', bedrooms: 1, bathrooms: 1, areaSqft: '', latitude: null, longitude: null, imageUrl: '',
};

export default function PropertyForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    client.get(`/properties/${id}`).then(({ data }) => {
      const p = data.property;
      setForm({
        title: p.title, description: p.description || '', propertyType: p.property_type,
        address: p.address, city: p.city, price: p.price, bedrooms: p.bedrooms, bathrooms: p.bathrooms,
        areaSqft: p.area_sqft || '', latitude: p.latitude, longitude: p.longitude, imageUrl: p.image_url || '',
      });
    }).finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const payload = { ...form, price: Number(form.price), bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms), areaSqft: form.areaSqft ? Number(form.areaSqft) : null };
      if (isEdit) {
        await client.put(`/properties/${id}`, payload);
      } else {
        await client.post('/properties', payload);
      }
      navigate('/owner/properties');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ maxWidth: 720, padding: '40px 24px 64px' }}>
      <h1>{isEdit ? 'Edit listing' : 'New listing'}</h1>
      <form onSubmit={handleSubmit} className="card" style={{ padding: 28, marginTop: 16 }}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" required value={form.title} onChange={set('title')} placeholder="e.g. Sunny 2BHK near Tech Park" />
        </div>
        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" rows={4} value={form.description} onChange={set('description')} placeholder="Describe the property, amenities and neighborhood…" />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="propertyType">Type</label>
            <select id="propertyType" value={form.propertyType} onChange={set('propertyType')}>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="studio">Studio</option>
              <option value="pg">PG / Shared</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="price">Monthly rent (₹)</label>
            <input id="price" type="number" min="0" required value={form.price} onChange={set('price')} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="address">Address</label>
            <input id="address" required value={form.address} onChange={set('address')} />
          </div>
          <div className="field">
            <label htmlFor="city">City</label>
            <input id="city" required value={form.city} onChange={set('city')} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="bedrooms">Bedrooms</label>
            <input id="bedrooms" type="number" min="0" value={form.bedrooms} onChange={set('bedrooms')} />
          </div>
          <div className="field">
            <label htmlFor="bathrooms">Bathrooms</label>
            <input id="bathrooms" type="number" min="0" value={form.bathrooms} onChange={set('bathrooms')} />
          </div>
          <div className="field">
            <label htmlFor="areaSqft">Area (sq ft)</label>
            <input id="areaSqft" type="number" min="0" value={form.areaSqft} onChange={set('areaSqft')} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="imageUrl">Image URL</label>
          <input id="imageUrl" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://…" />
        </div>

        <div className="field">
          <label>Map location</label>
          <LocationPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create listing'}</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/owner/properties')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
