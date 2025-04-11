import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';

interface UrlData {
  _id: string;
  originalUrl: string;
  shortUrl: string;
  shortId: string;
  clicks: number;
  createdAt: string;
  expiresAt?: string;
}

interface UrlState {
  urls: UrlData[];
  loading: boolean;
  createStatus: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  success: string | null;
}

const initialState: UrlState = {
  urls: [],
  loading: false,
  createStatus: 'idle',
  error: null,
  success: null,
};

// Thunks
export const getUrls = createAsyncThunk(
  'url/getUrls',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/urls');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get URLs');
    }
  }
);

export const createUrl = createAsyncThunk(
  'url/createUrl',
  async (urlData: { originalUrl: string; customAlias?: string; expiresAt?: string | undefined }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/urls', urlData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create URL');
    }
  }
);

export const deleteUrl = createAsyncThunk(
  'url/deleteUrl',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/urls/${id}`);
      return response.data.id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete URL');
    }
  }
);

// Slice
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
    resetCreateStatus: (state) => {
      state.createStatus = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createUrl.pending, (state) => {
        state.createStatus = 'pending';
        state.error = null;
        state.success = null;
      })
      .addCase(createUrl.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        state.success = 'URL created successfully';
        state.error = null;
        
        if (action.payload && action.payload.url && action.payload.url._id) {
          state.urls.push(action.payload.url);
          console.log('[urlSlice] Added new URL to state:', action.payload.url);
        } else {
          console.error('[Reducer createUrl.fulfilled] Invalid payload structure:', action.payload);
        }
      })
      .addCase(createUrl.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.error = action.payload as string;
        state.success = null;
      })
      .addCase(getUrls.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUrls.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload)) {
          state.urls = action.payload;
        }
      })
      .addCase(getUrls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
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
        state.error = action.payload as string;
      });
  }
});

// Export everything
export const urlActions = urlSlice.actions;
export const resetCreateStatus = urlActions.resetCreateStatus;
export const clearError = urlActions.clearError;
export const clearSuccess = urlActions.clearSuccess;

export default urlSlice.reducer; 