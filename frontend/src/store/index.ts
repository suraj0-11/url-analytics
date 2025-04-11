import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import urlReducer from './slices/urlSlice';
import analyticsReducer from './slices/analyticsSlice';

// Log the imported reducer just before using it
console.log('[Store] Importing analyticsReducer:', analyticsReducer);

export const store = configureStore({
  reducer: {
    auth: authReducer,
    url: urlReducer,
    analytics: analyticsReducer,
  },
});

// Log the configured reducer map
console.log('[Store] Configured Reducers:', store.getState()); // Log initial state AFTER config

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 