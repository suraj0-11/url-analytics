import axios from 'axios';

// Create a specific instance
const api = axios.create({
  // You could set a baseURL here if desired, e.g.:
  // baseURL: '/api',
});

// Add a request interceptor TO THE SPECIFIC INSTANCE
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log('[Axios Interceptor] Sending request with headers:', config.headers);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor TO THE SPECIFIC INSTANCE (optional but good practice)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized request - 401', error.response);
      // Optional: Clear token and redirect
      // localStorage.removeItem('token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export the configured instance
export default api; 