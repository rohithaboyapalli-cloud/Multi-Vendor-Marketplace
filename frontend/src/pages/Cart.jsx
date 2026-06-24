import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { items, updateItem, removeItem, total, loading } = useCart();

  const handleUpdate = async (id, qty) => {
    if (qty < 1) return;
    try {
      await updateItem(id, qty);
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleRemove = async (id) => {
    try {
      await removeItem(id);
      toast.success('Removed');
    } catch {
      toast.error('Failed to remove');
    }
  };

  if (loading) return <div className="page"><div className="container">Loading...</div></div>;

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">Shopping Cart</h1>
        {items.length === 0 ? (
          <div className="empty-state">
            <ShoppingCart size={48} />
            <p>Your cart is empty</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse Products</Link>
          </div>
        ) : (
          <div className="grid grid-2">
            <div>
              {items.map((item) => (
                <div key={item.id} className="card" style={{ marginBottom: '1rem' }}>
                  <div className="card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <img src={item.product?.image_url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '0.9375rem' }}>{item.product?.name}</h3>
                      <p className="price">₹{item.product?.price?.toLocaleString()}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleUpdate(item.id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleUpdate(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <p style={{ fontWeight: 600, minWidth: 80, textAlign: 'right' }}>
                      ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
                    </p>
                    <button className="btn btn-danger btn-sm" onClick={() => handleRemove(item.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="card" style={{ height: 'fit-content' }}>
              <div className="card-body">
                <h3 style={{ marginBottom: '1rem' }}>Order Summary</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Subtotal</span><span>₹{total.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Tax (18% GST)</span><span>₹{(total * 0.18).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid var(--border)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.125rem', marginBottom: '1.5rem' }}>
                  <span>Total</span><span>₹{(total * 1.18).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <Link to="/checkout" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
