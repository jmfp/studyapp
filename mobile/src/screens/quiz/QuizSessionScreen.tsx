import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Animated, Alert, Dimensions, PanResponder, Vibration,
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

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.lg * 2;
const SWIPE_THRESHOLD = width * 0.3;

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
  const [resultOverlay, setResultOverlay] = useState<'correct' | 'wrong' | null>(null);

  // Animations
  const flipAnim = useRef(new Animated.Value(0)).current;
  const cardEntrance = useRef(new Animated.Value(0)).current;
  const cardTranslateX = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(0)).current;
  const cardRotation = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const correctBtnScale = useRef(new Animated.Value(1)).current;
  const wrongBtnScale = useRef(new Animated.Value(1)).current;
  const resultOverlayOpacity = useRef(new Animated.Value(0)).current;
  const resultOverlayScale = useRef(new Animated.Value(0.5)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const startScreenAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(startScreenAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
  }, []);

  const animateCardEntrance = useCallback(() => {
    cardEntrance.setValue(0);
    cardTranslateX.setValue(0);
    cardTranslateY.setValue(80);
    cardOpacity.setValue(0);
    cardScale.setValue(0.9);
    flipAnim.setValue(0);

    Animated.parallel([
      Animated.spring(cardEntrance, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
      Animated.spring(cardTranslateY, { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [cardEntrance, cardTranslateX, cardTranslateY, cardScale, cardOpacity, flipAnim]);

  const animateProgressBar = useCallback((index: number, total: number) => {
    Animated.spring(progressWidth, {
      toValue: total > 0 ? (index / total) * 100 : 0,
      tension: 40, friction: 8, useNativeDriver: false,
    }).start();
  }, [progressWidth]);

  useEffect(() => {
    if (isStarted && dueCards) {
      animateCardEntrance();
      animateProgressBar(currentIndex, dueCards.length);

      Animated.spring(headerAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
    }
  }, [isStarted, currentIndex]);

  const flipCard = () => {
    if (isFlipped || isSubmitting) return;
    Animated.spring(flipAnim, {
      toValue: 1, tension: 50, friction: 6, useNativeDriver: true,
    }).start(() => {
      setIsFlipped(true);
      // Buttons slide up
      buttonsAnim.setValue(0);
      Animated.spring(buttonsAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }).start();
    });
  };

  const shakeCard = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const showResultOverlay = (result: 'correct' | 'wrong') => {
    setResultOverlay(result);
    resultOverlayOpacity.setValue(0);
    resultOverlayScale.setValue(0.4);
    Animated.parallel([
      Animated.spring(resultOverlayScale, { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
      Animated.timing(resultOverlayOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const exitCard = (direction: 'left' | 'right', callback: () => void) => {
    const xTarget = direction === 'right' ? width * 1.2 : -width * 1.2;
    const rotation = direction === 'right' ? 20 : -20;
    Animated.parallel([
      Animated.timing(cardTranslateX, { toValue: xTarget, duration: 350, useNativeDriver: true }),
      Animated.timing(cardRotation, { toValue: rotation, duration: 350, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(cardScale, { toValue: 0.85, duration: 300, useNativeDriver: true }),
    ]).start(callback);
  };

  const pulseBtnPress = (anim: Animated.Value, callback: () => void) => {
    Animated.sequence([
      Animated.spring(anim, { toValue: 0.88, tension: 200, friction: 5, useNativeDriver: true }),
      Animated.spring(anim, { toValue: 1, tension: 200, friction: 5, useNativeDriver: true }),
    ]).start(callback);
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

    const btnAnim = result === 'correct' ? correctBtnScale : wrongBtnScale;
    pulseBtnPress(btnAnim, () => {});

    if (result === 'wrong') {
      Vibration.vibrate(80);
      shakeCard();
    }

    showResultOverlay(result);
    if (result === 'correct') setCorrect((c) => c + 1);
    else setWrong((w) => w + 1);

    // Short pause to show overlay, then exit card
    setTimeout(() => {
      exitCard(result === 'correct' ? 'right' : 'left', async () => {
        setResultOverlay(null);
        try {
          await submitReview({ sessionId, cardId: card._id, result, timeSpentMs }).unwrap();
          const nextIndex = currentIndex + 1;
          if (nextIndex >= dueCards.length) {
            const session = await completeSession(sessionId).unwrap();
            navigation.replace('QuizResult', {
              sessionId: session._id, topicId,
              score: session.score, correct: session.correctCount,
              wrong: session.wrongCount, total: session.totalCards,
            });
          } else {
            setIsFlipped(false);
            setCurrentIndex(nextIndex);
            setCardStartTime(Date.now());
            cardRotation.setValue(0);
          }
        } catch {
          Alert.alert('Error', 'Failed to submit review');
        } finally {
          setIsSubmitting(false);
        }
      });
    }, 400);
  };

  // Pan responder for swipe gesture on flipped card
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        cardTranslateX.setValue(gesture.dx);
        cardRotation.setValue(gesture.dx / 15);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          handleResult('correct');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          handleResult('wrong');
        } else {
          Animated.parallel([
            Animated.spring(cardTranslateX, { toValue: 0, tension: 80, friction: 7, useNativeDriver: true }),
            Animated.spring(cardRotation, { toValue: 0, tension: 80, friction: 7, useNativeDriver: true }),
          ]).start();
        }
      },
    })
  ).current;

  // Derived animation values
  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const cardRotateDeg = cardRotation.interpolate({ inputRange: [-30, 0, 30], outputRange: ['-30deg', '0deg', '30deg'] });
  const swipeCorrectOpacity = cardTranslateX.interpolate({ inputRange: [20, 80], outputRange: [0, 1], extrapolate: 'clamp' });
  const swipeWrongOpacity = cardTranslateX.interpolate({ inputRange: [-80, -20], outputRange: [1, 0], extrapolate: 'clamp' });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  if (!dueCards || dueCards.length === 0) {
    return (
      <View style={styles.center}>
        <Animated.View style={{ transform: [{ scale: startScreenAnim }] }}>
          <Text style={{ fontSize: 72, textAlign: 'center' }}>🎉</Text>
          <Text style={styles.noCardsTitle}>All caught up!</Text>
          <Text style={styles.noCardsSubtitle}>No cards due. Come back later!</Text>
          <TouchableOpacity style={styles.backBtn2} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </Animated.View>
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
        <Animated.View style={[styles.startContent, {
          opacity: startScreenAnim,
          transform: [{ translateY: startScreenAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
        }]}>
          <View style={styles.startIconBg}>
            <Ionicons name="flash" size={52} color={colors.primary} />
          </View>
          <Text style={styles.startTitle}>Ready to study?</Text>
          <Text style={styles.startTopic}>{topicTitle}</Text>

          <View style={styles.startStatsBox}>
            <Text style={styles.startStatNum}>{dueCards.length}</Text>
            <Text style={styles.startStatLabel}>Cards Due</Text>
          </View>

          <Text style={styles.startHint}>
            Tap the card to flip it.{'\n'}Swipe right ✓ or left ✗ — or use the buttons.
          </Text>

          <TouchableOpacity style={styles.startBtn} onPress={startQuiz} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>Begin</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  const card = dueCards[currentIndex];

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
      }]}>
        <TouchableOpacity onPress={() => {
          Alert.alert('Quit Quiz', 'Progress will be saved for answered cards.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Quit', style: 'destructive', onPress: () => navigation.goBack() },
          ]);
        }} style={styles.headerBack}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, {
              width: progressWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
            }]} />
          </View>
          <Text style={styles.progressText}>{currentIndex + 1} / {dueCards.length}</Text>
        </View>

        <View style={styles.scoreRow}>
          <Animated.View style={[styles.scorePill, styles.correctPill]}>
            <Text style={styles.correctCount}>✓ {correct}</Text>
          </Animated.View>
          <Animated.View style={[styles.scorePill, styles.wrongPill]}>
            <Text style={styles.wrongCount}>✗ {wrong}</Text>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Card */}
      <View style={styles.cardArea}>
        <Animated.View
          style={[styles.cardWrapper, {
            opacity: cardOpacity,
            transform: [
              { translateX: Animated.add(cardTranslateX, shakeAnim) },
              { translateY: cardTranslateY },
              { rotate: cardRotateDeg },
              { scale: cardScale },
            ],
          }]}
          {...(isFlipped ? panResponder.panHandlers : {})}
        >
          {/* Swipe indicators */}
          <Animated.View style={[styles.swipeIndicator, styles.swipeCorrect, { opacity: swipeCorrectOpacity }]}>
            <Text style={styles.swipeIndicatorText}>✓ GOT IT</Text>
          </Animated.View>
          <Animated.View style={[styles.swipeIndicator, styles.swipeWrong, { opacity: swipeWrongOpacity }]}>
            <Text style={styles.swipeIndicatorText}>✗ NOPE</Text>
          </Animated.View>

          {/* Front */}
          <Animated.View style={[styles.flashCard, styles.cardFront, { transform: [{ rotateY: frontRotate }] }]}>
            <TouchableOpacity style={styles.cardInner} onPress={flipCard} activeOpacity={0.95}>
              <View style={styles.cardTopRow}>
                <View style={styles.cardSideTag}>
                  <Text style={styles.cardSideText}>QUESTION</Text>
                </View>
                <Text style={styles.cardNumber}>{currentIndex + 1}</Text>
              </View>
              <Text style={styles.cardQuestion}>{card.question}</Text>
              <View style={styles.tapHintRow}>
                <Ionicons name="hand-left-outline" size={14} color={colors.textMuted} />
                <Text style={styles.tapHintText}>Tap to flip</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Back */}
          <Animated.View style={[styles.flashCard, styles.cardBack, { transform: [{ rotateY: backRotate }] }]}>
            <View style={styles.cardInner}>
              <View style={styles.cardTopRow}>
                <View style={[styles.cardSideTag, { backgroundColor: colors.primary + '30' }]}>
                  <Text style={[styles.cardSideText, { color: colors.primaryLight }]}>ANSWER</Text>
                </View>
                <Text style={styles.swipeHint}>swipe or tap below</Text>
              </View>
              <Text style={styles.cardAnswer}>{card.answer}</Text>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Result overlay icon */}
        {resultOverlay && (
          <Animated.View style={[styles.resultOverlayContainer, {
            opacity: resultOverlayOpacity,
            transform: [{ scale: resultOverlayScale }],
          }]}>
            <View style={[styles.resultOverlayBubble, {
              backgroundColor: resultOverlay === 'correct' ? colors.success + '30' : colors.error + '30',
              borderColor: resultOverlay === 'correct' ? colors.success : colors.error,
            }]}>
              <Text style={styles.resultOverlayEmoji}>
                {resultOverlay === 'correct' ? '✓' : '✗'}
              </Text>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Action Buttons */}
      <Animated.View style={[styles.resultArea, {
        opacity: buttonsAnim,
        transform: [{ translateY: buttonsAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
      }]}>
        {isFlipped ? (
          <>
            <Text style={styles.resultQuestion}>How did you do?</Text>
            <View style={styles.resultButtons}>
              <Animated.View style={{ transform: [{ scale: wrongBtnScale }], flex: 1 }}>
                <TouchableOpacity
                  style={[styles.resultBtn, styles.wrongBtn]}
                  onPress={() => handleResult('wrong')}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  <View style={styles.btnIconCircle}>
                    <Ionicons name="close" size={26} color={colors.error} />
                  </View>
                  <Text style={[styles.resultBtnText, { color: colors.error }]}>Missed it</Text>
                  <Text style={styles.resultBtnSub}>← swipe left</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={{ transform: [{ scale: correctBtnScale }], flex: 1 }}>
                <TouchableOpacity
                  style={[styles.resultBtn, styles.correctBtn]}
                  onPress={() => handleResult('correct')}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  <View style={styles.btnIconCircleGreen}>
                    <Ionicons name="checkmark" size={26} color={colors.success} />
                  </View>
                  <Text style={[styles.resultBtnText, { color: colors.success }]}>Got it!</Text>
                  <Text style={styles.resultBtnSub}>swipe right →</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </>
        ) : (
          <TouchableOpacity style={styles.flipPromptBtn} onPress={flipCard} activeOpacity={0.8}>
            <Ionicons name="sync-outline" size={18} color={colors.primary} />
            <Text style={styles.flipPromptText}>Tap card to reveal answer</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  noCardsTitle: { ...typography.h2, marginTop: spacing.md, textAlign: 'center' },
  noCardsSubtitle: { ...typography.bodyMuted, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  backBtn2: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, alignSelf: 'center' },
  backBtnText: { ...typography.h4, color: colors.white },

  header: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.sm, gap: spacing.sm },
  headerBack: { alignSelf: 'flex-start', padding: spacing.xs },
  progressContainer: { gap: 6 },
  progressTrack: { height: 6, backgroundColor: colors.surface, borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progressText: { ...typography.small, textAlign: 'center', fontSize: 12 },
  scoreRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
  scorePill: { paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.full },
  correctPill: { backgroundColor: colors.success + '20' },
  wrongPill: { backgroundColor: colors.error + '20' },
  correctCount: { color: colors.success, fontWeight: '700', fontSize: 14 },
  wrongCount: { color: colors.error, fontWeight: '700', fontSize: 14 },

  cardArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  cardWrapper: { width: CARD_WIDTH, aspectRatio: 0.72 },
  flashCard: {
    position: 'absolute', width: '100%', height: '100%',
    borderRadius: radius.xl, backfaceVisibility: 'hidden',
    ...shadow.lg,
  },
  cardInner: { flex: 1, padding: spacing.xl, justifyContent: 'space-between' },
  cardFront: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  cardBack: { backgroundColor: colors.surfaceElevated, borderWidth: 1.5, borderColor: colors.primary + '40' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardSideTag: { backgroundColor: colors.surfaceElevated, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  cardSideText: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 },
  cardNumber: { ...typography.small, color: colors.textMuted, fontSize: 12 },
  cardQuestion: { ...typography.h3, textAlign: 'center', lineHeight: 32, fontSize: 22, flex: 1, textAlignVertical: 'center', paddingVertical: spacing.lg },
  cardAnswer: { ...typography.h3, textAlign: 'center', lineHeight: 32, fontSize: 22, flex: 1, textAlignVertical: 'center', paddingVertical: spacing.lg, color: colors.primaryLight },
  tapHintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tapHintText: { ...typography.small, fontSize: 12 },
  swipeHint: { ...typography.small, fontSize: 11, color: colors.textMuted },

  swipeIndicator: {
    position: 'absolute', top: 30, zIndex: 10,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.md, borderWidth: 2,
  },
  swipeCorrect: { right: 16, borderColor: colors.success, backgroundColor: colors.success + '20' },
  swipeWrong: { left: 16, borderColor: colors.error, backgroundColor: colors.error + '20' },
  swipeIndicatorText: { fontWeight: '800', fontSize: 14, color: colors.white, letterSpacing: 1 },

  resultOverlayContainer: {
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 20,
  },
  resultOverlayBubble: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
  },
  resultOverlayEmoji: { fontSize: 52, fontWeight: '900', color: colors.white },

  resultArea: { paddingHorizontal: spacing.lg, paddingBottom: 48, minHeight: 160, justifyContent: 'flex-end' },
  resultQuestion: { ...typography.bodyMuted, textAlign: 'center', marginBottom: spacing.sm, fontSize: 13 },
  resultButtons: { flexDirection: 'row', gap: spacing.md },
  resultBtn: {
    flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.lg, borderRadius: radius.xl, gap: spacing.xs,
    borderWidth: 1.5,
  },
  wrongBtn: { backgroundColor: colors.error + '12', borderColor: colors.error + '50' },
  correctBtn: { backgroundColor: colors.success + '12', borderColor: colors.success + '50' },
  btnIconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.error + '20', alignItems: 'center', justifyContent: 'center' },
  btnIconCircleGreen: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.success + '20', alignItems: 'center', justifyContent: 'center' },
  resultBtnText: { fontSize: 16, fontWeight: '700' },
  resultBtnSub: { ...typography.small, fontSize: 11 },

  flipPromptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.md,
    backgroundColor: colors.primary + '15', borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.primary + '40',
  },
  flipPromptText: { ...typography.body, color: colors.primary, fontSize: 14 },

  startContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  startIconBg: {
    width: 110, height: 110, borderRadius: radius.xl,
    backgroundColor: colors.primary + '25', alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.primary + '40',
  },
  startTitle: { ...typography.h2, marginBottom: 6 },
  startTopic: { ...typography.bodyMuted, marginBottom: spacing.xl },
  startStatsBox: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl,
    width: '100%', alignItems: 'center', marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  startStatNum: { ...typography.h1, color: colors.primary, fontSize: 56 },
  startStatLabel: { ...typography.bodyMuted, marginTop: 4 },
  startHint: { ...typography.bodyMuted, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 24 },
  startBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.md + 4,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, ...shadow.md,
  },
  startBtnText: { ...typography.h4, color: colors.white, fontSize: 18 },
});
