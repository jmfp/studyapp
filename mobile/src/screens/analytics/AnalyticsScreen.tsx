import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { colors, spacing, radius, typography } from '../../theme';
import { useGetAnalyticsQuery, useGetTopicsQuery, useGenerateAnalyticsInsightsMutation } from '../../services/api';
import { TopicIcon } from '../../constants/topicIcons';
import CardImproveModal from '../../components/CardImproveModal';
import { PRO_PRICE } from '../../services/revenueCat';
import type { Card, MainTabParamList, AnalyticsInsightsResult } from '../../types';
import { weakCardToCard } from '../../utils/cardStats';
import { useAiProGate, isAiProRequiredError } from '../../hooks/useAiProGate';
import ProBadge from '../../components/ProBadge';
import { isTodayDateKey, weekdayShortFromDateKey } from '../../utils/localDate';
import { useScreenEntrance, useFocusReplayKey, useListItemEntrance } from '../../hooks/useEntranceAnimation';

const TAB_BAR_CLEARANCE = Platform.OS === 'ios' ? 96 : 80;

const QUALITY_COLORS = ['#FF1744', '#FF6D00', '#FF9800', '#FFD740', '#00BCD4', '#00E676'];
const QUALITY_LABELS = ['0-Blackout', '1-Wrong', '2-Saw it', '3-Hard', '4-Good', '5-Easy'];

function AnalyticsSessionRow({
  session, index, focusKey, scoreColor,
}: {
  session: { _id: string; score: number; totalCards: number; completedAt?: string; correctCount: number; wrongCount: number };
  index: number;
  focusKey: number;
  scoreColor: string;
}) {
  const rowStyle = useListItemEntrance(index, focusKey, 70, index % 2 === 0 ? 'rise' : 'slideLeft');
  return (
    <Animated.View style={[styles.sessionRow, rowStyle]}>
      <View style={[styles.sessionScore, { borderColor: scoreColor }]}>
        <Text style={[styles.sessionScoreTxt, { color: scoreColor }]}>{session.score}%</Text>
      </View>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionCards}>{session.totalCards} cards</Text>
        <Text style={styles.sessionDate}>
          {session.completedAt ? new Date(session.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
        </Text>
      </View>
      <View style={styles.sessionCounts}>
        <Text style={{ color: colors.success, fontSize: 12, fontWeight: '600' }}>✓{session.correctCount}</Text>
        <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>✗{session.wrongCount}</Text>
      </View>
    </Animated.View>
  );
}

export default function AnalyticsScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const insets = useSafeAreaInsets();
  const bottomPad = TAB_BAR_CLEARANCE + insets.bottom;
  const { isPro, requirePro } = useAiProGate();
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(undefined);
  const [showImproveModal, setShowImproveModal] = useState(false);
  const [improveCard, setImproveCard] = useState<Card | null>(null);
  const [improveTopicId, setImproveTopicId] = useState<string | null>(null);
  const { data: topics } = useGetTopicsQuery();
  const { data: analytics, isLoading } = useGetAnalyticsQuery({ topicId: selectedTopicId });
  const [generateInsights, { isLoading: insightsLoading, isError: insightsError }] = useGenerateAnalyticsInsightsMutation();
  const [insights, setInsights] = useState<AnalyticsInsightsResult | null>(null);

  useEffect(() => {
    setInsights(null);
  }, [selectedTopicId]);

  const maxActivity = analytics ? Math.max(...analytics.dailyActivity.map((d) => d.cardsReviewed), 1) : 1;
  const maxForecast = analytics ? Math.max(...analytics.forecast.map((d) => d.dueCount), 1) : 1;
  const totalQuality = analytics?.qualityDistribution.reduce((s, q) => s + q.count, 0) || 1;

  const selectTopicFilter = (topicId: string | undefined) => {
    if (topicId && !requirePro()) return;
    setSelectedTopicId(topicId);
  };

  const toggleTopicFilter = (topicId: string) => {
    const next = selectedTopicId === topicId ? undefined : topicId;
    selectTopicFilter(next);
  };

  const openWeakImprove = (weak: NonNullable<typeof analytics>['weakCards'][number]) => {
    if (!requirePro()) return;
    const card = weakCardToCard(weak);
    if (!card || !weak.topicId) return;
    setImproveCard(card);
    setImproveTopicId(weak.topicId);
    setShowImproveModal(true);
  };

  const startFocusedSession = () => {
    const topic = selectedTopicId
      ? topics?.find((t) => t._id === selectedTopicId)
      : topics?.[0];
    if (!topic) return;
    navigation.navigate('QuizTab', {
      screen: 'QuizSession',
      params: { topicId: topic._id, topicTitle: topic.title },
    });
  };

  const handleGenerateInsights = async () => {
    if (!requirePro()) return;
    try {
      const result = await generateInsights({ topicId: selectedTopicId }).unwrap();
      setInsights(result);
    } catch (err) {
      if (isAiProRequiredError(err)) {
        requirePro();
        return;
      }
      setInsights(null);
    }
  };

  const focusKey = useFocusReplayKey();
  const headerStyle = useScreenEntrance({ delay: 0, variant: 'drop' });
  const filterStyle = useScreenEntrance({ delay: 70, variant: 'slideRight' });
  const insightsStyle = useScreenEntrance({ delay: 140, variant: 'scale' });
  const statsStyle = useScreenEntrance({ delay: 220, variant: 'pop' });
  const activityStyle = useScreenEntrance({ delay: 300, variant: 'slideLeft' });
  const sessionsStyle = useScreenEntrance({ delay: 380, variant: 'fade' });
  const weakStyle = useScreenEntrance({ delay: 450, variant: 'slideRight' });
  const strongStyle = useScreenEntrance({ delay: 520, variant: 'rise' });
  const qualityStyle = useScreenEntrance({ delay: 590, variant: 'scale' });
  const forecastStyle = useScreenEntrance({ delay: 660, variant: 'drop' });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.header, headerStyle]}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Spaced repetition insights</Text>
      </Animated.View>

      <Animated.View style={filterStyle}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        <TouchableOpacity
          style={[styles.filterChip, !selectedTopicId && styles.filterChipActive]}
          onPress={() => selectTopicFilter(undefined)}
        >
          <Text style={[styles.filterText, !selectedTopicId && styles.filterTextActive]}>All Topics</Text>
        </TouchableOpacity>
        {topics?.map((t) => (
          <TouchableOpacity
            key={t._id}
            style={[styles.filterChip, selectedTopicId === t._id && styles.filterChipActive]}
            onPress={() => toggleTopicFilter(t._id)}
          >
            <TopicIcon emoji={t.emoji} size={14} color={selectedTopicId === t._id ? colors.white : t.color} />
            <Text style={[styles.filterText, selectedTopicId === t._id && styles.filterTextActive]}>{t.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </Animated.View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : !analytics ? null : (
        <>
          <Animated.View style={[styles.insightsCard, insightsStyle]}>
            <View style={styles.insightsHeader}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
              <Text style={styles.insightsTitle}>AI weekly insight</Text>
              <ProBadge compact />
            </View>
            {!insights && !insightsLoading && !insightsError && (
              <>
                <Text style={styles.insightsMuted}>
                  Requires StuhDee Pro subscription ({PRO_PRICE}/month). Get a personalized summary of your weak spots and what to study next.
                </Text>
                <TouchableOpacity
                  style={styles.generateInsightsBtn}
                  onPress={handleGenerateInsights}
                  disabled={insightsLoading}
                >
                  <Ionicons name="sparkles" size={16} color={colors.white} />
                  <Text style={styles.generateInsightsBtnText}>Generate insight</Text>
                </TouchableOpacity>
              </>
            )}
            {insightsLoading && (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
            )}
            {insightsError && !insightsLoading && (
              <>
                <Text style={styles.insightsMuted}>Could not generate insight — check your API key.</Text>
                <TouchableOpacity style={styles.generateInsightsBtn} onPress={handleGenerateInsights}>
                  <Ionicons name="refresh" size={16} color={colors.white} />
                  <Text style={styles.generateInsightsBtnText}>Try again</Text>
                </TouchableOpacity>
              </>
            )}
            {insights && !insightsLoading && (
              <>
                {insights.focusArea && (
                  <View style={styles.focusChip}>
                    <Text style={styles.focusChipText}>{insights.focusArea}</Text>
                  </View>
                )}
                <Text style={styles.insightsSummary}>{insights.summary}</Text>
                <Text style={styles.insightsRecommendation}>{insights.recommendation}</Text>
                <TouchableOpacity style={styles.insightsCta} onPress={startFocusedSession}>
                  <Ionicons name="play" size={16} color={colors.white} />
                  <Text style={styles.insightsCtaText}>Start focused session</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.regenerateBtn}
                  onPress={handleGenerateInsights}
                  disabled={insightsLoading}
                >
                  <Ionicons name="refresh" size={14} color={colors.primary} />
                  <Text style={styles.regenerateBtnText}>Regenerate</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>

          <Animated.View style={[styles.topStats, statsStyle]}>
            <View style={[styles.bigStat, { borderColor: colors.error + '40' }]}>
              <Ionicons name="flame" size={22} color={colors.error} style={styles.bigStatIcon} />
              <Text style={[styles.bigStatVal, { color: colors.error }]}>{analytics.streakDays}</Text>
              <Text style={styles.bigStatLabel}>Day Streak</Text>
            </View>
            <View style={[styles.bigStat, { borderColor: colors.accent + '40' }]}>
              <Ionicons name="locate" size={22} color={colors.accent} style={styles.bigStatIcon} />
              <Text style={[styles.bigStatVal, { color: colors.accent }]}>{analytics.retentionRate}%</Text>
              <Text style={styles.bigStatLabel}>Retention</Text>
            </View>
            <View style={[styles.bigStat, { borderColor: colors.primary + '40' }]}>
              <Ionicons name="flash" size={22} color={colors.primary} style={styles.bigStatIcon} />
              <Text style={[styles.bigStatVal, { color: colors.primary }]}>{analytics.dueToday}</Text>
              <Text style={styles.bigStatLabel}>Due Today</Text>
            </View>
            <View style={[styles.bigStat, { borderColor: colors.warning + '40' }]}>
              <Ionicons name="bulb" size={22} color={colors.warning} style={styles.bigStatIcon} />
              <Text style={[styles.bigStatVal, { color: colors.warning }]}>{analytics.avgQuality}</Text>
              <Text style={styles.bigStatLabel}>Avg Quality</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.card, activityStyle]}>
            <Text style={styles.cardTitle}>7-Day Activity</Text>
            <View style={styles.weekChart}>
              {analytics.dailyActivity.map((day) => {
                const h = Math.max((day.cardsReviewed / maxActivity) * 88, day.cardsReviewed > 0 ? 12 : 4);
                const isToday = isTodayDateKey(day.date);
                return (
                  <View key={day.date} style={styles.dayCol}>
                    {day.cardsReviewed > 0 && <Text style={styles.dayNum}>{day.cardsReviewed}</Text>}
                    <View style={styles.dayBarTrack}>
                      <View style={[styles.dayBar, {
                        height: h,
                        backgroundColor: isToday ? colors.primary : colors.primary + '55',
                      }]} />
                    </View>
                    <Text style={[styles.dayLabel, isToday && { color: colors.primary, fontWeight: '700' }]}>
                      {weekdayShortFromDateKey(day.date)}
                    </Text>
                    {day.avgQuality > 0 && <Text style={styles.dayQuality}>q{day.avgQuality}</Text>}
                  </View>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View style={[styles.card, sessionsStyle]}>
            <Text style={styles.cardTitle}>Recent Sessions</Text>
            {analytics.recentSessions.length === 0 ? (
              <View style={styles.emptySection}>
                <Ionicons name="play-circle-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptySectionText}>Study session history will show up here</Text>
              </View>
            ) : (
              analytics.recentSessions.map((s, i) => {
                const sc = s.score >= 70 ? colors.success : s.score >= 40 ? colors.warning : colors.error;
                return (
                  <AnalyticsSessionRow key={s._id} session={s} index={i} focusKey={focusKey} scoreColor={sc} />
                );
              })
            )}
          </Animated.View>

          <Animated.View style={[styles.card, weakStyle]}>
            <Text style={styles.cardTitle}>Cards Needing Work</Text>
            <Text style={styles.cardSub}>Reviewed ≥3 times, lowest accuracy</Text>
            {analytics.weakCards.length > 0 ? (
              analytics.weakCards.map((card) => (
                <View key={card._id} style={styles.weakRow}>
                  <View style={[styles.weakIcon, { backgroundColor: card.accuracy < 50 ? colors.error + '20' : colors.warning + '20' }]}>
                    <Ionicons name="alert-circle" size={16} color={card.accuracy < 50 ? colors.error : colors.warning} />
                  </View>
                  <View style={styles.weakInfo}>
                    <Text style={styles.weakQ} numberOfLines={1}>{card.question}</Text>
                    <Text style={styles.weakMeta}>EF {card.easeFactor} · {card.interval}d interval · q̄={card.avgQuality}</Text>
                  </View>
                  <Text style={[styles.weakAccuracy, { color: card.accuracy < 50 ? colors.error : colors.warning }]}>{card.accuracy}%</Text>
                  {card.topicId && (
                    <TouchableOpacity style={styles.improveChip} onPress={() => openWeakImprove(card)}>
                      <Ionicons name="sparkles" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptySection}>
                <Ionicons name="alert-circle-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptySectionText}>Cards reviewed 3+ times with low accuracy will appear here.</Text>
              </View>
            )}
          </Animated.View>

          <Animated.View style={[styles.card, strongStyle]}>
            <Text style={styles.cardTitle}>Mastered Cards</Text>
            <Text style={styles.cardSub}>Mature cards with highest ease factor</Text>
            {analytics.strongCards && analytics.strongCards.length > 0 ? (
              analytics.strongCards.map((card) => (
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
              ))
            ) : (
              <View style={styles.emptySection}>
                <Ionicons name="star-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptySectionText}>Mature cards with high ease factor will show up as you progress.</Text>
              </View>
            )}
          </Animated.View>

          {isPro ? (
            <>
              {analytics.cardStates && (
                <Animated.View style={[styles.card, qualityStyle]}>
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
                  <View style={styles.stateBar}>
                    {analytics.cardStates.total > 0 && (
                      <>
                        <View style={[styles.stateBarSeg, { flex: analytics.cardStates.new, backgroundColor: colors.primary + '70' }]} />
                        <View style={[styles.stateBarSeg, { flex: analytics.cardStates.young, backgroundColor: colors.warning + '70' }]} />
                        <View style={[styles.stateBarSeg, { flex: analytics.cardStates.mature, backgroundColor: colors.success + '70' }]} />
                      </>
                    )}
                  </View>
                </Animated.View>
              )}

              {analytics.qualityDistribution && (
                <Animated.View style={[styles.card, qualityStyle]}>
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
                </Animated.View>
              )}

              {analytics.forecast && (
                <Animated.View style={[styles.card, forecastStyle]}>
                  <Text style={styles.cardTitle}>Review Forecast</Text>
                  <Text style={styles.cardSub}>Cards due per day (next 7 days)</Text>
                  <View style={styles.weekChart}>
                    {analytics.forecast.map((day) => {
                      const h = Math.max((day.dueCount / maxForecast) * 80, day.dueCount > 0 ? 12 : 4);
                      const isToday = isTodayDateKey(day.date);
                      const label = isToday ? 'Today' : weekdayShortFromDateKey(day.date);
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
                </Animated.View>
              )}

            </>
          ) : (
            <View style={styles.proUpsell}>
              <View style={styles.proUpsellIcon}>
                <Ionicons name="bar-chart" size={28} color={colors.primary} />
              </View>
              <Text style={styles.proUpsellTitle}>Advanced analytics</Text>
              <Text style={styles.proUpsellSub}>
                Unlock review forecasts, recall quality breakdown, and card state tracking.
              </Text>
              <View style={styles.proUpsellList}>
                {['Review forecast', 'Recall quality', 'Card states'].map((item) => (
                  <View key={item} style={styles.proUpsellRow}>
                    <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
                    <Text style={styles.proUpsellItem}>{item}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={styles.proUpsellBtn} onPress={() => requirePro()} activeOpacity={0.85}>
                <Ionicons name="flash" size={18} color={colors.background} />
                <Text style={styles.proUpsellBtnText}>Upgrade to Pro · {PRO_PRICE}</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

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
  header: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.sm },
  title: { ...typography.h1 },
  subtitle: { ...typography.bodyMuted, marginTop: 4 },
  filterRow: { paddingVertical: spacing.sm },
  filterLockedRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border,
  },
  filterLockedText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  filterContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.surface, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  filterText: { fontSize: 13, color: colors.textSecondary },
  filterTextActive: { color: colors.primary, fontWeight: '600' },
  insightsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '35',
  },
  insightsHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  proBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  proBadgeText: { fontSize: 10, fontWeight: '900', color: colors.background, letterSpacing: 1 },
  insightsTitle: { ...typography.h4, color: colors.primary },
  insightsMuted: { ...typography.bodyMuted, fontSize: 13 },
  focusChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '18',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
  },
  focusChipText: { fontSize: 11, fontWeight: '700', color: colors.primary, textTransform: 'capitalize' },
  insightsSummary: { ...typography.body, fontSize: 14, lineHeight: 21, marginBottom: spacing.sm },
  insightsRecommendation: { ...typography.bodyMuted, fontSize: 13, lineHeight: 20, marginBottom: spacing.md },
  insightsCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: spacing.sm,
  },
  insightsCtaText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  generateInsightsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  generateInsightsBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  regenerateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: spacing.sm, paddingVertical: spacing.xs,
  },
  regenerateBtnText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  topStats: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.sm },
  bigStat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm, alignItems: 'center', borderWidth: 1 },
  bigStatIcon: { marginBottom: 4 },
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
  improveChip: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center',
  },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  sessionScore: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  sessionScoreTxt: { fontSize: 13, fontWeight: '700' },
  sessionInfo: { flex: 1 },
  sessionCards: { ...typography.body, fontSize: 13 },
  sessionDate: { ...typography.small, fontSize: 11 },
  sessionCounts: { gap: 2 },
  emptySection: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  emptySectionText: { ...typography.bodyMuted, textAlign: 'center', fontSize: 13 },
  lockedSection: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  lockedSectionText: { ...typography.bodyMuted, textAlign: 'center', fontSize: 13 },
  lockedSectionBtn: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  lockedSectionBtnText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  proUpsell: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    alignItems: 'center',
  },
  proUpsellIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  proUpsellTitle: { ...typography.h3, marginBottom: spacing.xs },
  proUpsellSub: { ...typography.bodyMuted, textAlign: 'center', marginBottom: spacing.md },
  proUpsellList: { alignSelf: 'stretch', gap: spacing.xs, marginBottom: spacing.lg },
  proUpsellRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  proUpsellItem: { ...typography.body, fontSize: 13, color: colors.textSecondary },
  proUpsellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  proUpsellBtnText: { color: colors.background, fontWeight: '700', fontSize: 15 },
});
