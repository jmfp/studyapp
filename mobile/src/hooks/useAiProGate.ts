import { useCallback } from 'react';
import { useAppSelector } from './redux';

export function useIsPro(): boolean {
  const subscriptionTier = useAppSelector((s) => s.subscription.tier);
  const userTier = useAppSelector((s) => s.auth.user?.subscriptionTier);
  return subscriptionTier === 'pro' || userTier === 'pro';
}

export function useAiProGate(showPaywall: () => void) {
  const isPro = useIsPro();

  const requirePro = useCallback((): boolean => {
    if (isPro) return true;
    showPaywall();
    return false;
  }, [isPro, showPaywall]);

  return { isPro, requirePro };
}

export function isAiProRequiredError(err: unknown): boolean {
  const code = (err as { data?: { code?: string } })?.data?.code;
  return code === 'AI_PRO_REQUIRED';
}
