import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { addressAPI } from '../api';
import toast from 'react-hot-toast';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    label: 'Home', full_name: '', phone: '', address_line1: '',
    address_line2: '', city: '', state: '', pincode: '', is_default: false,
  });

  const refresh = () => addressAPI.list().then((r) => setAddresses(r.data));

  useEffect(() => { refresh(); }, []);

  const resetForm = () => {
    setForm({ label: 'Home', full_name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '', is_default: false });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await addressAPI.update(editId, form);
      toast.success('Address updated!');
    } else {
      await addressAPI.create(form);
      toast.success('Address added!');
    }
    resetForm();
    refresh();
  };

  const handleEdit = (addr) => {
    setForm({ ...addr });
    setEditId(addr.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await addressAPI.delete(id);
    toast.success('Address deleted');
    refresh();
  };

  const handleSetDefault = async (id) => {
    await addressAPI.setDefault(id);
    toast.success('Default address updated');
    refresh();
  };

  return (
    <div className="page"><div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>My Addresses</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ Add Address</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>{editId ? 'Edit' : 'New'} Address</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-2">
                {['label', 'full_name', 'phone', 'address_line1', 'address_line2', 'city', 'state', 'pincode'].map((f) => (
                  <div className="form-group" key={f}>
                    <label>{f.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</label>
                    <input className="form-control" value={form[f]} required={!['address_line2', 'label'].includes(f)}
                      onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
                  </div>
                ))}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
                Set as default
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-2">
        {addresses.map((addr) => (
          <div key={addr.id} className="card">
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <strong>{addr.label}</strong>
                  {addr.is_default && <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>Default</span>}
                  <p style={{ marginTop: '0.5rem' }}>{addr.full_name} · {addr.phone}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {addr.address_line1}{addr.address_line2 && `, ${addr.address_line2}`}<br />
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(addr)}>Edit</button>
                {!addr.is_default && (
                  <button className="btn btn-secondary btn-sm" onClick={() => handleSetDefault(addr.id)}>Set Default</button>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(addr.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {addresses.length === 0 && !showForm && (
        <div className="empty-state"><p>No addresses saved yet</p></div>
      )}
    </div></div>
  );
}
