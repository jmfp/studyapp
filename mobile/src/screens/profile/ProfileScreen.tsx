import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '../../theme';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { logout } from '../../store/authSlice';
import { resetSubscription } from '../../store/subscriptionSlice';
import { useGetTopicsQuery, useGetAnalyticsQuery } from '../../services/api';
import { api } from '../../services/api';
import PaywallModal from '../../components/PaywallModal';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const subscriptionTier = useAppSelector((s) => s.subscription.tier);
  const { data: topics } = useGetTopicsQuery();
  const { data: analytics } = useGetAnalyticsQuery({});
  const [showPaywall, setShowPaywall] = useState(false);

  const handleLogout = () => {
    dispatch(api.util.resetApiState());
    dispatch(resetSubscription());
    dispatch(logout());
  };

  const MenuItem = ({ icon, label, value, color = colors.primary }: { icon: string; label: string; value?: string; color?: string }) => (
    <View style={styles.menuItem}>
      <View style={[styles.menuIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      {value && <Text style={styles.menuValue}>{value}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarLetter}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{topics?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Topics</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{topics?.reduce((s, t) => s + t.cardCount, 0) ?? 0}</Text>
          <Text style={styles.statLabel}>Total Cards</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <View style={styles.statNumRow}>
            <Text style={styles.statNum}>{analytics?.streakDays ?? 0}</Text>
            <Ionicons name="flame" size={16} color={colors.warning} />
          </View>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Learning Stats</Text>
        <MenuItem icon="checkmark-circle-outline" label="Overall Accuracy" value={`${analytics?.overallAccuracy ?? 0}%`} color={colors.success} />
        <MenuItem icon="bar-chart-outline" label="Total Sessions" value={`${analytics?.totalSessions ?? 0}`} color={colors.primary} />
        <MenuItem icon="layers-outline" label="Cards Reviewed" value={`${analytics?.totalCardsReviewed ?? 0}`} color={colors.warning} />
        <MenuItem icon="flash-outline" label="Cards Due Today" value={`${analytics?.dueToday ?? 0}`} color={colors.accent} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        {subscriptionTier === 'pro' ? (
          <View style={styles.proRow}>
            <View style={styles.proBadge}>
              <Ionicons name="flash" size={16} color={colors.background} />
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
            <Text style={styles.proLabel}>FlashStudy Pro — Active</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.upgradeRow} onPress={() => setShowPaywall(true)} activeOpacity={0.85}>
            <View style={styles.upgradeLeft}>
              <Ionicons name="flash-outline" size={20} color={colors.primary} />
              <View>
                <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
                <Text style={styles.upgradeSub}>Unlimited decks · Advanced analytics</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
          <View style={[styles.menuIcon, { backgroundColor: colors.error + '20' }]}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
          </View>
          <Text style={[styles.menuLabel, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={() => setShowPaywall(false)}
      />

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', paddingTop: 80, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg },
  avatarContainer: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md, ...shadow.md,
    borderWidth: 3, borderColor: colors.primaryLight,
  },
  avatarLetter: { fontSize: 40, fontWeight: '700', color: colors.white },
  name: { ...typography.h2, marginBottom: 4 },
  email: { ...typography.bodyMuted },
  statsRow: {
    flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.lg,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNumRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statNum: { ...typography.h3 },
  statLabel: { ...typography.small, textAlign: 'center', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.border },
  section: {
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  sectionTitle: { ...typography.label, marginBottom: spacing.md },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  logoutItem: {},
  menuIcon: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { ...typography.body, flex: 1 },
  menuValue: { ...typography.body, color: colors.textSecondary },
  proRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  proBadgeText: { fontSize: 12, fontWeight: '900', color: colors.background, letterSpacing: 1 },
  proLabel: { ...typography.body, color: colors.accent, fontWeight: '600' },
  upgradeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.primary + '15', borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.primary + '40',
  },
  upgradeLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  upgradeTitle: { ...typography.body, fontWeight: '700', color: colors.white, fontSize: 15 },
  upgradeSub: { ...typography.small, color: colors.primary, fontSize: 12 },
});
