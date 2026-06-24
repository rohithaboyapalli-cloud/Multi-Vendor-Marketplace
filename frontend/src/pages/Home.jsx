import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI, wishlistAPI } from '../api';
import { useCart } from '../context/CartContext';
import { Heart, ShoppingCart, GitCompare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    productsAPI.categories().then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (selectedCategory) params.category_id = selectedCategory;
    if (search) params.search = search;
    productsAPI.list(params)
      .then((r) => setProducts(r.data))
      .finally(() => setLoading(false));
  }, [selectedCategory, search]);

  const handleAddToCart = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addItem(productId);
      toast.success('Added to cart!');
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  const handleWishlist = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await wishlistAPI.add(productId);
      toast.success('Added to wishlist!');
    } catch {
      toast.error('Failed to add to wishlist');
    }
  };

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">Discover Products</h1>

        <div className="search-bar">
          <input
            className="form-control"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="category-pills">
          <button
            className={`category-pill ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <div className="empty-state"><p>No products found</p></div>
        ) : (
          <div className="grid grid-4">
            {products.map((product) => (
              <Link key={product.id} to={`/products/${product.id}`} className="card product-card">
                <img src={product.image_url} alt={product.name} loading="lazy" />
                <div className="card-body">
                  <p className="category">{product.category_name}</p>
                  <h3 style={{ fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{product.name}</h3>
                  <p className="price">₹{product.price.toLocaleString()}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button className="btn btn-primary btn-sm" onClick={(e) => handleAddToCart(e, product.id)}>
                      <ShoppingCart size={14} /> Cart
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={(e) => handleWishlist(e, product.id)}>
                      <Heart size={14} />
                    </button>
                    <Link to={`/compare?product=${product.id}`} className="btn btn-secondary btn-sm" onClick={(e) => e.stopPropagation()}>
                      <GitCompare size={14} />
                    </Link>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
