import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Inject token from localStorage for mobile browsers that block HttpOnly cookies
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a 401 or 403 (inactive user), automatically clear token and redirect
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Optional: Force reload to push them back to login page if they are on a protected route
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
