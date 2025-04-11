import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import { getCurrentUser, manualLogin, logout } from './store/slices/authSlice';
import { useAppDispatch } from './hooks/useAppDispatch';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isLoading, setIsLoading] = useState(true);

  // Verify token and sync auth state on app startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Basic token validation
      try {
        // Check token format (JWT tokens have 3 parts)
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.warn('Invalid token format, logging out');
          dispatch(logout());
          setIsLoading(false);
          return;
        }
        
        // Try to decode the payload
        const payload = JSON.parse(atob(parts[1]));
        
        // Check if expired
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          console.warn('Token expired, logging out');
          dispatch(logout());
          setIsLoading(false);
          return;
        }
        
        // Token looks valid, fetch current user
        dispatch(getCurrentUser())
          .unwrap()
          .then(() => {
            console.log('User authenticated successfully on startup');
          })
          .catch(() => {
            // If getting user fails, create basic auth state from token
            console.log('Failed to get user data, creating basic auth state');
            dispatch(manualLogin({ 
              token,
              user: { email: payload.email || 'unknown', _id: payload.id || payload.userId || 'unknown' }
            }));
          })
          .finally(() => {
            setIsLoading(false);
          });
      } catch (e) {
        console.error('Token validation error:', e);
        setIsLoading(false);
      }
    } else {
      console.log('No token found, not authenticated');
      setIsLoading(false);
    }
  }, [dispatch]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
        } />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
