import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'renter' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await register(form);
      navigate(user.role === 'owner' ? '/owner/properties' : '/browse', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 440, padding: '64px 24px' }}>
      <h1>Create your account</h1>
      <p style={{ color: 'var(--muted)' }}>Join as a renter looking for a place, or an owner managing properties.</p>
      <form onSubmit={handleSubmit} className="card" style={{ padding: 28, marginTop: 20 }}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="field">
          <label>I am a…</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {['renter', 'owner'].map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setForm({ ...form, role: r })}
                className={form.role === r ? 'btn btn-primary' : 'btn btn-ghost'}
                style={{ flex: 1, textTransform: 'capitalize' }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone (so the other side can reach you)</label>
          <input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +91 98765 43210" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 16, marginBottom: 0 }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
