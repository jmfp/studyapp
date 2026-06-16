import React, { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import type { RootState, AppDispatch } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { setTier, setRcInitialized } from './src/store/subscriptionSlice';
import { initRevenueCat, getCustomerInfo, isPro, logOut, canUseRevenueCat } from './src/services/revenueCat';
import { logout } from './src/store/authSlice';
import { api } from './src/services/api';
import { BYPASS_AUTH } from './src/config/dev';

function AppInit() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);
  const token = useSelector((s: RootState) => s.auth.token);

  // When user logs in, initialize RevenueCat and sync subscription state
  useEffect(() => {
    if (!user || !token || BYPASS_AUTH) return;

    (async () => {
      if (!canUseRevenueCat()) {
        dispatch(setTier((user.subscriptionTier as 'free' | 'pro') ?? 'free'));
        dispatch(setRcInitialized(false));
        return;
      }

      try {
        await initRevenueCat(user._id);
        const info = await getCustomerInfo();
        const pro = await isPro(info);
        dispatch(setTier(pro ? 'pro' : 'free'));
        dispatch(setRcInitialized(true));
      } catch {
        // RevenueCat keys not yet configured — default to free
        // Set tier from server-side subscriptionTier if available
        dispatch(setTier((user.subscriptionTier as 'free' | 'pro') ?? 'free'));
        dispatch(setRcInitialized(false));
      }
    })();
  }, [user?._id]);

  // When user logs out, clean up RevenueCat
  useEffect(() => {
    if (!token && canUseRevenueCat()) {
      logOut().catch(() => {});
    }
  }, [token]);

  return null;
}

function Root() {
  return (
    <>
      <AppInit />
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <Root />
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
