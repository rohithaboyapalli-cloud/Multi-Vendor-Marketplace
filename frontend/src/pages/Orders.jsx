import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../api';
import { Package } from 'lucide-react';

const statusColors = {
  pending: 'badge-warning', confirmed: 'badge-primary', processing: 'badge-primary',
  shipped: 'badge-primary', delivered: 'badge-success', cancelled: 'badge-danger',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersAPI.list().then((r) => setOrders(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="container">Loading...</div></div>;

  return (
    <div className="page"><div className="container">
      <h1 className="page-title">My Orders</h1>
      {orders.length === 0 ? (
        <div className="empty-state">
          <Package size={48} />
          <p>No orders yet</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order) => (
            <div key={order.id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <strong>Order #{order.id.slice(0, 8)}</strong>
                    <span className={`badge ${statusColors[order.status]}`} style={{ marginLeft: '0.5rem' }}>{order.status}</span>
                    <span className={`badge ${order.payment_status === 'completed' ? 'badge-success' : 'badge-warning'}`} style={{ marginLeft: '0.25rem' }}>
                      {order.payment_status}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700 }}>₹{order.total.toLocaleString()}</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {new Date(order.created_at).toLocaleString()} · {order.payment_method.toUpperCase()}
                </p>
                {order.items.map((item, i) => (
                  <p key={i} style={{ fontSize: '0.875rem' }}>
                    {item.product_name} x{item.quantity} — ₹{item.total_price.toLocaleString()}
                  </p>
                ))}
                <Link to={`/orders/${order.id}`} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
                  Track Order
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div></div>
  );
}
