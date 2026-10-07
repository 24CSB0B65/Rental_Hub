import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      const dest = location.state?.from || (user.role === 'owner' ? '/owner/properties' : '/browse');
      navigate(dest, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420, padding: '64px 24px' }}>
      <h1>Welcome back</h1>
      <p style={{ color: 'var(--muted)' }}>Log in to browse properties, manage listings and more.</p>
      <form onSubmit={handleSubmit} className="card" style={{ padding: 28, marginTop: 20 }}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 16, marginBottom: 0 }}>
          No account? <Link to="/register">Sign up</Link>
        </p>
      </form>
      <div className="card" style={{ padding: 16, marginTop: 16, fontSize: '0.82rem', color: 'var(--muted)' }}>
        Demo accounts — renter@demo.com / owner@demo.com, password: password123
      </div>
    </div>
  );
}
