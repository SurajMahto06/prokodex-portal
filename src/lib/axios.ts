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

// Removed manual Authorization injection since HttpOnly cookies are automatically sent.
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a 401, we might want to automatically clear token and redirect
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // You could also emit an event or use a callback to trigger logout in React state
      }
    }
    return Promise.reject(error);
  }
);
