import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { login } from '../store/slices';
import { useAppDispatch } from '../hooks/useAppDispatch';
import api from '../api/axiosConfig';
import axios from 'axios';

interface BackendStatus {
  status: string;
  mongoConnection: 'connected' | 'disconnected';
  uptime?: number;
}

const Login = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const [formData, setFormData] = useState({
    email: 'intern@dacoid.com',
    password: 'Test123',
  });
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const checkBackendStatus = async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const response = await api.get('/api/health');
      setBackendStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch backend status:', error);
      setStatusError('Backend unavailable');
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting login with:', {
      email: formData.email,
      password: formData.password.replace(/./g, '*')  // Log masked password for security
    });
    
    try {
      // Dispatch login action
      await dispatch(login(formData)).unwrap();
      
      // If successful, the login.fulfilled case will handle redirection
    } catch (error: any) {
      console.error('Login submission error:', error);
      // Error already handled by Redux
    }
  };

  const getStatusColor = () => {
    if (statusLoading) return 'bg-gray-200';
    if (statusError) return 'bg-red-500';
    if (!backendStatus) return 'bg-red-500';
    
    return backendStatus.status === 'ok' && backendStatus.mongoConnection === 'connected' 
      ? 'bg-green-500' 
      : 'bg-yellow-500';
  };

  const getStatusText = () => {
    if (statusLoading) return 'Checking...';
    if (statusError) return 'Backend unavailable';
    if (!backendStatus) return 'Backend unavailable';
    
    return `Backend: ${backendStatus.status}, DB: ${backendStatus.mongoConnection}`;
  };

  // Test authentication directly without redux
  const testAuth = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      // Test direct API call
      const directApi = axios.create({
        baseURL: api.defaults.baseURL,
        timeout: 15000
      });
      
      console.log('Testing direct auth with:', { 
        url: `${api.defaults.baseURL}/api/auth/login`,
        email: formData.email
      });
      
      const response = await directApi.post('/api/auth/login', formData);
      setTestResult(
        `Success! Token received: ${response.data.token.substring(0, 15)}...`
      );
      
      // Store token and redirect to dashboard when test is successful
      const token = response.data.token;
      if (token) {
        localStorage.setItem('token', token);
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      console.error('Test auth error:', error);
      setTestResult(
        `Error: ${error.response?.data?.message || error.message || 'Unknown error'} (${error.response?.status || 'no status'})`
      );
    } finally {
      setTestLoading(false);
    }
  };

  // Test model files path - useful for debugging backend issues
  const testModelPath = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const response = await api.get('/api/debug/model-paths');
      setTestResult(`Model paths: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      setTestResult(`Cannot test model paths. Backend may not support this endpoint.`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800">URL Analytics Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">Please sign in to access your shortened URLs and analytics.</p>
      </div>

      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md space-y-8">
        <div>
          <h2 className="text-center text-2xl font-semibold text-gray-900">
            Sign in to your account
          </h2>
          
          {/* Backend Status Indicator */}
          <div className="mt-2 flex flex-col items-center">
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${getStatusColor()}`}></div>
              <span className="text-xs text-gray-500">{getStatusText()}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              API: {api.defaults.baseURL || 'Not configured'}
            </div>
            <button 
              type="button"
              onClick={checkBackendStatus}
              disabled={statusLoading}
              className="mt-2 text-xs text-blue-500 hover:text-blue-700 disabled:text-gray-400"
            >
              {statusLoading ? 'Checking...' : 'Refresh Status'}
            </button>
          </div>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm text-center">
              <div className="font-medium">{error}</div>
              {error.includes('failed') && (
                <div className="text-xs mt-1">
                  Try the "Test Authentication (Direct)" button below for a direct login.
                </div>
              )}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in with Redux'}
            </button>
          </div>
        </form>

        {/* Diagnostic Tools Section */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Diagnostic Tools</h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={testAuth}
              disabled={testLoading}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {testLoading ? 'Signing in...' : 'Direct Sign in (Bypass Redux)'}
            </button>

            <button
              type="button"
              onClick={testModelPath}
              disabled={testLoading}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Test Model Paths
            </button>
          </div>
          
          {testResult && (
            <div className={`mt-2 p-2 text-xs rounded ${testResult.includes('Success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {testResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login; 