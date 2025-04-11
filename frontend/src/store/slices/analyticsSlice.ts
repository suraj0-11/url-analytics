import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// Import the configured Axios instance
import api from '../../api/axiosConfig';

// Minimal state
interface MinimalAnalyticsState {
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const initialState: MinimalAnalyticsState = {
  status: 'idle',
  error: null,
};

// Minimal slice
const analyticsSlice = createSlice({
  name: 'analytics', // Keep the name the same
  initialState,
  reducers: {
    // Simple reducer example (can be empty if needed)
    resetAnalytics: (state) => {
      state.status = 'idle';
      state.error = null;
    },
  },
});

console.log('[Simplified Slice] analyticsSlice created:', analyticsSlice);
console.log('[Simplified Slice] analyticsSlice.reducer:', analyticsSlice.reducer);

// Renamed to getUrlAnalytics
export const getUrlAnalytics = createAsyncThunk(
  'analytics/getUrlAnalytics',
  async (urlId: string, { rejectWithValue }) => {
    try {
      // Use the configured instance
      const response = await api.get(`/api/analytics/${urlId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

export const { resetAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer; 