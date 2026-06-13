import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '../../theme';
import { useGetAnalyticsQuery, useGetTopicsQuery } from '../../services/api';

const QUALITY_COLORS = ['#FF1744', '#FF6D00', '#FF9800', '#FFD740', '#00BCD4', '#00E676'];
const QUALITY_LABELS = ['0-Blackout', '1-Wrong', '2-Saw it', '3-Hard', '4-Good', '5-Easy'];

export default function AnalyticsScreen() {
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(undefined);
  const { data: topics } = useGetTopicsQuery();
  const { data: analytics, isLoading } = useGetAnalyticsQuery({ topicId: selectedTopicId });

  const maxActivity = analytics ? Math.max(...analytics.dailyActivity.map((d) => d.cardsReviewed), 1) : 1;
  const maxForecast = analytics ? Math.max(...analytics.forecast.map((d) => d.dueCount), 1) : 1;
  const totalQuality = analytics?.qualityDistribution.reduce((s, q) => s + q.count, 0) || 1;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Spaced repetition insights</Text>
      </View>

      {/* Topic filter */}
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
          {/* ── Top stats row ── */}
          <View style={styles.topStats}>
            <View style={[styles.bigStat, { borderColor: colors.error + '40' }]}>
              <Text style={styles.bigStatEmoji}>🔥</Text>
              <Text style={[styles.bigStatVal, { color: colors.error }]}>{analytics.streakDays}</Text>
              <Text style={styles.bigStatLabel}>Day Streak</Text>
            </View>
            <View style={[styles.bigStat, { borderColor: colors.accent + '40' }]}>
              <Text style={styles.bigStatEmoji}>🎯</Text>
              <Text style={[styles.bigStatVal, { color: colors.accent }]}>{analytics.retentionRate}%</Text>
              <Text style={styles.bigStatLabel}>Retention</Text>
            </View>
            <View style={[styles.bigStat, { borderColor: colors.primary + '40' }]}>
              <Text style={styles.bigStatEmoji}>⚡</Text>
              <Text style={[styles.bigStatVal, { color: colors.primary }]}>{analytics.dueToday}</Text>
              <Text style={styles.bigStatLabel}>Due Today</Text>
            </View>
            <View style={[styles.bigStat, { borderColor: colors.warning + '40' }]}>
              <Text style={styles.bigStatEmoji}>💡</Text>
              <Text style={[styles.bigStatVal, { color: colors.warning }]}>{analytics.avgQuality}</Text>
              <Text style={styles.bigStatLabel}>Avg Quality</Text>
            </View>
          </View>

          {/* ── Card States (Anki-style) ── */}
          {analytics.cardStates && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Card States</Text>
              <Text style={styles.cardSub}>Based on spaced repetition schedule</Text>
              <View style={styles.statesRow}>
                <View style={styles.stateBox}>
                  <Text style={[styles.stateNum, { color: colors.primary }]}>{analytics.cardStates.new}</Text>
                  <Text style={styles.stateLabel}>New</Text>
                </View>
                <View style={styles.stateBox}>
                  <Text style={[styles.stateNum, { color: colors.warning }]}>{analytics.cardStates.young}</Text>
                  <Text style={styles.stateLabel}>Young</Text>
                  <Text style={styles.stateHint}>{'<21d interval'}</Text>
                </View>
                <View style={styles.stateBox}>
                  <Text style={[styles.stateNum, { color: colors.success }]}>{analytics.cardStates.mature}</Text>
                  <Text style={styles.stateLabel}>Mature</Text>
                  <Text style={styles.stateHint}>{'≥21d interval'}</Text>
                </View>
                <View style={styles.stateBox}>
                  <Text style={[styles.stateNum, { color: colors.textSecondary }]}>{analytics.cardStates.total}</Text>
                  <Text style={styles.stateLabel}>Total</Text>
                </View>
              </View>
              {/* Stacked progress bar */}
              <View style={styles.stateBar}>
                {analytics.cardStates.total > 0 && <>
                  <View style={[styles.stateBarSeg, { flex: analytics.cardStates.new, backgroundColor: colors.primary + '70' }]} />
                  <View style={[styles.stateBarSeg, { flex: analytics.cardStates.young, backgroundColor: colors.warning + '70' }]} />
                  <View style={[styles.stateBarSeg, { flex: analytics.cardStates.mature, backgroundColor: colors.success + '70' }]} />
                </>}
              </View>
            </View>
          )}

          {/* ── Quality Distribution ── */}
          {analytics.qualityDistribution && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recall Quality Distribution</Text>
              <Text style={styles.cardSub}>How you rated each card (0 = blackout, 5 = easy)</Text>
              {analytics.qualityDistribution.map((q) => {
                const pct = totalQuality > 0 ? (q.count / totalQuality) * 100 : 0;
                return (
                  <View key={q.quality} style={styles.qualityRow}>
                    <Text style={[styles.qualityNum, { color: QUALITY_COLORS[q.quality] }]}>{q.quality}</Text>
                    <Text style={styles.qualityLabel}>{QUALITY_LABELS[q.quality]}</Text>
                    <View style={styles.qualityBarTrack}>
                      <View style={[styles.qualityBarFill, { width: `${pct}%`, backgroundColor: QUALITY_COLORS[q.quality] }]} />
                    </View>
                    <Text style={styles.qualityCount}>{q.count}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── 7-Day Activity ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>7-Day Activity</Text>
            <View style={styles.weekChart}>
              {analytics.dailyActivity.map((day, i) => {
                const h = Math.max((day.cardsReviewed / maxActivity) * 88, 4);
                const isToday = i === 6;
                const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                return (
                  <View key={day.date} style={styles.dayCol}>
                    {day.cardsReviewed > 0 && <Text style={styles.dayNum}>{day.cardsReviewed}</Text>}
                    <View style={styles.dayBarTrack}>
                      <View style={[styles.dayBar, { height: h, backgroundColor: isToday ? colors.primary : colors.surfaceElevated }]} />
                    </View>
                    <Text style={[styles.dayLabel, isToday && { color: colors.primary, fontWeight: '700' }]}>
                      {dayLabels[new Date(day.date).getDay()]}
                    </Text>
                    {day.avgQuality > 0 && <Text style={styles.dayQuality}>q{day.avgQuality}</Text>}
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── 7-Day Forecast ── */}
          {analytics.forecast && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Review Forecast</Text>
              <Text style={styles.cardSub}>Cards due per day (next 7 days)</Text>
              <View style={styles.weekChart}>
                {analytics.forecast.map((day, i) => {
                  const h = Math.max((day.dueCount / maxForecast) * 80, 4);
                  const isToday = i === 0;
                  const d = new Date(day.date);
                  const label = isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
                  return (
                    <View key={day.date} style={styles.dayCol}>
                      {day.dueCount > 0 && <Text style={styles.dayNum}>{day.dueCount}</Text>}
                      <View style={styles.dayBarTrack}>
                        <View style={[styles.dayBar, {
                          height: h,
                          backgroundColor: isToday ? colors.accent + 'CC' : colors.primary + '50',
                        }]} />
                      </View>
                      <Text style={[styles.dayLabel, isToday && { color: colors.accent, fontWeight: '700' }]}>{label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Weak Cards ── */}
          {analytics.weakCards.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cards Needing Work</Text>
              <Text style={styles.cardSub}>Reviewed ≥3 times, lowest accuracy</Text>
              {analytics.weakCards.map((card) => (
                <View key={card._id} style={styles.weakRow}>
                  <View style={[styles.weakIcon, { backgroundColor: card.accuracy < 50 ? colors.error + '20' : colors.warning + '20' }]}>
                    <Ionicons name="alert-circle" size={16} color={card.accuracy < 50 ? colors.error : colors.warning} />
                  </View>
                  <View style={styles.weakInfo}>
                    <Text style={styles.weakQ} numberOfLines={1}>{card.question}</Text>
                    <Text style={styles.weakMeta}>EF {card.easeFactor} · {card.interval}d interval · q̄={card.avgQuality}</Text>
                  </View>
                  <Text style={[styles.weakAccuracy, { color: card.accuracy < 50 ? colors.error : colors.warning }]}>{card.accuracy}%</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Strong Cards ── */}
          {analytics.strongCards && analytics.strongCards.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Mastered Cards</Text>
              <Text style={styles.cardSub}>Mature cards with highest ease factor</Text>
              {analytics.strongCards.map((card) => (
                <View key={card._id} style={styles.weakRow}>
                  <View style={[styles.weakIcon, { backgroundColor: colors.success + '20' }]}>
                    <Ionicons name="star" size={16} color={colors.success} />
                  </View>
                  <View style={styles.weakInfo}>
                    <Text style={styles.weakQ} numberOfLines={1}>{card.question}</Text>
                    <Text style={styles.weakMeta}>EF {card.easeFactor} · {card.interval}d interval</Text>
                  </View>
                  <Text style={[styles.weakAccuracy, { color: colors.success }]}>{card.accuracy}%</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Recent Sessions ── */}
          {analytics.recentSessions.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent Sessions</Text>
              {analytics.recentSessions.map((s) => {
                const sc = s.score >= 70 ? colors.success : s.score >= 40 ? colors.warning : colors.error;
                return (
                  <View key={s._id} style={styles.sessionRow}>
                    <View style={[styles.sessionScore, { borderColor: sc }]}>
                      <Text style={[styles.sessionScoreTxt, { color: sc }]}>{s.score}%</Text>
                    </View>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionCards}>{s.totalCards} cards</Text>
                      <Text style={styles.sessionDate}>
                        {s.completedAt ? new Date(s.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </Text>
                    </View>
                    <View style={styles.sessionCounts}>
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
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.surface, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  filterEmoji: { fontSize: 14 },
  filterText: { fontSize: 13, color: colors.textSecondary },
  filterTextActive: { color: colors.primary, fontWeight: '600' },
  topStats: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.sm },
  bigStat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm, alignItems: 'center', borderWidth: 1 },
  bigStatEmoji: { fontSize: 18 },
  bigStatVal: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  bigStatLabel: { fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  card: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardTitle: { ...typography.h4, marginBottom: 2 },
  cardSub: { ...typography.small, fontSize: 11, marginBottom: spacing.md },
  statesRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  stateBox: { flex: 1, alignItems: 'center' },
  stateNum: { fontSize: 22, fontWeight: '800' },
  stateLabel: { ...typography.small, fontSize: 12 },
  stateHint: { fontSize: 9, color: colors.textMuted, textAlign: 'center' },
  stateBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.background },
  stateBarSeg: { height: '100%' },
  qualityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 5 },
  qualityNum: { fontSize: 15, fontWeight: '800', width: 18, textAlign: 'center' },
  qualityLabel: { ...typography.small, fontSize: 11, width: 80 },
  qualityBarTrack: { flex: 1, height: 8, backgroundColor: colors.background, borderRadius: 4, overflow: 'hidden' },
  qualityBarFill: { height: '100%', borderRadius: 4 },
  qualityCount: { ...typography.small, fontSize: 11, width: 28, textAlign: 'right' },
  weekChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  dayCol: { flex: 1, alignItems: 'center', gap: 3 },
  dayNum: { fontSize: 9, color: colors.textMuted },
  dayBarTrack: { height: 88, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  dayBar: { width: '65%', borderRadius: 4, minHeight: 4 },
  dayLabel: { ...typography.small, fontSize: 10 },
  dayQuality: { fontSize: 9, color: colors.textMuted },
  weakRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs + 1, borderBottomWidth: 1, borderBottomColor: colors.border },
  weakIcon: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  weakInfo: { flex: 1 },
  weakQ: { ...typography.body, fontSize: 13 },
  weakMeta: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  weakAccuracy: { fontSize: 14, fontWeight: '700' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  sessionScore: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  sessionScoreTxt: { fontSize: 13, fontWeight: '700' },
  sessionInfo: { flex: 1 },
  sessionCards: { ...typography.body, fontSize: 13 },
  sessionDate: { ...typography.small, fontSize: 11 },
  sessionCounts: { gap: 2 },
});
