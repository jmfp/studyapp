import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '../../theme';
import { useGetAnalyticsQuery, useGetTopicsQuery } from '../../services/api';

export default function AnalyticsScreen() {
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(undefined);
  const { data: topics } = useGetTopicsQuery();
  const { data: analytics, isLoading } = useGetAnalyticsQuery({ topicId: selectedTopicId });

  const StatCard = ({ icon, label, value, color, sub }: { icon: string; label: string; value: string | number; color: string; sub?: string }) => (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );

  const maxActivity = analytics ? Math.max(...analytics.dailyActivity.map((d) => d.cardsReviewed), 1) : 1;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Track your learning progress</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        <TouchableOpacity
          style={[styles.filterChip, !selectedTopicId && styles.filterChipActive]}
          onPress={() => setSelectedTopicId(undefined)}
        >
          <Text style={[styles.filterText, !selectedTopicId && styles.filterTextActive]}>All Topics</Text>
        </TouchableOpacity>
        {topics?.map((t) => (
          <TouchableOpacity
            key={t._id}
            style={[styles.filterChip, selectedTopicId === t._id && styles.filterChipActive]}
            onPress={() => setSelectedTopicId(selectedTopicId === t._id ? undefined : t._id)}
          >
            <Text style={styles.filterEmoji}>{t.emoji}</Text>
            <Text style={[styles.filterText, selectedTopicId === t._id && styles.filterTextActive]}>{t.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : !analytics ? null : (
        <>
          <View style={styles.statsGrid}>
            <StatCard icon="flame" label="Day Streak" value={`${analytics.streakDays}🔥`} color={colors.error} />
            <StatCard icon="checkmark-circle" label="Accuracy" value={`${analytics.overallAccuracy}%`} color={colors.accent} />
            <StatCard icon="layers" label="Due Today" value={analytics.dueToday} color={colors.primary} />
            <StatCard icon="bar-chart" label="Sessions" value={analytics.totalSessions} color={colors.warning} />
          </View>

          <View style={styles.overviewCard}>
            <Text style={styles.cardTitle}>Overall Performance</Text>
            <View style={styles.overviewRow}>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewBig}>{analytics.totalCardsReviewed}</Text>
                <Text style={styles.overviewLabel}>Cards Reviewed</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewStat}>
                <Text style={[styles.overviewBig, { color: colors.success }]}>{analytics.totalCorrect}</Text>
                <Text style={styles.overviewLabel}>Correct</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewStat}>
                <Text style={[styles.overviewBig, { color: colors.error }]}>{analytics.totalWrong}</Text>
                <Text style={styles.overviewLabel}>Wrong</Text>
              </View>
            </View>

            <View style={styles.accuracyBar}>
              <View style={[styles.accuracyFill, {
                width: `${analytics.overallAccuracy}%`,
                backgroundColor: analytics.overallAccuracy >= 70 ? colors.success : analytics.overallAccuracy >= 40 ? colors.warning : colors.error,
              }]} />
            </View>
            <Text style={styles.accuracyLabel}>{analytics.overallAccuracy}% overall accuracy</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>7-Day Activity</Text>
            <View style={styles.weekChart}>
              {analytics.dailyActivity.map((day, i) => {
                const height = Math.max((day.cardsReviewed / maxActivity) * 100, 4);
                const isToday = i === 6;
                const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                const dayOfWeek = new Date(day.date).getDay();
                return (
                  <View key={day.date} style={styles.dayCol}>
                    {day.cardsReviewed > 0 && (
                      <Text style={styles.dayValue}>{day.cardsReviewed}</Text>
                    )}
                    <View style={styles.barContainer}>
                      <View style={[
                        styles.dayBar,
                        { height: height, backgroundColor: isToday ? colors.primary : colors.surfaceElevated },
                        isToday && { ...shadow.md },
                      ]} />
                    </View>
                    <Text style={[styles.dayLabel, isToday && { color: colors.primary, fontWeight: '700' }]}>
                      {dayLabels[dayOfWeek]}
                    </Text>
                    {day.accuracy > 0 && (
                      <Text style={styles.dayAccuracy}>{day.accuracy}%</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {analytics.weakCards.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.cardTitle}>Cards Needing Work</Text>
              {analytics.weakCards.map((card) => (
                <View key={card._id} style={styles.weakCardRow}>
                  <View style={[styles.weakIconBg, { backgroundColor: card.accuracy < 50 ? colors.error + '20' : colors.warning + '20' }]}>
                    <Ionicons name="alert-circle" size={18} color={card.accuracy < 50 ? colors.error : colors.warning} />
                  </View>
                  <View style={styles.weakCardInfo}>
                    <Text style={styles.weakCardQ} numberOfLines={1}>{card.question}</Text>
                    <Text style={styles.weakCardReviews}>Reviewed {card.timesReviewed}x</Text>
                  </View>
                  <View style={styles.weakAccuracyContainer}>
                    <Text style={[styles.weakAccuracy, { color: card.accuracy < 50 ? colors.error : colors.warning }]}>
                      {card.accuracy}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {analytics.recentSessions.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.cardTitle}>Recent Sessions</Text>
              {analytics.recentSessions.map((s) => {
                const scoreColor = s.score >= 70 ? colors.success : s.score >= 40 ? colors.warning : colors.error;
                return (
                  <View key={s._id} style={styles.sessionRow}>
                    <View style={[styles.sessionScore, { borderColor: scoreColor }]}>
                      <Text style={[styles.sessionScoreText, { color: scoreColor }]}>{s.score}%</Text>
                    </View>
                    <View style={styles.sessionDetails}>
                      <Text style={styles.sessionCards}>{s.totalCards} cards</Text>
                      <Text style={styles.sessionDate}>
                        {s.completedAt ? new Date(s.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </Text>
                    </View>
                    <View style={styles.sessionResults}>
                      <Text style={{ color: colors.success, fontSize: 12, fontWeight: '600' }}>✓{s.correctCount}</Text>
                      <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>✗{s.wrongCount}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.sm },
  title: { ...typography.h1 },
  subtitle: { ...typography.bodyMuted, marginTop: 4 },
  filterRow: { paddingVertical: spacing.sm },
  filterContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    backgroundColor: colors.surface, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  filterEmoji: { fontSize: 14 },
  filterText: { fontSize: 13, color: colors.textSecondary },
  filterTextActive: { color: colors.primary, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.sm },
  statCard: {
    width: '47.5%', backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  statIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  statValue: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  statLabel: { ...typography.small, textAlign: 'center' },
  statSub: { ...typography.small, fontSize: 11 },
  overviewCard: {
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  cardTitle: { ...typography.h4, marginBottom: spacing.md },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.md },
  overviewStat: { alignItems: 'center', flex: 1 },
  overviewBig: { ...typography.h2, fontSize: 28, fontWeight: '800' },
  overviewLabel: { ...typography.small },
  overviewDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: spacing.sm },
  accuracyBar: { height: 8, backgroundColor: colors.background, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  accuracyFill: { height: '100%', borderRadius: 4 },
  accuracyLabel: { ...typography.small, textAlign: 'center' },
  sectionCard: {
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  weekChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 150 },
  dayCol: { flex: 1, alignItems: 'center', gap: 4 },
  dayValue: { fontSize: 10, color: colors.textMuted },
  barContainer: { height: 100, justifyContent: 'flex-end' },
  dayBar: { width: 20, borderRadius: 4, minHeight: 4 },
  dayLabel: { ...typography.small, fontSize: 11 },
  dayAccuracy: { fontSize: 9, color: colors.textMuted },
  weakCardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  weakIconBg: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  weakCardInfo: { flex: 1 },
  weakCardQ: { ...typography.body, fontSize: 14 },
  weakCardReviews: { ...typography.small, fontSize: 11 },
  weakAccuracyContainer: {},
  weakAccuracy: { fontSize: 15, fontWeight: '700' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  sessionScore: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  sessionScoreText: { fontSize: 14, fontWeight: '700' },
  sessionDetails: { flex: 1 },
  sessionCards: { ...typography.body, fontSize: 14 },
  sessionDate: { ...typography.small, fontSize: 11 },
  sessionResults: { gap: 2 },
});
