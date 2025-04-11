import axios from 'axios';

// Determine API URL based on environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create a specific instance
const api = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor TO THE SPECIFIC INSTANCE
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage each time to ensure it's the latest
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('[Axios Interceptor] Adding token to request');
    } else {
      console.log('[Axios Interceptor] No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('[Axios Interceptor] Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor TO THE SPECIFIC INSTANCE
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('[Axios Interceptor] Unauthorized request - 401', error.response);
      
      // Clear token and redirect to login on 401 errors
      localStorage.removeItem('token');
      
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        console.log('[Axios Interceptor] Redirecting to login page');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Export the configured instance
export default api; 