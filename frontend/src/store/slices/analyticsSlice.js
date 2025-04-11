import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Async thunks
export const getUrlAnalytics = createAsyncThunk(
  'analytics/getUrlAnalytics',
  async (urlId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/analytics/${urlId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getUrlStats = createAsyncThunk(
  'analytics/getUrlStats',
  async (urlId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/analytics/${urlId}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  analytics: {},
  stats: {},
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get URL Analytics
      .addCase(getUrlAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUrlAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(getUrlAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch analytics';
      })
      // Get URL Stats
      .addCase(getUrlStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUrlStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(getUrlStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch stats';
      });
  },
});

export const { clearError } = analyticsSlice.actions;
export default analyticsSlice.reducer; 