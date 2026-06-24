import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (e, p) => { setEmail(e); setPassword(p); };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>🛒 Marketplace</h1>
        <p className="subtitle">Sign in to your account</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div style={{ marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Demo accounts:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => quickLogin('admin@marketplace.com', 'admin123')}>
              Admin — admin@marketplace.com
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => quickLogin('user@marketplace.com', 'user123')}>
              User — user@marketplace.com
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => quickLogin('vendor@marketplace.com', 'vendor123')}>
              Vendor — vendor@marketplace.com
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
