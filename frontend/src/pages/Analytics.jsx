import { useState, useEffect } from 'react';
import { analyticsAPI } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.get().then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="container">Loading...</div></div>;
  if (!data) return null;

  const statusData = Object.entries(data.orders_by_status).map(([name, value]) => ({ name, value }));

  return (
    <div className="page"><div className="container">
      <h1 className="page-title">Reports & Analytics</h1>

      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Total Users', value: data.total_users },
          { label: 'Total Vendors', value: data.total_vendors },
          { label: 'Total Products', value: data.total_products },
          { label: 'Total Orders', value: data.total_orders },
        ].map((s) => (
          <div key={s.label} className="card stat-card">
            <div className="value">{s.value}</div>
            <div className="label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card stat-card" style={{ marginBottom: '2rem' }}>
        <div className="value">₹{data.total_revenue.toLocaleString()}</div>
        <div className="label">Total Revenue</div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>Revenue by Month</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenue_by_month}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>Orders by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <h3 style={{ marginBottom: '1rem' }}>Top Products</h3>
          <table className="table">
            <thead><tr><th>Product</th><th>Quantity Sold</th><th>Revenue</th></tr></thead>
            <tbody>
              {data.top_products.map((p) => (
                <tr key={p.product_id}>
                  <td>{p.name}</td>
                  <td>{p.quantity}</td>
                  <td>₹{p.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h3 style={{ marginBottom: '1rem' }}>Recent Orders</h3>
          <table className="table">
            <thead><tr><th>Order</th><th>Total</th><th>Status</th><th>Payment</th><th>Date</th></tr></thead>
            <tbody>
              {data.recent_orders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id.slice(0, 8)}</td>
                  <td>₹{o.total.toLocaleString()}</td>
                  <td><span className="badge badge-primary">{o.status}</span></td>
                  <td>{o.payment_status}</td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div></div>
  );
}
