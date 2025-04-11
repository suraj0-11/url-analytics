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
  error: string | null;
  success: string | null;
}

const initialState: UrlState = {
  urls: [],
  loading: false,
  error: null,
  success: null,
};

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

export const createShortUrl = createAsyncThunk(
  'url/createShortUrl',
  async (urlData: { originalUrl: string; customAlias?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/urls', urlData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create short URL');
    }
  }
);

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
      .addCase(createUrl.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(createUrl.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.url) {
          state.urls = [...state.urls, action.payload.url];
        } else {
          console.error('[Reducer createUrl.fulfilled] Invalid payload structure:', action.payload);
          state.error = 'Failed to update list after creating URL.';
        }
        state.success = 'URL created successfully';
      })
      .addCase(createUrl.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createShortUrl.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(createShortUrl.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.url) {
          state.urls = [...state.urls, action.payload.url];
        } else {
          console.error('[Reducer createShortUrl.fulfilled] Invalid payload structure:', action.payload);
          state.error = 'Failed to update list after creating URL.';
        }
        state.success = 'Short URL created successfully';
      })
      .addCase(createShortUrl.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getUrls.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUrls.fulfilled, (state, action) => {
        console.log('[Reducer getUrls.fulfilled] Received payload:', action.payload);
        state.loading = false;
        if (Array.isArray(action.payload)) {
          state.urls = action.payload;
        } else {
          console.error('[Reducer getUrls.fulfilled] Payload is not an array!', action.payload);
          state.error = 'Received invalid data for URLs.';
          state.urls = [];
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
  },
});

export const { clearError, clearSuccess } = urlSlice.actions;
export default urlSlice.reducer; 