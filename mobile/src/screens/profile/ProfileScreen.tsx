import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '../../theme';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { logout } from '../../store/authSlice';
import { useGetTopicsQuery, useGetAnalyticsQuery } from '../../services/api';
import { api } from '../../services/api';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { data: topics } = useGetTopicsQuery();
  const { data: analytics } = useGetAnalyticsQuery({});

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: () => {
          dispatch(api.util.resetApiState());
          dispatch(logout());
        },
      },
    ]);
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
          <Text style={styles.statNum}>{analytics?.streakDays ?? 0}🔥</Text>
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
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
          <View style={[styles.menuIcon, { backgroundColor: colors.error + '20' }]}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
          </View>
          <Text style={[styles.menuLabel, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

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
});
