import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  listUsers: () => api.get('/auth/users'),
  createUser: (data) => api.post('/auth/users', data),
  toggleUser: (id) => api.patch(`/auth/users/${id}/toggle`),
};

export const productsAPI = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  compare: (id) => api.get(`/products/${id}/compare`),
  categories: () => api.get('/products/categories'),
  create: (data) => api.post('/products', data),
  createCategory: (data) => api.post('/products/categories', data),
};

export const cartAPI = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart', data),
  update: (id, quantity) => api.patch(`/cart/${id}`, null, { params: { quantity } }),
  remove: (id) => api.delete(`/cart/${id}`),
  clear: () => api.delete('/cart'),
};

export const wishlistAPI = {
  get: () => api.get('/wishlist'),
  add: (productId) => api.post(`/wishlist/${productId}`),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
};

export const addressAPI = {
  list: () => api.get('/addresses'),
  create: (data) => api.post('/addresses', data),
  update: (id, data) => api.put(`/addresses/${id}`, data),
  delete: (id) => api.delete(`/addresses/${id}`),
  setDefault: (id) => api.patch(`/addresses/${id}/default`),
};

export const ordersAPI = {
  list: () => api.get('/orders'),
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
  track: (id) => api.get(`/orders/${id}/track`),
};

export const paymentsAPI = {
  config: () => api.get('/payments/config'),
  upi: (data) => api.post('/payments/upi', data),
  verifyUpi: (data) => api.post('/payments/upi/verify', data),
  razorpay: (data) => api.post('/payments/razorpay/create', data),
  verifyRazorpay: (data) => api.post('/payments/razorpay/verify', data),
  stripe: (data) => api.post('/payments/stripe/create', data),
  verifyStripe: (data) => api.post('/payments/stripe/verify', data),
};

export const vendorsAPI = {
  register: (data) => api.post('/vendors/register', data),
  me: () => api.get('/vendors/me'),
  list: () => api.get('/vendors'),
  approve: (id) => api.patch(`/vendors/${id}/approve`),
};

export const analyticsAPI = {
  get: () => api.get('/analytics'),
};

export default api;
