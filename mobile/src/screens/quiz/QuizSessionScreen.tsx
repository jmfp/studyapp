import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Animated, Alert, Dimensions, PanResponder, Vibration, ScrollView, Easing, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { colors, spacing, radius, typography, shadow } from '../../theme';
import {
  useGetDueCardsQuery, useStartSessionMutation,
  useSubmitReviewMutation, useCompleteSessionMutation,
  useGetStudyCoachMutation,
} from '../../services/api';
import type { QuizStackParamList, ReviewQuality, QualityOption, StudyCoachResult } from '../../types';
import StudyCoachModal from '../../components/StudyCoachModal';
import PaywallModal from '../../components/PaywallModal';
import { useAiProGate, isAiProRequiredError } from '../../hooks/useAiProGate';

type Nav = NativeStackNavigationProp<QuizStackParamList, 'QuizSession'>;
type Route = RouteProp<QuizStackParamList, 'QuizSession'>;

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.lg * 2;
const SWIPE_THRESHOLD = width * 0.28;
const TAB_BAR_CLEARANCE = Platform.OS === 'ios' ? 96 : 80;

// SM-2 quality options shown after flipping
const QUALITY_OPTIONS: QualityOption[] = [
  {
    quality: 0, label: 'Blackout', sublabel: 'No idea', icon: 'eye-off-outline',
    color: '#FF1744', isCorrect: false,
  },
  {
    quality: 2, label: 'Wrong', sublabel: 'Saw it, knew it', icon: 'close-circle',
    color: '#FF6D00', isCorrect: false,
  },
  {
    quality: 3, label: 'Hard', sublabel: 'Got it, barely', icon: 'alert-circle',
    color: '#FFD740', isCorrect: true,
  },
  {
    quality: 5, label: 'Easy', sublabel: 'Perfect recall', icon: 'flash',
    color: '#00E676', isCorrect: true,
  },
];

// Maps swipe direction to quality for gesture shortcuts
const SWIPE_LEFT_QUALITY: ReviewQuality = 5;  // Easy — swipe left = got it
const SWIPE_RIGHT_QUALITY: ReviewQuality = 0; // Blackout — swipe right = no idea

export default function QuizSessionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const bottomPad = TAB_BAR_CLEARANCE + insets.bottom;
  const { topicId, topicTitle } = route.params;

  const { data: dueCards, isLoading } = useGetDueCardsQuery(topicId);
  const [startSession] = useStartSessionMutation();
  const [submitReview] = useSubmitReviewMutation();
  const [completeSession] = useCompleteSessionMutation();
  const [getStudyCoach, { isLoading: coachLoading }] = useGetStudyCoachMutation();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSm2, setLastSm2] = useState<{ label: string; quality: number } | null>(null);
  const [qualityScores, setQualityScores] = useState<number[]>([]);
  const [coachVisible, setCoachVisible] = useState(false);
  const [coachData, setCoachData] = useState<StudyCoachResult | null>(null);
  const [coachAfterRating, setCoachAfterRating] = useState(false);
  const [pendingQuality, setPendingQuality] = useState<ReviewQuality | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const { requirePro } = useAiProGate(() => setShowPaywall(true));

  // Animation refs
  const flipAnim = useRef(new Animated.Value(0)).current;
  const flipLiftAnim = useRef(new Animated.Value(0)).current;
  const cardTranslateX = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(60)).current;
  const cardRotation = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;
  const sm2LabelAnim = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const startScreenAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const resultOverlayOpacity = useRef(new Animated.Value(0)).current;
  const resultOverlayScale = useRef(new Animated.Value(0.3)).current;
  const [resultColor, setResultColor] = useState(colors.success);
  const [resultIcon, setResultIcon] = useState('flash');

  const isFlippedRef = useRef(isFlipped);
  const isSubmittingRef = useRef(isSubmitting);
  const handleQualityRef = useRef<(quality: ReviewQuality) => void>(() => {});

  useEffect(() => {
    isFlippedRef.current = isFlipped;
  }, [isFlipped]);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    Animated.spring(startScreenAnim, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }).start();
  }, []);

  const animateCardIn = useCallback(() => {
    flipAnim.setValue(0);
    flipLiftAnim.setValue(0);
    cardTranslateX.setValue(0);
    cardTranslateY.setValue(60);
    cardScale.setValue(0.9);
    cardOpacity.setValue(0);
    cardRotation.setValue(0);
    buttonsAnim.setValue(0);
    Animated.parallel([
      Animated.spring(cardTranslateY, { toValue: 0, tension: 65, friction: 8, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, tension: 65, friction: 8, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  const flipCard = () => {
    if (isFlipped || isSubmitting) return;

    Vibration.vibrate(8);

    Animated.sequence([
      Animated.spring(cardScale, { toValue: 0.97, tension: 140, friction: 9, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(flipAnim, {
          toValue: 1,
          duration: 560,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(flipLiftAnim, { toValue: -18, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.spring(flipLiftAnim, { toValue: 0, tension: 52, friction: 7, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(cardScale, { toValue: 0.94, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.spring(cardScale, { toValue: 1.02, tension: 70, friction: 6, useNativeDriver: true }),
          Animated.spring(cardScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
        ]),
      ]),
    ]).start(() => {
      setIsFlipped(true);
      Animated.spring(buttonsAnim, { toValue: 1, tension: 48, friction: 7, useNativeDriver: true }).start();
    });
  };

  useEffect(() => {
    if (isStarted && dueCards) {
      animateCardIn();
      Animated.spring(headerAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
      Animated.spring(progressWidth, {
        toValue: dueCards.length > 0 ? (currentIndex / dueCards.length) * 100 : 0,
        tension: 40, friction: 8, useNativeDriver: false,
      }).start();
    }
  }, [isStarted, currentIndex]);

  const shakeCard = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const showResultBubble = (color: string, icon: string) => {
    setResultColor(color);
    setResultIcon(icon);
    resultOverlayOpacity.setValue(0);
    resultOverlayScale.setValue(0.3);
    Animated.parallel([
      Animated.spring(resultOverlayScale, { toValue: 1, tension: 100, friction: 5, useNativeDriver: true }),
      Animated.timing(resultOverlayOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const exitCard = (direction: 'left' | 'right', callback: () => void) => {
    const xTarget = direction === 'right' ? width * 1.3 : -width * 1.3;
    Animated.parallel([
      Animated.timing(cardTranslateX, { toValue: xTarget, duration: 320, useNativeDriver: true }),
      Animated.timing(cardRotation, { toValue: direction === 'right' ? 18 : -18, duration: 320, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.timing(cardScale, { toValue: 0.88, duration: 260, useNativeDriver: true }),
    ]).start(callback);
  };

  const advanceAfterReview = async (quality: ReviewQuality) => {
    if (!sessionId || !dueCards) return;

    const nextIndex = currentIndex + 1;
    if (nextIndex >= dueCards.length) {
      const allQ = [...qualityScores, quality];
      const avgQ = allQ.reduce((a, b) => a + b, 0) / allQ.length;
      const session = await completeSession(sessionId).unwrap();
      navigation.replace('QuizResult', {
        sessionId: session._id, topicId,
        score: session.score,
        correct: session.correctCount,
        wrong: session.wrongCount,
        total: session.totalCards,
        avgQuality: +avgQ.toFixed(1),
      });
    } else {
      setIsFlipped(false);
      setCurrentIndex(nextIndex);
      setCardStartTime(Date.now());
      cardRotation.setValue(0);
      animateCardIn();
    }
  };

  const showCoachHints = async (cardId: string, qualityRated: number, afterRating: boolean) => {
    try {
      const coach = await getStudyCoach({ topicId, cardId, qualityRated }).unwrap();
      setCoachData(coach);
      setCoachAfterRating(afterRating);
      setCoachVisible(true);
      return true;
    } catch (err) {
      if (isAiProRequiredError(err)) {
        setShowPaywall(true);
      } else if (afterRating) {
        Alert.alert('Study coach unavailable', 'Continuing to the next card.');
      } else {
        Alert.alert('Study coach unavailable', 'Try again in a moment.');
      }
      return false;
    }
  };

  const handleCoachContinue = async () => {
    setCoachVisible(false);
    setCoachData(null);
    if (coachAfterRating && pendingQuality !== null) {
      const quality = pendingQuality;
      setPendingQuality(null);
      setCoachAfterRating(false);
      try {
        await advanceAfterReview(quality);
      } catch {
        Alert.alert('Error', 'Failed to continue session');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleHelpRemember = async () => {
    if (!dueCards || isSubmitting || coachLoading) return;
    if (!requirePro()) return;
    const card = dueCards[currentIndex];
    await showCoachHints(card._id, 2, false);
  };

  const handleQuality = async (quality: ReviewQuality) => {
    if (!sessionId || !dueCards || isSubmitting) return;
    const card = dueCards[currentIndex];
    const timeSpentMs = Date.now() - cardStartTime;
    setIsSubmitting(true);

    const opt = QUALITY_OPTIONS.find((o) => o.quality === quality) || QUALITY_OPTIONS[1];
    const isCorrect = quality >= 3;

    if (!isCorrect) {
      Vibration.vibrate(60);
      shakeCard();
    }

    showResultBubble(opt.color, opt.icon);
    if (isCorrect) setCorrect((c) => c + 1);
    else setWrong((w) => w + 1);
    setQualityScores((qs) => [...qs, quality]);
    const needsCoach = quality <= 2;

    setTimeout(() => {
      exitCard(isCorrect ? 'right' : 'left', async () => {
        resultOverlayOpacity.setValue(0);
        try {
          const resp = await submitReview({ sessionId, cardId: card._id, topicId, quality, timeSpentMs }).unwrap();
          setLastSm2({ label: resp.sm2Result.nextReviewLabel, quality });

          sm2LabelAnim.setValue(0);
          Animated.sequence([
            Animated.spring(sm2LabelAnim, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
            Animated.delay(1200),
            Animated.timing(sm2LabelAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]).start();

          if (needsCoach) {
            setPendingQuality(quality);
            const shown = await showCoachHints(card._id, quality, true);
            if (!shown) {
              await advanceAfterReview(quality);
              setIsSubmitting(false);
            }
          } else {
            await advanceAfterReview(quality);
            setIsSubmitting(false);
          }
        } catch {
          Alert.alert('Error', 'Failed to submit review');
          setIsSubmitting(false);
        }
      });
    }, 380);
  };

  handleQualityRef.current = handleQuality;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => {
        if (!isFlippedRef.current || isSubmittingRef.current) return false;
        return Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2;
      },
      onMoveShouldSetPanResponderCapture: (_, g) => {
        if (!isFlippedRef.current || isSubmittingRef.current) return false;
        return Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2;
      },
      onPanResponderGrant: () => {
        cardTranslateX.stopAnimation();
        cardRotation.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        cardTranslateX.setValue(g.dx);
        cardRotation.setValue(g.dx / 16);
      },
      onPanResponderRelease: (_, g) => {
        if (isSubmittingRef.current) {
          Animated.parallel([
            Animated.spring(cardTranslateX, { toValue: 0, tension: 80, friction: 7, useNativeDriver: true }),
            Animated.spring(cardRotation, { toValue: 0, tension: 80, friction: 7, useNativeDriver: true }),
          ]).start();
          return;
        }
        if (g.dx > SWIPE_THRESHOLD && isFlippedRef.current) {
          handleQualityRef.current(SWIPE_RIGHT_QUALITY);
        } else if (g.dx < -SWIPE_THRESHOLD && isFlippedRef.current) {
          handleQualityRef.current(SWIPE_LEFT_QUALITY);
        } else {
          Animated.parallel([
            Animated.spring(cardTranslateX, { toValue: 0, tension: 80, friction: 7, useNativeDriver: true }),
            Animated.spring(cardRotation, { toValue: 0, tension: 80, friction: 7, useNativeDriver: true }),
          ]).start();
        }
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.48, 0.52, 1], outputRange: [1, 1, 0, 0] });
  const backOpacity = flipAnim.interpolate({ inputRange: [0, 0.48, 0.52, 1], outputRange: [0, 0, 1, 1] });
  const backGlow = flipAnim.interpolate({ inputRange: [0.55, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const cardLiftY = Animated.add(cardTranslateY, flipLiftAnim);
  const cardRotateDeg = cardRotation.interpolate({ inputRange: [-30, 0, 30], outputRange: ['-30deg', '0deg', '30deg'] });
  const swipeRightOpacity = cardTranslateX.interpolate({ inputRange: [20, 80], outputRange: [0, 1], extrapolate: 'clamp' });
  const swipeLeftOpacity = cardTranslateX.interpolate({ inputRange: [-80, -20], outputRange: [1, 0], extrapolate: 'clamp' });

  if (isLoading) return <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>;

  if (!dueCards || dueCards.length === 0) {
    return (
      <View style={s.center}>
        <Animated.View style={{ transform: [{ scale: startScreenAnim }], alignItems: 'center' }}>
          <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          <Text style={s.noCardsTitle}>All caught up!</Text>
          <Text style={s.noCardsSub}>No cards due. Your schedule is on track.</Text>
          <TouchableOpacity style={s.backBtn2} onPress={() => navigation.goBack()}>
            <Text style={s.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  if (!isStarted) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBack}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <Animated.ScrollView
          contentContainerStyle={[s.startContent, { paddingBottom: bottomPad + spacing.lg }]}
          showsVerticalScrollIndicator={false}
          style={{ opacity: startScreenAnim, transform: [{ translateY: startScreenAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }}
        >
          <View style={s.startIconBg}>
            <Ionicons name="flash" size={52} color={colors.primary} />
          </View>
          <Text style={s.startTitle}>Ready?</Text>
          <Text style={s.startTopic}>{topicTitle}</Text>

          <View style={s.startStatsBox}>
            <Text style={s.startStatNum}>{dueCards.length}</Text>
            <Text style={s.startStatLabel}>Cards Due</Text>
          </View>

          <View style={s.ratingGuide}>
            <Text style={s.ratingGuideTitle}>After flipping each card, rate your recall:</Text>
            {QUALITY_OPTIONS.map((opt) => (
              <View key={opt.quality} style={s.ratingRow}>
                <View style={[s.ratingDot, { backgroundColor: opt.color + '30', borderColor: opt.color }]}>
                  <Ionicons name={opt.icon as any} size={20} color={opt.color} />
                </View>
                <View style={s.ratingInfo}>
                  <Text style={[s.ratingLabel, { color: opt.color }]}>{opt.label}</Text>
                  <Text style={s.ratingSub}>{opt.sublabel}</Text>
                </View>
                <Text style={s.ratingQ}>q={opt.quality}</Text>
              </View>
            ))}
            <View style={s.swipeTip}>
              <Ionicons name="bulb-outline" size={14} color={colors.textMuted} />
              <Text style={s.swipeTipText}>Swipe left = Easy · Swipe right = Blackout</Text>
            </View>
          </View>

          <TouchableOpacity style={s.startBtn} onPress={async () => {
            try {
              const session = await startSession(topicId).unwrap();
              setSessionId(session._id);
              setIsStarted(true);
              setCardStartTime(Date.now());
            } catch { Alert.alert('Error', 'Failed to start session'); }
          }}>
            <Text style={s.startBtnText}>Begin</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        </Animated.ScrollView>
      </View>
    );
  }

  const card = dueCards[currentIndex];

  return (
    <View style={s.container}>
      {/* Header */}
      <Animated.View style={[s.header, {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
      }]}>
        <TouchableOpacity onPress={() => Alert.alert('Quit?', 'Answered cards are already saved.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Quit', style: 'destructive', onPress: () => navigation.goBack() },
        ])} style={s.headerBack}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={s.progressContainer}>
          <View style={s.progressTrack}>
            <Animated.View style={[s.progressFill, {
              width: progressWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
            }]} />
          </View>
          <Text style={s.progressText}>{currentIndex + 1} / {dueCards.length}</Text>
        </View>

        <View style={s.scoreRow}>
          <View style={s.scorePill}>
            <Text style={s.correctCount}>✓ {correct}</Text>
          </View>
          <View style={[s.scorePill, { backgroundColor: colors.error + '20' }]}>
            <Text style={s.wrongCount}>✗ {wrong}</Text>
          </View>
        </View>
      </Animated.View>

      {/* SM-2 next review toast */}
      {lastSm2 && (
        <Animated.View style={[s.sm2Toast, {
          opacity: sm2LabelAnim,
          transform: [{ translateY: sm2LabelAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
        }]}>
          <Ionicons name="time-outline" size={13} color={colors.textMuted} />
          <Text style={s.sm2ToastText}>Next review: <Text style={{ color: colors.primary }}>{lastSm2.label}</Text></Text>
        </Animated.View>
      )}

      {/* Card */}
      <View style={s.cardArea}>
        <Animated.View
          style={[s.cardWrapper, {
            opacity: cardOpacity,
            transform: [
              { translateX: Animated.add(cardTranslateX, shakeAnim) },
              { translateY: cardLiftY },
              { rotate: cardRotateDeg },
              { scale: cardScale },
            ],
          }]}
          {...panResponder.panHandlers}
        >
          {/* Swipe hints */}
          <Animated.View style={[s.swipeHintLeft, { opacity: swipeLeftOpacity }]}>
            <Ionicons name="flash" size={18} color={colors.success} />
            <Text style={[s.swipeHintText, { color: colors.success }]}>EASY</Text>
          </Animated.View>
          <Animated.View style={[s.swipeHintRight, { opacity: swipeRightOpacity }]}>
            <Ionicons name="eye-off-outline" size={18} color={colors.error} />
            <Text style={[s.swipeHintText, { color: colors.error }]}>BLACKOUT</Text>
          </Animated.View>

          {/* Front */}
          <Animated.View style={[s.flashCard, s.cardFront, {
            opacity: frontOpacity,
            transform: [{ perspective: 1200 }, { rotateY: frontRotate }],
          }]}>
            <TouchableOpacity style={s.cardInner} onPress={flipCard} activeOpacity={0.95}>
              <View style={s.cardTopRow}>
                <View style={s.cardTag}><Text style={s.cardTagText}>QUESTION</Text></View>
                <Text style={s.cardNum}>{currentIndex + 1}/{dueCards.length}</Text>
              </View>
              <Text style={s.questionText}>{card.question}</Text>
              <View style={s.tapHintRow}>
                <Ionicons name="hand-left-outline" size={14} color={colors.textMuted} />
                <Text style={s.tapHintText}>Tap to flip</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Back */}
          <Animated.View style={[s.flashCard, s.cardBack, {
            opacity: backOpacity,
            transform: [{ perspective: 1200 }, { rotateY: backRotate }],
          }]}>
            <Animated.View style={[s.cardBackGlow, { opacity: backGlow }]} />
            <View style={s.cardInner}>
              <View style={s.cardTopRow}>
                <View style={[s.cardTag, { backgroundColor: colors.primary + '30' }]}>
                  <Text style={[s.cardTagText, { color: colors.primaryLight }]}>ANSWER</Text>
                </View>
                <Text style={s.swipeGestureTip}>swipe or rate below</Text>
              </View>
              <Text style={s.answerText}>{card.answer}</Text>
              <TouchableOpacity
                style={s.helpRememberBtn}
                onPress={handleHelpRemember}
                disabled={coachLoading || isSubmitting}
                activeOpacity={0.8}
              >
                {coachLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="school-outline" size={16} color={colors.primary} />
                    <Text style={s.helpRememberText}>Help me remember this</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Result overlay bubble */}
        <Animated.View style={[s.overlayBubble, {
          opacity: resultOverlayOpacity,
          transform: [{ scale: resultOverlayScale }],
          borderColor: resultColor,
          backgroundColor: resultColor + '25',
        }]}>
          <Ionicons name={resultIcon as any} size={44} color={resultColor} />
        </Animated.View>
      </View>

      {/* Rating buttons */}
      <Animated.View style={[s.bottomArea, {
        paddingBottom: bottomPad,
        opacity: buttonsAnim,
        transform: [{ translateY: buttonsAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }],
      }]}>
        {isFlipped ? (
          <>
            <Text style={s.rateLabel}>How well did you recall it?</Text>
            <View style={s.ratingButtons}>
              {QUALITY_OPTIONS.map((opt) => (
                <QualityButton
                  key={opt.quality}
                  option={opt}
                  onPress={() => handleQuality(opt.quality)}
                  disabled={isSubmitting}
                />
              ))}
            </View>
          </>
        ) : (
          <TouchableOpacity style={s.flipPrompt} onPress={flipCard} activeOpacity={0.8}>
            <Ionicons name="sync-outline" size={16} color={colors.primary} />
            <Text style={s.flipPromptText}>Tap card to reveal answer</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      <StudyCoachModal
        visible={coachVisible}
        data={coachData}
        onContinue={handleCoachContinue}
        continueLabel={coachAfterRating ? 'Continue' : 'Got it'}
      />

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={() => setShowPaywall(false)}
      />
    </View>
  );
}

function QualityButton({ option, onPress, disabled }: {
  option: QualityOption; onPress: () => void; disabled: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.90, tension: 200, friction: 5, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, tension: 200, friction: 5, useNativeDriver: true }).start();

  return (
    <Animated.View style={[s.ratingBtnWrap, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[s.ratingBtn, {
          backgroundColor: option.color + '18',
          borderColor: option.color + '60',
        }]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        <Ionicons name={option.icon as any} size={22} color={option.color} />
        <Text style={[s.ratingBtnLabel, { color: option.color }]}>{option.label}</Text>
        <Text style={s.ratingBtnSub}>{option.sublabel}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  noCardsTitle: { ...typography.h2, marginTop: spacing.md, textAlign: 'center' },
  noCardsSub: { ...typography.bodyMuted, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  backBtn2: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  backBtnText: { ...typography.h4, color: colors.white },

  header: { paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: spacing.xs, gap: spacing.xs },
  headerBack: { alignSelf: 'flex-start', padding: spacing.xs },
  progressContainer: { gap: 5 },
  progressTrack: { height: 6, backgroundColor: colors.surface, borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progressText: { ...typography.small, textAlign: 'center', fontSize: 11 },
  scoreRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  scorePill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full, backgroundColor: colors.success + '20' },
  correctCount: { color: colors.success, fontWeight: '700', fontSize: 13 },
  wrongCount: { color: colors.error, fontWeight: '700', fontSize: 13 },

  sm2Toast: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'center', paddingHorizontal: spacing.md, paddingVertical: 4,
    backgroundColor: colors.surface, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border, marginTop: 4,
  },
  sm2ToastText: { ...typography.small, fontSize: 12 },

  cardArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  cardWrapper: { width: CARD_WIDTH, aspectRatio: 0.74 },
  flashCard: {
    position: 'absolute', width: '100%', height: '100%',
    borderRadius: radius.xl, backfaceVisibility: 'hidden', ...shadow.lg,
  },
  cardInner: { flex: 1, padding: spacing.xl, justifyContent: 'space-between' },
  cardFront: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  cardBack: { backgroundColor: colors.surfaceElevated, borderWidth: 1.5, borderColor: colors.primary + '40', overflow: 'hidden' },
  cardBackGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    opacity: 0.08,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTag: { backgroundColor: colors.background, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  cardTagText: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 },
  cardNum: { ...typography.small, fontSize: 11, color: colors.textMuted },
  questionText: { ...typography.h3, textAlign: 'center', lineHeight: 30, fontSize: 21, flex: 1, textAlignVertical: 'center', paddingVertical: spacing.md },
  answerText: { ...typography.h3, textAlign: 'center', lineHeight: 30, fontSize: 21, flex: 1, textAlignVertical: 'center', paddingVertical: spacing.md, color: colors.primaryLight },
  tapHintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  tapHintText: { ...typography.small, fontSize: 12 },
  swipeGestureTip: { ...typography.small, fontSize: 11, color: colors.textMuted },

  swipeHintRight: {
    position: 'absolute', right: 16, top: 28, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radius.md, borderWidth: 2, borderColor: colors.error,
    backgroundColor: colors.error + '20',
  },
  swipeHintLeft: {
    position: 'absolute', left: 16, top: 28, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radius.md, borderWidth: 2, borderColor: colors.success,
    backgroundColor: colors.success + '20',
  },
  swipeHintText: { fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },

  overlayBubble: {
    position: 'absolute',
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 2.5, alignItems: 'center', justifyContent: 'center',
  },

  bottomArea: { paddingHorizontal: spacing.md, minHeight: 150, justifyContent: 'flex-end' },
  rateLabel: { ...typography.small, textAlign: 'center', marginBottom: 8, color: colors.textMuted, fontSize: 12 },
  ratingButtons: { flexDirection: 'row', gap: spacing.xs },
  ratingBtnWrap: { flex: 1 },
  ratingBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.sm + 2, borderRadius: radius.lg,
    borderWidth: 1.5, gap: 3,
  },
  ratingBtnLabel: { fontSize: 13, fontWeight: '700' },
  ratingBtnSub: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },

  flipPrompt: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.md,
    backgroundColor: colors.primary + '15', borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.primary + '40',
  },
  flipPromptText: { ...typography.body, color: colors.primary, fontSize: 14 },

  helpRememberBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    marginTop: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    backgroundColor: colors.primary + '12', borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.primary + '35',
  },
  helpRememberText: { color: colors.primary, fontSize: 13, fontWeight: '600' },

  startContent: { paddingHorizontal: spacing.lg, alignItems: 'center', paddingTop: 12 },
  startIconBg: {
    width: 100, height: 100, borderRadius: radius.xl,
    backgroundColor: colors.primary + '22', alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.primary + '40',
  },
  startTitle: { ...typography.h2, marginBottom: 4 },
  startTopic: { ...typography.bodyMuted, marginBottom: spacing.lg },
  startStatsBox: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    width: '100%', alignItems: 'center', marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  startStatNum: { ...typography.h1, color: colors.primary, fontSize: 52 },
  startStatLabel: { ...typography.bodyMuted, marginTop: 4 },
  ratingGuide: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, width: '100%', marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border, gap: spacing.sm,
  },
  ratingGuideTitle: { ...typography.small, color: colors.textSecondary, marginBottom: spacing.xs, textAlign: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ratingDot: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  ratingInfo: { flex: 1 },
  ratingLabel: { fontSize: 14, fontWeight: '700' },
  ratingSub: { ...typography.small, fontSize: 11 },
  ratingQ: { ...typography.small, fontSize: 11, color: colors.textMuted },
  swipeTip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2 },
  swipeTipText: { ...typography.small, fontSize: 11, color: colors.textMuted },
  startBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.md + 4,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, ...shadow.md,
  },
  startBtnText: { ...typography.h4, color: colors.white, fontSize: 17 },
});
