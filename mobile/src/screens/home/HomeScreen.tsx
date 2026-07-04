import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Animated, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '../../theme';
import { useGetTopicsQuery, useGetAnalyticsQuery } from '../../services/api';
import { useAppSelector } from '../../hooks/redux';
import { useScreenEntrance, useFocusReplayKey, useListItemEntrance } from '../../hooks/useEntranceAnimation';
import type { Card, DailyActivity, ReviewSession } from '../../types';
import CardImproveModal from '../../components/CardImproveModal';
import { weakCardToCard } from '../../utils/cardStats';
import { useAiProGate } from '../../hooks/useAiProGate';
import { isTodayDateKey, weekdayLetterFromDateKey } from '../../utils/localDate';

function StatCard({
  icon, label, value, color, style,
}: { icon: string; label: string; value: string | number; color: string; style: object }) {
  return (
    <Animated.View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 2 }, style]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function ActivityBar({ day, maxCards, focusKey }: { day: DailyActivity; maxCards: number; focusKey: number }) {
  const heightPct = maxCards > 0 ? day.cardsReviewed / maxCards : 0;
  const isToday = isTodayDateKey(day.date);
  const barHeight = useRef(new Animated.Value(0)).current;
  const hasActivity = day.cardsReviewed > 0;

  useEffect(() => {
    barHeight.setValue(0);
    const target = hasActivity ? Math.max(heightPct * 90, 12) : 0;
    Animated.spring(barHeight, {
      toValue: target,
      tension: 50, friction: 7, delay: 400, useNativeDriver: false,
    }).start();
  }, [barHeight, heightPct, hasActivity, focusKey]);

  return (
    <View style={styles.barWrapper}>
      {hasActivity && (
        <Text style={styles.barValue}>{day.cardsReviewed}</Text>
      )}
      <View style={styles.barTrack}>
        <Animated.View style={[styles.bar, {
          height: barHeight,
          backgroundColor: isToday ? colors.primary : colors.primary + '55',
          borderWidth: isToday ? 0 : 1,
          borderColor: colors.primary + '40',
        }]} />
      </View>
      <Text style={[styles.barLabel, isToday && { color: colors.primary, fontWeight: '700' }]}>
        {weekdayLetterFromDateKey(day.date)}
      </Text>
    </View>
  );
}

function SessionRow({ session, index, focusKey }: { session: ReviewSession; index: number; focusKey: number }) {
  const scoreColor = session.score >= 70 ? colors.success : session.score >= 40 ? colors.warning : colors.error;
  const rowStyle = useListItemEntrance(index + 4, focusKey, 90, index % 2 === 0 ? 'slideRight' : 'rise');

  return (
    <Animated.View style={[styles.sessionRow, rowStyle]}>
      <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
        <Text style={[styles.scoreText, { color: scoreColor }]}>{session.score}%</Text>
      </View>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionCards}>{session.totalCards} cards reviewed</Text>
        <Text style={styles.sessionDate}>
          {session.completedAt ? new Date(session.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
        </Text>
      </View>
      <View style={styles.sessionResults}>
        <Text style={{ color: colors.success, fontSize: 12, fontWeight: '600' }}>✓ {session.correctCount}</Text>
        <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>✗ {session.wrongCount}</Text>
      </View>
    </Animated.View>
  );
}

function WeakCardRow({
  card, index, focusKey, onImprove,
}: {
  card: { _id: string; question: string; accuracy: number; topicId?: string };
  index: number;
  focusKey: number;
  onImprove: () => void;
}) {
  const rowStyle = useListItemEntrance(index, focusKey, 60, 'slideLeft');
  return (
    <Animated.View style={[styles.weakCard, rowStyle]}>
      <View style={styles.weakCardLeft}>
        <Ionicons name="alert-circle-outline" size={17} color={colors.error} />
        <Text style={styles.weakCardQuestion} numberOfLines={1}>{card.question}</Text>
      </View>
      <View style={styles.weakCardRight}>
        <View style={[styles.accuracyBadge, { backgroundColor: card.accuracy < 50 ? colors.error + '20' : colors.warning + '20' }]}>
          <Text style={[styles.accuracyText, { color: card.accuracy < 50 ? colors.error : colors.warning }]}>
            {card.accuracy}%
          </Text>
        </View>
        {card.topicId && (
          <TouchableOpacity style={styles.improveChip} onPress={onImprove}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const { data: topics } = useGetTopicsQuery();
  const { data: analytics, isLoading } = useGetAnalyticsQuery({});
  const [improveCard, setImproveCard] = useState<Card | null>(null);
  const [improveTopicId, setImproveTopicId] = useState<string | null>(null);
  const [showImproveModal, setShowImproveModal] = useState(false);
  const { requirePro } = useAiProGate();

  const openWeakImprove = (weak: NonNullable<typeof analytics>['weakCards'][number]) => {
    if (!requirePro()) return;
    const card = weakCardToCard(weak);
    if (!card || !weak.topicId) return;
    setImproveCard(card);
    setImproveTopicId(weak.topicId);
    setShowImproveModal(true);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const focusKey = useFocusReplayKey();
  const headerStyle = useScreenEntrance({ delay: 0, variant: 'slideRight' });
  const stat1Style = useScreenEntrance({ delay: 90, variant: 'pop' });
  const stat2Style = useScreenEntrance({ delay: 160, variant: 'rise' });
  const stat3Style = useScreenEntrance({ delay: 230, variant: 'slideLeft' });
  const chartStyle = useScreenEntrance({ delay: 310, variant: 'scale' });
  const weakStyle = useScreenEntrance({ delay: 390, variant: 'fade' });
  const sessionStyle = useScreenEntrance({ delay: 460, variant: 'drop' });

  const streakPulse = useRef(new Animated.Value(1)).current;
  const idleScale = useRef(new Animated.Value(1)).current;
  const hasStreak = (analytics?.streakDays ?? 0) > 0;

  useEffect(() => {
    if (!hasStreak) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(streakPulse, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(streakPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [hasStreak, streakPulse]);

  const maxCards = Math.max(...(analytics?.dailyActivity.map((d) => d.cardsReviewed) ?? [1]), 1);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.headerSection, headerStyle]}>
        <View>
          <Text style={styles.greetingText}>{greeting}</Text>
          <Text style={styles.userName}>{user?.name || 'Learner'}</Text>
        </View>
        <Animated.View style={[styles.streakBadge, { transform: [{ scale: hasStreak ? streakPulse : idleScale }] }]}>
          <Ionicons name="flame" size={18} color={colors.warning} />
          <Text style={styles.streakCount}>{analytics?.streakDays ?? 0}</Text>
        </Animated.View>
      </Animated.View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatCard icon="flash-outline" label="Due Today" value={analytics?.dueToday ?? 0} color={colors.primary} style={stat1Style} />
            <StatCard icon="checkmark-circle-outline" label="Accuracy" value={`${analytics?.overallAccuracy ?? 0}%`} color={colors.accent} style={stat2Style} />
            <StatCard icon="book-outline" label="Topics" value={topics?.length ?? 0} color={colors.warning} style={stat3Style} />
          </View>

          <Animated.View style={[styles.section, chartStyle]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Weekly Activity</Text>
              <Text style={styles.sectionSub}>cards reviewed per day</Text>
            </View>
            <View style={styles.barChartContainer}>
              {analytics?.dailyActivity.map((day) => (
                <ActivityBar key={day.date} day={day} maxCards={maxCards} focusKey={focusKey} />
              ))}
            </View>
          </Animated.View>

          {analytics && analytics.weakCards.length > 0 && (
            <Animated.View style={[styles.section, weakStyle]}>
              <Text style={styles.sectionTitle}>Focus On These</Text>
              {analytics.weakCards.map((card, i) => (
                <WeakCardRow
                  key={card._id}
                  card={card}
                  index={i}
                  focusKey={focusKey}
                  onImprove={() => openWeakImprove(card)}
                />
              ))}
            </Animated.View>
          )}

          <Animated.View style={[styles.section, sessionStyle]}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {analytics?.recentSessions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="play-circle-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>No study sessions yet</Text>
              </View>
            ) : (
              analytics?.recentSessions.slice(0, 5).map((s, i) => (
                <SessionRow key={s._id} session={s} index={i} focusKey={focusKey} />
              ))
            )}
          </Animated.View>
        </>
      )}
      <View style={{ height: 100 }} />

      {improveTopicId && (
        <CardImproveModal
          visible={showImproveModal}
          topicId={improveTopicId}
          card={improveCard}
          trigger="weak_card"
          onRequirePro={requirePro}
          onClose={() => {
            setShowImproveModal(false);
            setImproveCard(null);
            setImproveTopicId(null);
          }}
        />
      )}

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
  streakCount: { ...typography.h4, color: colors.accent },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    ...shadow.sm,
  },
  statIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  statValue: { ...typography.h3, marginBottom: 2 },
  statLabel: { ...typography.small, textAlign: 'center', fontSize: 11 },
  section: {
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { ...typography.h4, marginBottom: spacing.sm },
  sectionSub: { ...typography.small, fontSize: 11 },
  barChartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  barWrapper: { flex: 1, alignItems: 'center', gap: 4 },
  barValue: { fontSize: 9, color: colors.textMuted },
  barTrack: { height: 90, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  bar: { width: '65%', borderRadius: 4 },
  barLabel: { ...typography.small, fontSize: 11 },
  weakCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  weakCardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  weakCardRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  weakCardQuestion: { ...typography.body, flex: 1, fontSize: 14 },
  improveChip: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center',
  },
  accuracyBadge: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  accuracyText: { fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  emptyText: { ...typography.bodyMuted },
  sessionRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  scoreCircle: {
    width: 46, height: 46, borderRadius: 23, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreText: { fontSize: 12, fontWeight: '700' },
  sessionInfo: { flex: 1 },
  sessionCards: { ...typography.body, fontSize: 14 },
  sessionDate: { ...typography.small, fontSize: 12 },
  sessionResults: { gap: 2 },
});
