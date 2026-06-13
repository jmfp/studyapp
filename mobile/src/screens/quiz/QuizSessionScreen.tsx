import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Animated, Alert, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { colors, spacing, radius, typography, shadow } from '../../theme';
import {
  useGetDueCardsQuery, useStartSessionMutation,
  useSubmitReviewMutation, useCompleteSessionMutation,
} from '../../services/api';
import type { QuizStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<QuizStackParamList, 'QuizSession'>;
type Route = RouteProp<QuizStackParamList, 'QuizSession'>;

const { width } = Dimensions.get('window');

export default function QuizSessionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { topicId, topicTitle } = route.params;

  const { data: dueCards, isLoading } = useGetDueCardsQuery(topicId);
  const [startSession] = useStartSessionMutation();
  const [submitReview] = useSubmitReviewMutation();
  const [completeSession] = useCompleteSessionMutation();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const flipAnim = useRef(new Animated.Value(0)).current;

  const frontInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  const flipCard = () => {
    if (!isFlipped) {
      Animated.spring(flipAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }).start();
      setIsFlipped(true);
    }
  };

  const startQuiz = async () => {
    try {
      const session = await startSession(topicId).unwrap();
      setSessionId(session._id);
      setIsStarted(true);
      setCardStartTime(Date.now());
    } catch {
      Alert.alert('Error', 'Failed to start quiz session');
    }
  };

  const handleResult = async (result: 'correct' | 'wrong') => {
    if (!sessionId || !dueCards || isSubmitting) return;
    const card = dueCards[currentIndex];
    const timeSpentMs = Date.now() - cardStartTime;
    setIsSubmitting(true);

    try {
      await submitReview({ sessionId, cardId: card._id, result, timeSpentMs }).unwrap();
      if (result === 'correct') setCorrect((c) => c + 1);
      else setWrong((w) => w + 1);

      const nextIndex = currentIndex + 1;
      if (nextIndex >= dueCards.length) {
        const session = await completeSession(sessionId).unwrap();
        navigation.replace('QuizResult', {
          sessionId: session._id,
          topicId,
          score: session.score,
          correct: session.correctCount,
          wrong: session.wrongCount,
          total: session.totalCards,
        });
      } else {
        flipAnim.setValue(0);
        setIsFlipped(false);
        setCurrentIndex(nextIndex);
        setCardStartTime(Date.now());
      }
    } catch {
      Alert.alert('Error', 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!dueCards || dueCards.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 64 }}>🎉</Text>
        <Text style={styles.noCardsTitle}>All caught up!</Text>
        <Text style={styles.noCardsSubtitle}>No cards due for review right now. Come back later!</Text>
        <TouchableOpacity style={styles.backBtn2} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isStarted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.startContent}>
          <View style={styles.startIconBg}>
            <Ionicons name="flash" size={48} color={colors.primary} />
          </View>
          <Text style={styles.startTitle}>Ready to study?</Text>
          <Text style={styles.startTopic}>{topicTitle}</Text>
          <View style={styles.startStats}>
            <View style={styles.startStat}>
              <Text style={styles.startStatValue}>{dueCards.length}</Text>
              <Text style={styles.startStatLabel}>Cards Due</Text>
            </View>
          </View>
          <Text style={styles.startHint}>Tap the card to see the answer, then mark if you got it right or wrong.</Text>
          <TouchableOpacity style={styles.startBtn} onPress={startQuiz}>
            <Text style={styles.startBtnText}>Start Quiz</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const card = dueCards[currentIndex];
  const progress = (currentIndex / dueCards.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          Alert.alert('Quit Quiz', 'Progress will be lost.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Quit', style: 'destructive', onPress: () => navigation.goBack() },
          ]);
        }} style={styles.headerBack}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{currentIndex + 1} / {dueCards.length}</Text>
        </View>
        <View style={styles.scoreRow}>
          <Text style={styles.correctCount}>✓ {correct}</Text>
          <Text style={styles.wrongCount}>✗ {wrong}</Text>
        </View>
      </View>

      <View style={styles.cardArea}>
        <TouchableOpacity onPress={flipCard} activeOpacity={0.9} style={styles.cardTouchable}>
          <Animated.View style={[styles.flashCard, styles.cardFront, { transform: [{ rotateY: frontInterpolate }] }]}>
            <Text style={styles.cardSideLabel}>QUESTION</Text>
            <Text style={styles.cardQuestion}>{card.question}</Text>
            <View style={styles.tapHintContainer}>
              <Ionicons name="hand-left-outline" size={16} color={colors.textMuted} />
              <Text style={styles.tapHintText}>Tap to reveal answer</Text>
            </View>
          </Animated.View>
          <Animated.View style={[styles.flashCard, styles.cardBack, { transform: [{ rotateY: backInterpolate }] }]}>
            <Text style={[styles.cardSideLabel, { color: colors.primaryLight }]}>ANSWER</Text>
            <Text style={styles.cardAnswer}>{card.answer}</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {isFlipped && (
        <View style={styles.resultArea}>
          <Text style={styles.resultQuestion}>Did you get it right?</Text>
          <View style={styles.resultButtons}>
            <TouchableOpacity
              style={[styles.resultBtn, styles.wrongBtn]}
              onPress={() => handleResult('wrong')}
              disabled={isSubmitting}
            >
              <Ionicons name="close-circle" size={28} color={colors.error} />
              <Text style={[styles.resultBtnText, { color: colors.error }]}>Nope</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resultBtn, styles.correctBtn]}
              onPress={() => handleResult('correct')}
              disabled={isSubmitting}
            >
              <Ionicons name="checkmark-circle" size={28} color={colors.success} />
              <Text style={[styles.resultBtnText, { color: colors.success }]}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  noCardsTitle: { ...typography.h2, marginTop: spacing.md },
  noCardsSubtitle: { ...typography.bodyMuted, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  backBtn2: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  backBtnText: { ...typography.h4, color: colors.white },
  header: {
    paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  headerBack: { alignSelf: 'flex-start', padding: spacing.xs, marginBottom: spacing.xs },
  progressContainer: { gap: spacing.xs },
  progressTrack: { height: 6, backgroundColor: colors.surface, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progressText: { ...typography.small, textAlign: 'center' },
  scoreRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl },
  correctCount: { color: colors.success, fontWeight: '700', fontSize: 15 },
  wrongCount: { color: colors.error, fontWeight: '700', fontSize: 15 },
  cardArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  cardTouchable: { width: '100%', aspectRatio: 0.75 },
  flashCard: {
    position: 'absolute', width: '100%', height: '100%',
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.xl, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
    backfaceVisibility: 'hidden',
    ...shadow.lg,
  },
  cardFront: {},
  cardBack: { borderColor: colors.primary + '50', backgroundColor: colors.surfaceElevated },
  cardSideLabel: { position: 'absolute', top: spacing.md, left: spacing.md, ...typography.label, fontSize: 11 },
  cardQuestion: { ...typography.h3, textAlign: 'center', lineHeight: 30, fontSize: 22 },
  cardAnswer: { ...typography.h3, textAlign: 'center', lineHeight: 30, fontSize: 22, color: colors.primaryLight },
  tapHintContainer: { position: 'absolute', bottom: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  tapHintText: { ...typography.small },
  resultArea: { paddingHorizontal: spacing.lg, paddingBottom: 50 },
  resultQuestion: { ...typography.h4, textAlign: 'center', marginBottom: spacing.md, color: colors.textSecondary },
  resultButtons: { flexDirection: 'row', gap: spacing.md },
  resultBtn: {
    flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.lg, borderRadius: radius.lg, gap: spacing.sm,
    borderWidth: 2,
  },
  wrongBtn: { backgroundColor: colors.error + '15', borderColor: colors.error + '40' },
  correctBtn: { backgroundColor: colors.success + '15', borderColor: colors.success + '40' },
  resultBtnText: { fontSize: 16, fontWeight: '700' },
  startContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  startIconBg: { width: 100, height: 100, borderRadius: radius.xl, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  startTitle: { ...typography.h2, marginBottom: spacing.xs },
  startTopic: { ...typography.bodyMuted, marginBottom: spacing.lg },
  startStats: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, width: '100%', alignItems: 'center', marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  startStat: { alignItems: 'center' },
  startStatValue: { ...typography.h1, color: colors.primary },
  startStatLabel: { ...typography.bodyMuted },
  startHint: { ...typography.bodyMuted, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 22 },
  startBtn: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md + 2, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, ...shadow.md },
  startBtnText: { ...typography.h4, color: colors.white },
});
