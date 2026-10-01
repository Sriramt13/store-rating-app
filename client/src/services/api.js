const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Universal request helper with token injection
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || 'Request failed');
      error.status = response.status;
      error.errors = data.errors || null;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.status === 401 && !endpoint.includes('/auth/login')) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:logout'));
    }
    throw error;
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getProfile: () => request('/auth/me'),
  updatePassword: (passwords) => request('/auth/password', { method: 'PUT', body: JSON.stringify(passwords) }),

  // Admin
  getDashboardStats: () => request('/admin/dashboard'),
  getAdminUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/users${query ? `?${query}` : ''}`);
  },
  createAdminUser: (userData) => request('/admin/users', { method: 'POST', body: JSON.stringify(userData) }),
  getAdminStores: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/stores${query ? `?${query}` : ''}`);
  },
  createAdminStore: (storeData) => request('/admin/stores', { method: 'POST', body: JSON.stringify(storeData) }),
  getAvailableOwners: () => request('/admin/owners'),

  // Normal User Stores & Ratings
  getStores: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/stores${query ? `?${query}` : ''}`);
  },
  submitRating: (storeId, rating) => request(`/stores/${storeId}/ratings`, { method: 'POST', body: JSON.stringify({ rating }) }),
  modifyRating: (storeId, rating) => request(`/stores/${storeId}/ratings`, { method: 'PUT', body: JSON.stringify({ rating }) }),
  deleteRating: (storeId) => request(`/stores/${storeId}/ratings`, { method: 'DELETE' }),

  // Store Owner Dashboard
  getOwnerDashboard: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/owner/dashboard${query ? `?${query}` : ''}`);
  }
};
