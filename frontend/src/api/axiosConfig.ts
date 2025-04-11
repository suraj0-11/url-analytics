import axios from 'axios';

// Determine API URL based on environment
const API_URL = process.env.REACT_APP_API_URL || 'https://curious-dorene-finalllly-f2001d79.koyeb.app';

console.log('API Configuration:', {
  baseURL: API_URL,
  nodeEnv: process.env.NODE_ENV,
  reactAppApiUrl: process.env.REACT_APP_API_URL
});

// Create a specific instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor TO THE SPECIFIC INSTANCE
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage each time to ensure it's the latest
    const token = localStorage.getItem('token');
    if (token) {
      // Check if token is valid (not expired) - basic check based on format
      try {
        // JWT tokens have 3 parts separated by dots
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.warn('[Axios Interceptor] Token format invalid, removing token');
          localStorage.removeItem('token');
          return config;
        }
        
        // Try to decode the payload (middle part)
        const payload = JSON.parse(atob(parts[1]));
        
        // Check if token is expired
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          console.warn('[Axios Interceptor] Token expired, removing token');
          localStorage.removeItem('token');
          return config;
        }
        
        // Token seems valid, add it to headers
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log('[Axios Interceptor] Adding token to request:', config.url);
      } catch (e) {
        console.warn('[Axios Interceptor] Error validating token:', e);
        // Don't remove token on parse error - it might be a different format
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } else {
      console.log('[Axios Interceptor] No token found for request:', config.url);
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
    console.log(`[Axios Response] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    // Detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`[Axios Error] ${error.config?.method?.toUpperCase() || 'REQUEST'} ${error.config?.url} - Status: ${error.response.status}`, {
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[Axios Error] No response received', {
        request: error.request,
        url: error.config?.url
      });
    } else {
      // Something happened in setting up the request that triggered an error
      console.error('[Axios Error] Request setup error', error.message);
    }

    if (error.response && error.response.status === 401) {
      console.warn('[Axios Error] Unauthorized request - 401', error.response.config.url);
      
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