import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsAPI } from '../api';
import { Award, ExternalLink } from 'lucide-react';

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(searchParams.get('product') || '');
  const [compare, setCompare] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    productsAPI.list().then((r) => setProducts(r.data));
  }, []);

  useEffect(() => {
    if (selectedId) {
      setLoading(true);
      productsAPI.compare(selectedId)
        .then((r) => setCompare(r.data))
        .finally(() => setLoading(false));
    }
  }, [selectedId]);

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">Price Comparison</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Compare prices across multiple platforms and find the best deal.
        </p>

        <div className="form-group" style={{ maxWidth: 400 }}>
          <label>Select Product</label>
          <select className="form-control" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Choose a product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — ₹{p.price.toLocaleString()}</option>
            ))}
          </select>
        </div>

        {loading && <p>Loading comparison...</p>}

        {compare && (
          <div className="grid grid-2" style={{ marginTop: '2rem' }}>
            <div className="card">
              <img src={compare.product.image_url} alt={compare.product.name} style={{ width: '100%', height: 250, objectFit: 'cover' }} />
              <div className="card-body">
                <h2>{compare.product.name}</h2>
                <p style={{ color: 'var(--text-muted)' }}>{compare.product.description}</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <h3 style={{ marginBottom: '1rem' }}>Platform Prices</h3>
                <div className={`compare-row ${compare.best_deal?.platform_name === 'Our Store' ? 'compare-best' : ''}`}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong>Our Store</strong>
                    {compare.best_deal?.platform_name === 'Our Store' && <Award size={16} color="var(--success)" />}
                  </span>
                  <span style={{ fontWeight: 700 }}>₹{compare.product.price.toLocaleString()}</span>
                </div>
                {compare.platform_prices.map((pp) => (
                  <div key={pp.id} className={`compare-row ${compare.best_deal?.id === pp.id ? 'compare-best' : ''}`}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {pp.platform_name}
                      {compare.best_deal?.id === pp.id && <Award size={16} color="var(--success)" />}
                      {pp.url && (
                        <a href={pp.url} target="_blank" rel="noreferrer"><ExternalLink size={14} /></a>
                      )}
                    </span>
                    <span style={{ fontWeight: 700 }}>₹{pp.price.toLocaleString()}</span>
                  </div>
                ))}
                {compare.savings > 0 && (
                  <div style={{
                    marginTop: '1.5rem', padding: '1rem', background: '#ecfdf5',
                    borderRadius: 8, textAlign: 'center',
                  }}>
                    <p style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.125rem' }}>
                      🎉 Best Deal: {compare.best_deal?.platform_name}
                    </p>
                    <p>You can save up to ₹{compare.savings.toLocaleString()}!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
