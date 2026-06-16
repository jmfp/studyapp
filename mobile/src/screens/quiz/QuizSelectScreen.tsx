import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, typography } from '../../theme';
import { useGetTopicsQuery, useGetDueCardsQuery } from '../../services/api';
import type { QuizStackParamList } from '../../types';
import { TopicIcon } from '../../constants/topicIcons';

type Nav = NativeStackNavigationProp<QuizStackParamList, 'QuizSelect'>;

function TopicQuizCard({ topic }: { topic: any }) {
  const navigation = useNavigation<Nav>();
  const { data: dueCards, isLoading } = useGetDueCardsQuery(topic._id);

  return (
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
  );
}

export default function QuizSelectScreen() {
  const { data: topics, isLoading } = useGetTopicsQuery();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Study</Text>
        <Text style={styles.subtitle}>Choose a topic to quiz yourself</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      ) : topics?.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No topics yet</Text>
          <Text style={styles.emptySubtitle}>Create a topic and add cards to start studying</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {topics?.map((topic) => <TopicQuizCard key={topic._id} topic={topic} />)}
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
  list: { paddingHorizontal: spacing.lg },
  topicCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  emoji: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { ...typography.h4 },
  cardSub: { ...typography.small, marginTop: 2 },
  badge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: colors.white, fontWeight: '700', fontSize: 13 },
});
