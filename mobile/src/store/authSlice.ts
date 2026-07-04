import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '../types';
import { BYPASS_AUTH, DEV_TOKEN, DEV_USER } from '../config/dev';

interface ExtendedAuthState extends AuthState {
  needsOnboarding: boolean;
  showDeckTip: boolean;
}

const initialState: ExtendedAuthState = BYPASS_AUTH
  ? { user: DEV_USER, token: DEV_TOKEN, isLoading: false, error: null, needsOnboarding: false, showDeckTip: false }
  : { user: null, token: null, isLoading: false, error: null, needsOnboarding: false, showDeckTip: false };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) Object.assign(state.user, action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      state.needsOnboarding = false;
      state.showDeckTip = false;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    setNeedsOnboarding: (state, action: PayloadAction<boolean>) => {
      state.needsOnboarding = action.payload;
    },
    setShowDeckTip: (state, action: PayloadAction<boolean>) => {
      state.showDeckTip = action.payload;
    },
  },
});

export const { setCredentials, updateUser, logout, setError, setNeedsOnboarding, setShowDeckTip } = authSlice.actions;
export default authSlice.reducer;
