import { useState } from 'react';
import { vendorsAPI } from '../api';
import toast from 'react-hot-toast';

export default function VendorRegisterPage() {
  const [form, setForm] = useState({
    business_name: '', description: '', contact_email: '', contact_phone: '', address: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await vendorsAPI.register(form);
      toast.success('Vendor registration submitted!');
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    }
  };

  if (submitted) {
    return (
      <div className="page"><div className="container">
        <div className="card" style={{ maxWidth: 500, margin: '2rem auto', textAlign: 'center' }}>
          <div className="card-body">
            <h2 style={{ color: 'var(--success)', marginBottom: '1rem' }}>Registration Submitted!</h2>
            <p>Your vendor application is pending admin approval. You'll be notified once approved.</p>
          </div>
        </div>
      </div></div>
    );
  }

  return (
    <div className="page"><div className="container">
      <h1 className="page-title">Vendor Registration</h1>
      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-body">
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Register as a vendor to sell products on our marketplace.
          </p>
          <form onSubmit={handleSubmit}>
            {['business_name', 'description', 'contact_email', 'contact_phone', 'address'].map((f) => (
              <div className="form-group" key={f}>
                <label>{f.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</label>
                {f === 'description' || f === 'address' ? (
                  <textarea className="form-control" rows={3} value={form[f]} required={f !== 'description'}
                    onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
                ) : (
                  <input className="form-control" type={f === 'contact_email' ? 'email' : 'text'}
                    value={form[f]} required onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
                )}
              </div>
            ))}
            <button type="submit" className="btn btn-primary">Submit Registration</button>
          </form>
        </div>
      </div>
    </div></div>
  );
}
