import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  ShoppingCart, Heart, Home, Package, MapPin, Store, BarChart3,
  Users, LogOut, GitCompare, UserPlus,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin, isVendor } = useAuth();
  const { count } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">🛒 Marketplace</Link>
        <div className="navbar-nav">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <Home size={16} /> Home
          </Link>
          <Link to="/cart" className={`nav-link ${isActive('/cart') ? 'active' : ''}`}>
            <ShoppingCart size={16} /> Cart
            {count > 0 && <span className="nav-badge">{count}</span>}
          </Link>
          <Link to="/wishlist" className={`nav-link ${isActive('/wishlist') ? 'active' : ''}`}>
            <Heart size={16} /> Wishlist
          </Link>
          <Link to="/compare" className={`nav-link ${isActive('/compare') ? 'active' : ''}`}>
            <GitCompare size={16} /> Compare
          </Link>
          <Link to="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>
            <Package size={16} /> Orders
          </Link>
          <Link to="/addresses" className={`nav-link ${isActive('/addresses') ? 'active' : ''}`}>
            <MapPin size={16} /> Addresses
          </Link>
          {!isVendor && (
            <Link to="/vendor-register" className={`nav-link ${isActive('/vendor-register') ? 'active' : ''}`}>
              <Store size={16} /> Sell
            </Link>
          )}
          {isAdmin && (
            <>
              <Link to="/admin/users" className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`}>
                <Users size={16} /> Users
              </Link>
              <Link to="/admin/analytics" className={`nav-link ${isActive('/admin/analytics') ? 'active' : ''}`}>
                <BarChart3 size={16} /> Analytics
              </Link>
            </>
          )}
          <span className="nav-link" style={{ cursor: 'default' }}>
            <UserPlus size={16} /> {user.full_name}
            <span className="badge badge-primary">{user.role}</span>
          </span>
          <button className="nav-link" onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
