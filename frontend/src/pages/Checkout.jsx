import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addressAPI, ordersAPI, paymentsAPI } from '../api';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { items, total, refresh } = useCart();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [upiData, setUpiData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [newAddr, setNewAddr] = useState({
    label: 'Home', full_name: '', phone: '', address_line1: '',
    address_line2: '', city: '', state: '', pincode: '', is_default: true,
  });

  const tax = total * 0.18;
  const grandTotal = total + tax;

  useEffect(() => {
    addressAPI.list().then((r) => {
      setAddresses(r.data);
      const def = r.data.find((a) => a.is_default);
      if (def) setSelectedAddress(def.id);
      else if (r.data.length) setSelectedAddress(r.data[0].id);
    });
  }, []);

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    const res = await addressAPI.create(newAddr);
    setAddresses([...addresses, res.data]);
    setSelectedAddress(res.data.id);
    setShowNewAddress(false);
    toast.success('Address saved!');
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error('Select an address'); return; }
    setProcessing(true);
    try {
      const orderRes = await ordersAPI.create({
        address_id: selectedAddress,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        payment_method: paymentMethod,
      });
      const order = orderRes.data;

      if (paymentMethod === 'upi') {
        const upiRes = await paymentsAPI.upi({ order_id: order.id, amount: order.total });
        setUpiData({ ...upiRes.data, orderId: order.id });
      } else if (paymentMethod === 'razorpay') {
        const rzRes = await paymentsAPI.razorpay({ order_id: order.id, amount: order.total });
        await paymentsAPI.verifyRazorpay({ order_id: order.id, payment_id: 'mock_payment' });
        toast.success('Payment successful!');
        await refresh();
        navigate(`/orders/${order.id}`);
      } else if (paymentMethod === 'stripe') {
        const stRes = await paymentsAPI.stripe({ order_id: order.id, amount: order.total });
        window.open(stRes.data.url, '_blank');
        await paymentsAPI.verifyStripe({ order_id: order.id });
        toast.success('Payment initiated!');
        await refresh();
        navigate(`/orders/${order.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Order failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyUpi = async () => {
    try {
      await paymentsAPI.verifyUpi({ order_id: upiData.orderId });
      toast.success('UPI Payment verified!');
      await refresh();
      navigate(`/orders/${upiData.orderId}`);
    } catch {
      toast.error('Verification failed');
    }
  };

  if (items.length === 0 && !upiData) {
    return (
      <div className="page"><div className="container">
        <div className="empty-state"><p>Cart is empty</p></div>
      </div></div>
    );
  }

  if (upiData) {
    return (
      <div className="page"><div className="container">
        <h1 className="page-title">UPI Payment</h1>
        <div className="card" style={{ maxWidth: 400, margin: '0 auto' }}>
          <div className="card-body qr-container">
            <p style={{ marginBottom: '1rem' }}>Scan QR code to pay ₹{upiData.amount.toLocaleString()}</p>
            <img src={`data:image/png;base64,${upiData.qr_code_base64}`} alt="UPI QR Code" />
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              UPI ID: {upiData.upi_id}
            </p>
            <button className="btn btn-success" style={{ marginTop: '1rem', width: '100%' }} onClick={handleVerifyUpi}>
              I have paid
            </button>
          </div>
        </div>
      </div></div>
    );
  }

  return (
    <div className="page"><div className="container">
      <h1 className="page-title">Checkout</h1>
      <div className="grid grid-2">
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Delivery Address</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowNewAddress(!showNewAddress)}>
                  {showNewAddress ? 'Cancel' : '+ New Address'}
                </button>
              </div>
              {showNewAddress ? (
                <form onSubmit={handleCreateAddress}>
                  {['label', 'full_name', 'phone', 'address_line1', 'address_line2', 'city', 'state', 'pincode'].map((f) => (
                    <div className="form-group" key={f}>
                      <label>{f.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</label>
                      <input className="form-control" value={newAddr[f]} required={f !== 'address_line2' && f !== 'label'}
                        onChange={(e) => setNewAddr({ ...newAddr, [f]: e.target.value })} />
                    </div>
                  ))}
                  <button type="submit" className="btn btn-primary">Save Address</button>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {addresses.map((addr) => (
                    <label key={addr.id} className={`payment-option ${selectedAddress === addr.id ? 'selected' : ''}`}>
                      <input type="radio" name="address" checked={selectedAddress === addr.id}
                        onChange={() => setSelectedAddress(addr.id)} />
                      <div>
                        <strong>{addr.label} — {addr.full_name}</strong>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {addr.address_line1}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                      </div>
                    </label>
                  ))}
                  {addresses.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No addresses. Add one above.</p>}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 style={{ marginBottom: '1rem' }}>Payment Method</h3>
              <div className="payment-options">
                {[
                  { id: 'upi', label: 'UPI (QR Code)', desc: 'Scan & pay via any UPI app' },
                  { id: 'razorpay', label: 'Razorpay', desc: 'Cards, UPI, Net Banking' },
                  { id: 'stripe', label: 'Stripe', desc: 'International cards' },
                ].map((m) => (
                  <label key={m.id} className={`payment-option ${paymentMethod === m.id ? 'selected' : ''}`}>
                    <input type="radio" name="payment" checked={paymentMethod === m.id}
                      onChange={() => setPaymentMethod(m.id)} />
                    <div>
                      <strong>{m.label}</strong>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>Order Summary</h3>
            {items.map((i) => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span>{i.product?.name} x{i.quantity}</span>
                <span>₹{((i.product?.price || 0) * i.quantity).toLocaleString()}</span>
              </div>
            ))}
            <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid var(--border)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Subtotal</span><span>₹{total.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Tax (18%)</span><span>₹{tax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.125rem', marginBottom: '1.5rem' }}>
              <span>Total</span><span>₹{grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handlePlaceOrder} disabled={processing}>
              {processing ? 'Processing...' : 'Place Order & Pay'}
            </button>
          </div>
        </div>
      </div>
    </div></div>
  );
}
