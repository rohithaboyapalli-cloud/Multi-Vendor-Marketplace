import { useState, useEffect } from 'react';
import { authAPI, vendorsAPI } from '../api';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'user' });

  const refresh = () => authAPI.listUsers().then((r) => setUsers(r.data));

  useEffect(() => { refresh(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await authAPI.createUser(form);
      toast.success('User created!');
      setShowForm(false);
      setForm({ email: '', password: '', full_name: '', role: 'user' });
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  const handleToggle = async (id) => {
    await authAPI.toggleUser(id);
    toast.success('User status toggled');
    refresh();
  };

  return (
    <div className="page"><div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>User Management</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Create User'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-body">
            <form onSubmit={handleCreate}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>Full Name</label>
                  <input className="form-control" value={form.full_name} required
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input className="form-control" type="email" value={form.email} required
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input className="form-control" type="password" value={form.password} required minLength={6}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select className="form-control" value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="vendor">Vendor</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Create User</button>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td><span className="badge badge-primary">{u.role}</span></td>
                <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleToggle(u.id)}>
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div></div>
  );
}
