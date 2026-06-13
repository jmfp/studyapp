import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { colors, spacing, radius, typography, shadow } from '../../theme';
import type { QuizStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<QuizStackParamList, 'QuizResult'>;
type Route = RouteProp<QuizStackParamList, 'QuizResult'>;

export default function QuizResultScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { score, correct, wrong, total, topicId } = route.params;

  const getGrade = () => {
    if (score >= 90) return { label: 'Excellent!', emoji: '🏆', color: colors.accent };
    if (score >= 70) return { label: 'Great Job!', emoji: '🌟', color: colors.success };
    if (score >= 50) return { label: 'Good Effort', emoji: '👍', color: colors.warning };
    return { label: 'Keep Practicing', emoji: '💪', color: colors.error };
  };

  const grade = getGrade();

  const circumference = 2 * Math.PI * 54;
  const strokeDash = (score / 100) * circumference;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.resultCard}>
        <Text style={styles.gradeEmoji}>{grade.emoji}</Text>
        <Text style={styles.gradeLabel}>{grade.label}</Text>

        <View style={styles.scoreContainer}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreNumber, { color: grade.color }]}>{score}%</Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { borderColor: colors.success + '40' }]}>
            <Ionicons name="checkmark-circle" size={28} color={colors.success} />
            <Text style={styles.statNum}>{correct}</Text>
            <Text style={styles.statTxt}>Correct</Text>
          </View>
          <View style={[styles.statBox, { borderColor: colors.error + '40' }]}>
            <Ionicons name="close-circle" size={28} color={colors.error} />
            <Text style={styles.statNum}>{wrong}</Text>
            <Text style={styles.statTxt}>Wrong</Text>
          </View>
          <View style={[styles.statBox, { borderColor: colors.primary + '40' }]}>
            <Ionicons name="layers" size={28} color={colors.primary} />
            <Text style={styles.statNum}>{total}</Text>
            <Text style={styles.statTxt}>Total</Text>
          </View>
        </View>

        <View style={styles.messageBox}>
          <Text style={styles.messageText}>
            {score >= 70
              ? 'Your spaced repetition schedule has been updated. Well done!'
              : 'Cards you got wrong will appear again sooner to help you master them.'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => navigation.replace('QuizSession', { topicId, topicTitle: '' })}
        >
          <Ionicons name="refresh" size={20} color={colors.white} />
          <Text style={styles.primaryActionText}>Study Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={() => navigation.navigate('QuizSelect')}
        >
          <Text style={styles.secondaryActionText}>Choose Topic</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: 80 },
  resultCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.xl, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, ...shadow.lg,
  },
  gradeEmoji: { fontSize: 64, marginBottom: spacing.sm },
  gradeLabel: { ...typography.h2, marginBottom: spacing.xl },
  scoreContainer: { marginBottom: spacing.xl },
  scoreCircle: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: colors.background, borderWidth: 6, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreNumber: { fontSize: 40, fontWeight: '800' },
  scoreLabel: { ...typography.small },
  statsGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, width: '100%' },
  statBox: {
    flex: 1, backgroundColor: colors.background, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', gap: spacing.xs,
    borderWidth: 1,
  },
  statNum: { ...typography.h3 },
  statTxt: { ...typography.small },
  messageBox: {
    backgroundColor: colors.background, borderRadius: radius.md,
    padding: spacing.md, width: '100%',
  },
  messageText: { ...typography.bodyMuted, textAlign: 'center', lineHeight: 22 },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  primaryAction: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: spacing.md + 2, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    ...shadow.md,
  },
  primaryActionText: { ...typography.h4, color: colors.white },
  secondaryAction: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.full,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  secondaryActionText: { ...typography.body, color: colors.textSecondary },
});
