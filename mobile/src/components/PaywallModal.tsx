import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView, Animated, Dimensions, ActivityIndicator, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '../theme';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
  setTier, setPurchasing, setRestoring,
} from '../store/subscriptionSlice';
import { useUpdateSubscriptionMutation } from '../services/api';
import {
  getOfferings, purchasePackage, restorePurchases, isPro, FREE_DECK_LIMIT, PRO_PRICE,
} from '../services/revenueCat';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../constants/legal';
import type { PurchasesPackage } from 'react-native-purchases';

const { width, height } = Dimensions.get('window');

const PRO_FEATURES = [
  { icon: 'infinite', label: 'Unlimited decks', sub: `Create more than ${FREE_DECK_LIMIT} study decks` },
  { icon: 'sparkles', label: 'AI deck generation', sub: 'Build full decks from notes, PDFs, URLs, site crawls & photos' },
  { icon: 'school', label: 'Study coach', sub: 'Memory hooks and hints when you miss a card in quiz' },
  { icon: 'bulb', label: 'Smart card improve', sub: 'AI suggestions to shorten, split, or add mnemonics' },
  { icon: 'language', label: 'Multilingual AI', sub: 'Translations, native script answers, examples & reverse cards' },
  { icon: 'analytics', label: 'AI weekly insights', sub: 'Personalized study summaries and recommendations' },
  { icon: 'bar-chart', label: 'Advanced analytics', sub: 'Forecasts, recall quality, weak cards & session history' },
] as const;

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PaywallModal({ visible, onClose, onSuccess }: PaywallModalProps) {
  const dispatch = useAppDispatch();
  const { isPurchasing, isRestoring } = useAppSelector((s) => s.subscription);
  const user = useAppSelector((s) => s.auth.user);
  const [updateSubscription] = useUpdateSubscriptionMutation();

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Animations
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(height)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const featureAnims = useRef(PRO_FEATURES.map(() => new Animated.Value(0))).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const btnPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setErrorMsg('');
      setSuccessMsg('');

      // Sheet slides up
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(sheetAnim, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
      ]).start();

      // Badge bounces in
      Animated.spring(badgeScale, { toValue: 1, tension: 70, friction: 5, delay: 200, useNativeDriver: true }).start();

      // Features stagger in
      Animated.stagger(80, featureAnims.map((a) =>
        Animated.spring(a, { toValue: 1, tension: 60, friction: 8, delay: 300, useNativeDriver: true })
      )).start();

      // Button shimmer loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();

      // Button subtle pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(btnPulse, { toValue: 1.02, duration: 900, useNativeDriver: true }),
          Animated.timing(btnPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();

      loadOfferings();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(sheetAnim, { toValue: height, duration: 250, useNativeDriver: true }),
      ]).start();
      featureAnims.forEach((a) => a.setValue(0));
      badgeScale.setValue(0);
    }
  }, [visible]);

  const loadOfferings = async () => {
    setLoadingOfferings(true);
    try {
      const pkgs = await getOfferings();
      setPackages(pkgs);
    } catch {
      // RevenueCat not configured yet — show price from store listing
    } finally {
      setLoadingOfferings(false);
    }
  };

  const handleSubscribe = async () => {
    if (isPurchasing) return;
    setErrorMsg('');
    dispatch(setPurchasing(true));

    try {
      let customerInfo;
      if (packages.length > 0) {
        // Use the first available monthly package
        const monthly = packages.find((p) => p.packageType === 'MONTHLY') ?? packages[0];
        customerInfo = await purchasePackage(monthly);
      } else {
        throw new Error('No packages available');
      }

      const pro = await isPro(customerInfo);
      if (pro) {
        dispatch(setTier('pro'));
        const expDate = customerInfo.entitlements.active['pro']?.expirationDate ?? null;
        await updateSubscription({
          subscriptionTier: 'pro',
          revenueCatUserId: user?._id,
        });
        setSuccessMsg('Welcome to StuhDee Pro!');
        setTimeout(() => { onSuccess?.(); onClose(); }, 1600);
      } else {
        setErrorMsg('Purchase complete but entitlement not active. Try restoring.');
      }
    } catch (err: any) {
      if (err?.userCancelled) {
        // user cancelled — silent
      } else {
        setErrorMsg(err?.message || 'Purchase failed. Please try again.');
      }
    } finally {
      dispatch(setPurchasing(false));
    }
  };

  const handleRestore = async () => {
    if (isRestoring) return;
    setErrorMsg('');
    dispatch(setRestoring(true));

    try {
      const customerInfo = await restorePurchases();
      const pro = await isPro(customerInfo);
      if (pro) {
        dispatch(setTier('pro'));
        await updateSubscription({ subscriptionTier: 'pro', revenueCatUserId: user?._id });
        setSuccessMsg('Pro subscription restored!');
        setTimeout(() => { onSuccess?.(); onClose(); }, 1600);
      } else {
        setErrorMsg('No active subscription found on this account.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Restore failed. Please try again.');
    } finally {
      dispatch(setRestoring(false));
    }
  };

  const priceLabel = packages.length > 0
    ? (packages.find((p) => p.packageType === 'MONTHLY') ?? packages[0])?.product?.priceString ?? '$4.99'
    : '$4.99';

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}>
        {/* Close */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={22} color={colors.textMuted} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Pro badge */}
          <Animated.View style={[styles.badgeWrapper, { transform: [{ scale: badgeScale }] }]}>
            <View style={styles.proBadge}>
              <Ionicons name="flash" size={28} color={colors.background} />
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </Animated.View>

          <Text style={styles.headline}>Unlock StuhDee Pro</Text>
          <Text style={styles.subheadline}>
            Get unlimited decks and advanced analytics for {PRO_PRICE}.
          </Text>

          {/* Features list */}
          <View style={styles.featureList}>
            {PRO_FEATURES.map((feat, i) => (
              <Animated.View key={feat.label} style={[styles.featureRow, {
                opacity: featureAnims[i],
                transform: [{ translateX: featureAnims[i].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
              }]}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feat.icon as any} size={20} color={colors.primary} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureLabel}>{feat.label}</Text>
                  <Text style={styles.featureSub}>{feat.sub}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
              </Animated.View>
            ))}
          </View>

          {/* Price card */}
          <View style={styles.priceCard}>
            <View style={styles.priceLeft}>
              <Text style={styles.pricePlanName}>StuhDee Pro Monthly</Text>
              <Text style={styles.priceAmount}>{priceLabel}</Text>
              <Text style={styles.pricePeriod}>1 month · auto-renewing subscription</Text>
            </View>
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>MOST POPULAR</Text>
            </View>
          </View>

          {/* Success / Error messages */}
          {successMsg ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Subscribe CTA */}
          <Animated.View style={{ transform: [{ scale: btnPulse }] }}>
            <TouchableOpacity
              style={styles.subscribeBtn}
              onPress={handleSubscribe}
              disabled={isPurchasing || isRestoring || loadingOfferings}
              activeOpacity={0.88}
            >
              {isPurchasing ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <Ionicons name="flash" size={20} color={colors.background} />
                  <Text style={styles.subscribeBtnText}>Subscribe for {priceLabel}/mo</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Restore */}
          <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={isRestoring || isPurchasing}>
            {isRestoring ? (
              <ActivityIndicator color={colors.textMuted} size="small" />
            ) : (
              <Text style={styles.restoreBtnText}>Already subscribed? Restore purchases</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.legalText}>
            StuhDee Pro auto-renews monthly at $4.99/month. Cancel anytime in your App Store subscription settings.
            Payment is charged to your Apple ID account at confirmation of purchase.
          </Text>

          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.legalLinkSep}>·</Text>
            <TouchableOpacity onPress={() => Linking.openURL(TERMS_OF_USE_URL)}>
              <Text style={styles.legalLink}>Terms of Use</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const SHEET_BORDER = 28;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: SHEET_BORDER,
    borderTopRightRadius: SHEET_BORDER,
    maxHeight: height * 0.92,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    ...shadow.lg,
  },
  closeBtn: {
    position: 'absolute', top: spacing.md, right: spacing.md,
    zIndex: 10, width: 36, height: 36,
    backgroundColor: colors.surfaceElevated, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 8,
    paddingBottom: 40,
    alignItems: 'center',
  },
  badgeWrapper: { marginBottom: spacing.lg },
  proBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    ...shadow.md,
  },
  proBadgeText: { fontSize: 18, fontWeight: '900', color: colors.background, letterSpacing: 2 },
  headline: { ...typography.h1, textAlign: 'center', marginBottom: spacing.sm, fontSize: 28 },
  subheadline: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: spacing.xl },
  highlight: { color: colors.primary, fontWeight: '700' },
  featureList: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
    gap: 2,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  featureIcon: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureLabel: { ...typography.body, fontWeight: '600', fontSize: 15 },
  featureSub: { ...typography.small, fontSize: 12, marginTop: 1 },
  priceCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', backgroundColor: colors.primary + '18',
    borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1.5, borderColor: colors.primary + '50',
  },
  priceLeft: {},
  pricePlanName: { ...typography.small, color: colors.textSecondary, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  priceAmount: { ...typography.h2, color: colors.primary, fontSize: 30, fontWeight: '900' },
  pricePeriod: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  priceBadge: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  priceBadgeText: { fontSize: 10, fontWeight: '800', color: colors.background, letterSpacing: 1 },
  successBox: {
    width: '100%', backgroundColor: colors.success + '20',
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.success + '40',
  },
  successText: { ...typography.body, color: colors.success, textAlign: 'center', fontWeight: '600' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    width: '100%', backgroundColor: colors.error + '15',
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.error + '30',
  },
  errorText: { ...typography.small, color: colors.error, flex: 1 },
  subscribeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md + 6,
    paddingHorizontal: spacing.xxl,
    minWidth: width - spacing.lg * 4,
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadow.md,
  },
  subscribeBtnText: { fontSize: 17, fontWeight: '800', color: colors.background },
  restoreBtn: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  restoreBtnText: { ...typography.small, color: colors.textMuted, textDecorationLine: 'underline' },
  legalText: {
    ...typography.small, fontSize: 10,
    color: colors.textMuted, textAlign: 'center', lineHeight: 16,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  legalLinks: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingBottom: spacing.sm,
  },
  legalLink: {
    fontSize: 12, color: colors.primary, textDecorationLine: 'underline', fontWeight: '600',
  },
  legalLinkSep: {
    fontSize: 11, color: colors.textMuted,
  },
});
