import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wishlistAPI } from '../api';
import { useCart } from '../context/CartContext';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  const refresh = () => {
    wishlistAPI.get().then((r) => setItems(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleRemove = async (productId) => {
    await wishlistAPI.remove(productId);
    toast.success('Removed from wishlist');
    refresh();
  };

  const handleAddToCart = async (productId) => {
    await addItem(productId);
    toast.success('Added to cart!');
  };

  if (loading) return <div className="page"><div className="container">Loading...</div></div>;

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">My Wishlist</h1>
        {items.length === 0 ? (
          <div className="empty-state">
            <Heart size={48} />
            <p>Your wishlist is empty</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse Products</Link>
          </div>
        ) : (
          <div className="grid grid-4">
            {items.map((item) => (
              <div key={item.id} className="card product-card">
                <Link to={`/products/${item.product_id}`}>
                  <img src={item.product?.image_url} alt={item.product?.name} />
                </Link>
                <div className="card-body">
                  <h3 style={{ fontSize: '0.9375rem' }}>{item.product?.name}</h3>
                  <p className="price">₹{item.product?.price?.toLocaleString()}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handleAddToCart(item.product_id)}>
                      <ShoppingCart size={14} /> Cart
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleRemove(item.product_id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
