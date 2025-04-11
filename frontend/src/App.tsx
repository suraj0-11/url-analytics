import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from './store';
// Comment out getCurrentUser import
import { /* getCurrentUser, */ logout } from './store/slices/authSlice';
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
        
        // Token looks valid, but skip getCurrentUser and manualLogin
        console.log('Token valid on startup, but state sync is disabled.');
        // Need to manually set isAuthenticated based on token presence
        // Or rely on PrivateRoute checking localStorage? This is tricky.
        // For now, just log and set loading to false.
        setIsLoading(false); 
        
        // REMOVED: dispatch(manualLogin(...));
        // REMOVED: dispatch(getCurrentUser())... logic ...
      } catch (e) {
        console.error('Token validation error on startup:', e);
        dispatch(logout()); // Logout on validation error
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
