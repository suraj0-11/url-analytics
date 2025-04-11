import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';
import axios from 'axios';

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

// Define the payload type for manualLogin
interface ManualLoginPayload {
  token: string;
  user: User;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('token'),
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      console.log('Attempting login with:', { email: credentials.email });
      
      // Create a direct axios instance without the interceptors
      const directApi = axios.create({
        baseURL: api.defaults.baseURL,
        timeout: 15000
      });
      
      // Make the direct API call
      const response = await directApi.post('/api/auth/login', credentials);
      console.log('Login success response:', response.data);
      
      // Save token to localStorage
      localStorage.setItem('token', response.data.token);
      
      return response.data;
    } catch (error: any) {
      console.error('Login error details:', {
        status: error.response?.status,
        data: error.response?.data,
        error: error.message
      });
      
      if (!error.response) {
        return rejectWithValue('Network error: Unable to reach the server. Please check your connection and server status.');
      }
      
      return rejectWithValue(
        error.response?.data?.message || 
        `Login failed (${error.response?.status || 'unknown error'})`
      );
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/auth/me');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get user data');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    manualLogin: (state, action: PayloadAction<ManualLoginPayload>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        
        // Add redirection on successful login
        window.location.href = '/dashboard';
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });
  },
});

export const { logout, clearError, manualLogin } = authSlice.actions;
export default authSlice.reducer; 