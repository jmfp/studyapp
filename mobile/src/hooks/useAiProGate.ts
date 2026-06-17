import { useCallback } from 'react';
import { usePaywall } from '../context/PaywallContext';
import { useAppSelector } from './redux';

export function useIsPro(): boolean {
  const subscriptionTier = useAppSelector((s) => s.subscription.tier);
  const userTier = useAppSelector((s) => s.auth.user?.subscriptionTier);
  return subscriptionTier === 'pro' || userTier === 'pro';
}

/** Gate AI / Pro features — shows the global paywall when the user is on the free tier. */
export function useAiProGate(onBlocked?: () => void) {
  const isPro = useIsPro();
  const { showPaywall } = usePaywall();

  const requirePro = useCallback((): boolean => {
    if (isPro) return true;
    showPaywall();
    onBlocked?.();
    return false;
  }, [isPro, showPaywall, onBlocked]);

  return { isPro, requirePro };
}

export function isAiProRequiredError(err: unknown): boolean {
  const code = (err as { data?: { code?: string } })?.data?.code;
  return code === 'AI_PRO_REQUIRED';
}
