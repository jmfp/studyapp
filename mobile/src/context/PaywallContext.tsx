import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import PaywallModal from '../components/PaywallModal';

interface PaywallContextValue {
  showPaywall: () => void;
  hidePaywall: () => void;
}

const PaywallContext = createContext<PaywallContextValue | null>(null);

export function PaywallProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  const showPaywall = useCallback(() => setVisible(true), []);
  const hidePaywall = useCallback(() => setVisible(false), []);

  const value = useMemo(() => ({ showPaywall, hidePaywall }), [showPaywall, hidePaywall]);

  return (
    <PaywallContext.Provider value={value}>
      {children}
      <PaywallModal
        visible={visible}
        onClose={hidePaywall}
        onSuccess={hidePaywall}
      />
    </PaywallContext.Provider>
  );
}

export function usePaywall(): PaywallContextValue {
  const ctx = useContext(PaywallContext);
  if (!ctx) {
    throw new Error('usePaywall must be used within PaywallProvider');
  }
  return ctx;
}
