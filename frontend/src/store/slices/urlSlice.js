import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Async thunks
export const createUrl = createAsyncThunk(
  'url/create',
  async (urlData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/urls`, urlData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getUrls = createAsyncThunk(
  'url/list',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/urls`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteUrl = createAsyncThunk(
  'url/delete',
  async (urlId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/urls/${urlId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return urlId;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  urls: [],
  loading: false,
  error: null,
  success: null,
};

const urlSlice = createSlice({
  name: 'url',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create URL
      .addCase(createUrl.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(createUrl.fulfilled, (state, action) => {
        state.loading = false;
        state.urls.push(action.payload);
        state.success = 'URL created successfully';
      })
      .addCase(createUrl.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create URL';
      })
      // Get URLs
      .addCase(getUrls.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUrls.fulfilled, (state, action) => {
        state.loading = false;
        state.urls = action.payload;
      })
      .addCase(getUrls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch URLs';
      })
      // Delete URL
      .addCase(deleteUrl.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUrl.fulfilled, (state, action) => {
        state.loading = false;
        state.urls = state.urls.filter((url) => url._id !== action.payload);
        state.success = 'URL deleted successfully';
      })
      .addCase(deleteUrl.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete URL';
      });
  },
});

export const { clearError, clearSuccess } = urlSlice.actions;
export default urlSlice.reducer; 