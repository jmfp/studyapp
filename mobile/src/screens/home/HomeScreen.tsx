import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '../../theme';
import { useGetTopicsQuery, useGetAnalyticsQuery } from '../../services/api';
import { useAppSelector } from '../../hooks/redux';

export default function HomeScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const { data: topics } = useGetTopicsQuery();
  const { data: analytics, isLoading } = useGetAnalyticsQuery({});

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const StatCard = ({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) => (
    <View style={[styles.statCard, { borderColor: color + '30' }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerSection}>
        <View>
          <Text style={styles.greetingText}>{greeting}</Text>
          <Text style={styles.userName}>{user?.name || 'Learner'}</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakCount}>{analytics?.streakDays ?? 0}</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatCard icon="flash-outline" label="Cards Due" value={analytics?.dueToday ?? 0} color={colors.primary} />
            <StatCard icon="checkmark-circle-outline" label="Accuracy" value={`${analytics?.overallAccuracy ?? 0}%`} color={colors.accent} />
            <StatCard icon="book-outline" label="Topics" value={topics?.length ?? 0} color={colors.warning} />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Weekly Progress</Text>
            </View>
            <View style={styles.barChartContainer}>
              {analytics?.dailyActivity.map((day, i) => {
                const maxCards = Math.max(...(analytics.dailyActivity.map((d) => d.cardsReviewed)), 1);
                const height = Math.max((day.cardsReviewed / maxCards) * 80, 4);
                const isToday = i === 6;
                return (
                  <View key={day.date} style={styles.barWrapper}>
                    <Text style={styles.barAccuracy}>
                      {day.cardsReviewed > 0 ? `${day.accuracy}%` : ''}
                    </Text>
                    <View style={[styles.bar, { height, backgroundColor: isToday ? colors.primary : colors.surfaceElevated, borderWidth: isToday ? 0 : 1, borderColor: colors.border }]} />
                    <Text style={[styles.barLabel, isToday && { color: colors.primary }]}>
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][new Date(day.date).getDay()]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {analytics && analytics.weakCards.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cards to Focus On</Text>
              {analytics.weakCards.map((card) => (
                <View key={card._id} style={styles.weakCard}>
                  <View style={styles.weakCardLeft}>
                    <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
                    <Text style={styles.weakCardQuestion} numberOfLines={1}>{card.question}</Text>
                  </View>
                  <View style={[styles.accuracyBadge, { backgroundColor: card.accuracy < 50 ? colors.error + '20' : colors.warning + '20' }]}>
                    <Text style={[styles.accuracyText, { color: card.accuracy < 50 ? colors.error : colors.warning }]}>
                      {card.accuracy}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {analytics?.recentSessions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="play-circle-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No sessions yet. Start studying!</Text>
              </View>
            ) : (
              analytics?.recentSessions.slice(0, 5).map((s) => (
                <View key={s._id} style={styles.sessionRow}>
                  <View style={[styles.scoreCircle, { borderColor: s.score >= 70 ? colors.success : s.score >= 40 ? colors.warning : colors.error }]}>
                    <Text style={[styles.scoreText, { color: s.score >= 70 ? colors.success : s.score >= 40 ? colors.warning : colors.error }]}>
                      {s.score}%
                    </Text>
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionCards}>{s.totalCards} cards reviewed</Text>
                    <Text style={styles.sessionDate}>
                      {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : ''}
                    </Text>
                  </View>
                  <View style={styles.sessionResults}>
                    <Text style={{ color: colors.success, fontSize: 13 }}>✓ {s.correctCount}</Text>
                    <Text style={{ color: colors.error, fontSize: 13 }}>✗ {s.wrongCount}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerSection: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.lg,
  },
  greetingText: { ...typography.bodyMuted, marginBottom: 2 },
  userName: { ...typography.h2 },
  streakBadge: {
    backgroundColor: colors.surface, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  streakEmoji: { fontSize: 18 },
  streakCount: { ...typography.h4, color: colors.accent },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', borderWidth: 1,
    ...shadow.sm,
  },
  statIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statValue: { ...typography.h3, marginBottom: 2 },
  statLabel: { ...typography.small, textAlign: 'center' },
  section: {
    marginHorizontal: spacing.lg, marginBottom: spacing.lg,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { ...typography.h4, marginBottom: spacing.md },
  barChartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120 },
  barWrapper: { flex: 1, alignItems: 'center', gap: 4 },
  barAccuracy: { fontSize: 9, color: colors.textMuted },
  bar: { width: '70%', borderRadius: 4, minHeight: 4 },
  barLabel: { ...typography.small, fontSize: 11 },
  weakCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  weakCardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  weakCardQuestion: { ...typography.body, flex: 1, fontSize: 14 },
  accuracyBadge: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  accuracyText: { fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { ...typography.bodyMuted, marginTop: spacing.sm },
  sessionRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  scoreCircle: {
    width: 48, height: 48, borderRadius: 24, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreText: { fontSize: 13, fontWeight: '700' },
  sessionInfo: { flex: 1 },
  sessionCards: { ...typography.body, fontSize: 14 },
  sessionDate: { ...typography.small, fontSize: 12 },
  sessionResults: { gap: 2 },
});
