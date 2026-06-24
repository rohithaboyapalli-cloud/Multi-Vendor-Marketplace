import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ordersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', tracking_number: '' });

  const refresh = () => {
    ordersAPI.get(id).then((r) => {
      setOrder(r.data);
      setStatusUpdate({ status: r.data.status, tracking_number: r.data.tracking_number || '' });
    });
    ordersAPI.track(id).then((r) => setTracking(r.data));
  };

  useEffect(() => { refresh(); }, [id]);

  const handleStatusUpdate = async () => {
    await ordersAPI.updateStatus(id, statusUpdate);
    toast.success('Status updated!');
    refresh();
  };

  if (!order) return <div className="page"><div className="container">Loading...</div></div>;

  return (
    <div className="page"><div className="container">
      <h1 className="page-title">Order #{order.id.slice(0, 8)}</h1>
      <div className="grid grid-2">
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body">
              <h3 style={{ marginBottom: '1rem' }}>Order Details</h3>
              <p><strong>Status:</strong> <span className="badge badge-primary">{order.status}</span></p>
              <p><strong>Payment:</strong> {order.payment_method} — {order.payment_status}</p>
              <p><strong>Total:</strong> ₹{order.total.toLocaleString()}</p>
              {order.tracking_number && <p><strong>Tracking:</strong> {order.tracking_number}</p>}
              <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid var(--border)' }} />
              <h4 style={{ marginBottom: '0.5rem' }}>Items</h4>
              {order.items.map((item, i) => (
                <p key={i}>{item.product_name} x{item.quantity} — ₹{item.total_price.toLocaleString()}</p>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h3 style={{ marginBottom: '1rem' }}>Delivery Address</h3>
              <p>{order.address.full_name} · {order.address.phone}</p>
              <p style={{ color: 'var(--text-muted)' }}>
                {order.address.address_line1}, {order.address.city}, {order.address.state} - {order.address.pincode}
              </p>
            </div>
          </div>
        </div>
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body">
              <h3 style={{ marginBottom: '1rem' }}>Order Tracking</h3>
              {tracking && (
                <div className="timeline">
                  {tracking.timeline.map((step) => (
                    <div key={step.status} className={`timeline-item ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}>
                      <strong style={{ textTransform: 'capitalize' }}>{step.status}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {isAdmin && (
            <div className="card">
              <div className="card-body">
                <h3 style={{ marginBottom: '1rem' }}>Update Status (Admin)</h3>
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-control" value={statusUpdate.status}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}>
                    {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tracking Number</label>
                  <input className="form-control" value={statusUpdate.tracking_number}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, tracking_number: e.target.value })} />
                </div>
                <button className="btn btn-primary" onClick={handleStatusUpdate}>Update</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div></div>
  );
}
