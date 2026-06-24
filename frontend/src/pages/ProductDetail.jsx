import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsAPI } from '../api';
import { useCart } from '../context/CartContext';
import { wishlistAPI } from '../api';
import { ShoppingCart, Heart, GitCompare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [compare, setCompare] = useState(null);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    productsAPI.get(id).then((r) => setProduct(r.data));
    productsAPI.compare(id).then((r) => setCompare(r.data));
  }, [id]);

  if (!product) return <div className="page"><div className="container">Loading...</div></div>;

  const handleAddToCart = async () => {
    try {
      await addItem(product.id, qty);
      toast.success('Added to cart!');
    } catch {
      toast.error('Failed to add');
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="grid grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <img src={product.image_url} alt={product.name} style={{ width: '100%', maxHeight: 400, objectFit: 'cover' }} />
          </div>
          <div>
            <span className="badge badge-primary">{product.category_name}</span>
            <h1 className="page-title" style={{ marginTop: '0.5rem' }}>{product.name}</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{product.description}</p>
            <p className="price" style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>₹{product.price.toLocaleString()}</p>
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
              Vendor: <strong>{product.vendor_name}</strong> · Stock: {product.stock}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <label>Qty:</label>
              <input className="form-control" type="number" min="1" max={product.stock} value={qty}
                onChange={(e) => setQty(+e.target.value)} style={{ width: 80 }} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handleAddToCart}>
                <ShoppingCart size={16} /> Add to Cart
              </button>
              <button className="btn btn-secondary" onClick={async () => {
                await wishlistAPI.add(product.id);
                toast.success('Added to wishlist!');
              }}>
                <Heart size={16} /> Wishlist
              </button>
              <Link to={`/compare?product=${product.id}`} className="btn btn-secondary">
                <GitCompare size={16} /> Compare Prices
              </Link>
            </div>

            {compare && (
              <div className="card" style={{ marginTop: '2rem' }}>
                <div className="card-body">
                  <h3 style={{ marginBottom: '1rem' }}>Price Comparison</h3>
                  <div className={`compare-row ${compare.best_deal?.platform_name === 'Our Store' ? 'compare-best' : ''}`}>
                    <span><strong>Our Store</strong></span>
                    <span>₹{product.price.toLocaleString()}</span>
                  </div>
                  {compare.platform_prices.map((pp) => (
                    <div key={pp.id} className={`compare-row ${compare.best_deal?.id === pp.id ? 'compare-best' : ''}`}>
                      <span>{pp.platform_name}</span>
                      <span>₹{pp.price.toLocaleString()}</span>
                    </div>
                  ))}
                  {compare.best_deal && (
                    <p style={{ marginTop: '1rem', color: 'var(--success)', fontWeight: 600 }}>
                      Best deal: {compare.best_deal.platform_name} — Save ₹{compare.savings.toLocaleString()}!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
