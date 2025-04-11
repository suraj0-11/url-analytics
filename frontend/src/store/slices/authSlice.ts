import { createSlice } from '@reduxjs/toolkit';
// import api from '../../api/axiosConfig'; // Temp removed
// import axios from 'axios'; // Temp removed

interface User {
  _id?: string;
  id?: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('token'),
};

// Define reducers explicitly, REMOVING manualLogin
const reducers = {
  logout: (state: AuthState) => {
    state.user = null;
    state.token = null;
    state.isAuthenticated = false;
    localStorage.removeItem('token');
  },
  clearError: (state: AuthState) => {
    state.error = null;
  },
};

// Temporarily comment out async thunks
// export const login = createAsyncThunk(...);
// export const register = createAsyncThunk(...);
// export const getCurrentUser = createAsyncThunk(...);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: reducers, // Pass the explicitly defined reducers
  // Temporarily comment out extraReducers
  // extraReducers: (builder) => {
  //   // ...
  // },
});

// REMOVE manualLogin from the export
export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer; 