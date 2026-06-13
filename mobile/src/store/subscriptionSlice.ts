import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SubscriptionTier = 'free' | 'pro';

interface SubscriptionState {
  tier: SubscriptionTier;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  expirationDate: string | null;
  rcInitialized: boolean;
}

const initialState: SubscriptionState = {
  tier: 'free',
  isLoading: false,
  isPurchasing: false,
  isRestoring: false,
  expirationDate: null,
  rcInitialized: false,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setTier: (state, action: PayloadAction<SubscriptionTier>) => {
      state.tier = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setPurchasing: (state, action: PayloadAction<boolean>) => {
      state.isPurchasing = action.payload;
    },
    setRestoring: (state, action: PayloadAction<boolean>) => {
      state.isRestoring = action.payload;
    },
    setExpirationDate: (state, action: PayloadAction<string | null>) => {
      state.expirationDate = action.payload;
    },
    setRcInitialized: (state, action: PayloadAction<boolean>) => {
      state.rcInitialized = action.payload;
    },
    resetSubscription: () => initialState,
  },
});

export const {
  setTier, setLoading, setPurchasing, setRestoring,
  setExpirationDate, setRcInitialized, resetSubscription,
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;
