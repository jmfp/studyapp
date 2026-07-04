import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, typography } from '../../theme';
import { useGetTopicsQuery, useGetDueCardsQuery } from '../../services/api';
import { useScreenEntrance, useFocusReplayKey, useListItemEntrance } from '../../hooks/useEntranceAnimation';
import type { QuizStackParamList } from '../../types';
import { TopicIcon } from '../../constants/topicIcons';

type Nav = NativeStackNavigationProp<QuizStackParamList, 'QuizSelect'>;

function TopicQuizCard({ topic, index, focusKey }: { topic: any; index: number; focusKey: number }) {
  const navigation = useNavigation<Nav>();
  const { data: dueCards, isLoading } = useGetDueCardsQuery(topic._id);
  const cardStyle = useListItemEntrance(index, focusKey, 80, index % 2 === 0 ? 'slideLeft' : 'rise');

  return (
    <Animated.View style={cardStyle}>
      <TouchableOpacity
        style={[styles.topicCard, { borderLeftColor: topic.color, borderLeftWidth: 4 }]}
        onPress={() => navigation.navigate('QuizSession', { topicId: topic._id, topicTitle: topic.title })}
        disabled={!dueCards || dueCards.length === 0}
      >
        <View style={[styles.emoji, { backgroundColor: topic.color + '20' }]}>
          <TopicIcon emoji={topic.emoji} size={24} color={topic.color} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{topic.title}</Text>
          <Text style={styles.cardSub}>
            {isLoading ? 'Loading...' : `${dueCards?.length || 0} cards due`}
          </Text>
        </View>
        {dueCards && dueCards.length > 0 ? (
          <View style={[styles.badge, { backgroundColor: topic.color }]}>
            <Text style={styles.badgeText}>{dueCards.length}</Text>
          </View>
        ) : (
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function QuizSelectScreen() {
  const { data: topics, isLoading } = useGetTopicsQuery();
  const focusKey = useFocusReplayKey();
  const headerStyle = useScreenEntrance({ delay: 0, variant: 'drop' });
  const emptyStyle = useScreenEntrance({ delay: 120, variant: 'fade' });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Text style={styles.title}>Study</Text>
        <Text style={styles.subtitle}>Choose a topic to quiz yourself</Text>
      </Animated.View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      ) : topics?.length === 0 ? (
        <Animated.View style={[styles.emptyState, emptyStyle]}>
          <Ionicons name="book-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Nothing to review</Text>
          <Text style={styles.emptySubtitle}>Create a deck and add some cards first</Text>
        </Animated.View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {topics?.map((topic, i) => (
            <TopicQuizCard key={topic._id} topic={topic} index={i} focusKey={focusKey} />
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.lg },
  title: { ...typography.h1 },
  subtitle: { ...typography.bodyMuted, marginTop: 4 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  emptyTitle: { ...typography.h3, marginTop: spacing.md },
  emptySubtitle: { ...typography.bodyMuted, textAlign: 'center', marginTop: spacing.sm },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  topicCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.md, gap: spacing.md,
  },
  emoji: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { ...typography.h4 },
  cardSub: { ...typography.bodyMuted, marginTop: 2 },
  badge: { minWidth: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: colors.white, fontWeight: '700', fontSize: 13 },
});
