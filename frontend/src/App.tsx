import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import { getCurrentUser } from './store/slices/authSlice';
import { useAppDispatch } from './hooks/useAppDispatch';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

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
