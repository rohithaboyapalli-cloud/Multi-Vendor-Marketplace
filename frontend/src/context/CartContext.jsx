import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    try {
      const res = await cartAPI.get();
      setItems(res.data);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const addItem = async (productId, quantity = 1) => {
    await cartAPI.add({ product_id: productId, quantity });
    await refresh();
  };

  const updateItem = async (itemId, quantity) => {
    await cartAPI.update(itemId, quantity);
    await refresh();
  };

  const removeItem = async (itemId) => {
    await cartAPI.remove(itemId);
    await refresh();
  };

  const total = items.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, addItem, updateItem, removeItem, refresh, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
