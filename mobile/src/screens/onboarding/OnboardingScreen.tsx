import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing,
  Dimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography, shadow } from '../../theme';
import { usePaywall } from '../../context/PaywallContext';
import { PRO_PRICE } from '../../services/revenueCat';

const { width, height } = Dimensions.get('window');

interface OnboardingQuestion {
  icon: string;
  question: string;
  yesLabel?: string;
  noLabel?: string;
}

const QUESTIONS: OnboardingQuestion[] = [
  {
    icon: 'brain-outline',
    question: 'Do you forget things you learn unless you constantly remind yourself?',
  },
  {
    icon: 'time-outline',
    question: 'Have you ever spent hours studying, only to blank on the exam?',
  },
  {
    icon: 'documents-outline',
    question: 'Do you find making flashcards takes longer than actually studying them?',
  },
  {
    icon: 'repeat-outline',
    question: 'Do you re-read the same notes over and over hoping something sticks?',
  },
  {
    icon: 'trending-down-outline',
    question: 'Does your confidence drop when you realize how much you\'ve forgotten?',
  },
  {
    icon: 'calendar-outline',
    question: 'Do you struggle to stay consistent with a study schedule?',
  },
  {
    icon: 'layers-outline',
    question: 'Do you have trouble knowing which material to focus on first?',
  },
  {
    icon: 'language-outline',
    question: 'Have you tried learning a new language but kept forgetting vocabulary?',
  },
  {
    icon: 'analytics-outline',
    question: 'Do you wish you could see exactly where your weak spots are?',
  },
  {
    icon: 'school-outline',
    question: 'Would it help to have a study coach explain things when you get them wrong?',
  },
  {
    icon: 'flash-outline',
    question: 'Do you want to study smarter, not harder?',
  },
  {
    icon: 'bookmark-outline',
    question: 'Have you ever highlighted an entire page because everything felt important?',
  },
  {
    icon: 'phone-portrait-outline',
    question: 'Do you want to study in short bursts during commutes or breaks?',
  },
  {
    icon: 'sparkles-outline',
    question: 'Would AI-generated flashcards from your own notes save you time?',
  },
  {
    icon: 'flame-outline',
    question: 'Do streaks and progress tracking motivate you to keep going?',
  },
];

const PROCESSING_MESSAGES = [
  'Analyzing your study habits...',
  'Identifying knowledge gaps...',
  'Calibrating spaced repetition...',
  'Building your learning profile...',
  'Optimizing recall intervals...',
  'Mapping memory patterns...',
  'Personalizing your experience...',
  'Calculating retention curves...',
  'Training the AI on your needs...',
  'Preparing your study plan...',
  'Tuning card difficulty...',
  'Configuring smart reviews...',
  'Setting up streak tracking...',
  'Syncing learning algorithms...',
  'Almost there...',
];

const PRO_FEATURES = [
  { icon: 'infinite', label: 'Unlimited study decks' },
  { icon: 'sparkles', label: 'AI deck generation from notes, PDFs & photos' },
  { icon: 'school', label: 'Study coach when you miss a card' },
  { icon: 'bulb', label: 'Smart card improvement suggestions' },
  { icon: 'language', label: 'Multilingual AI tools' },
  { icon: 'analytics', label: 'AI weekly insights & advanced analytics' },
] as const;

const INTERSTITIAL_MESSAGES = [
  'Noting that down...',
  'Adjusting your profile...',
  'Factoring that in...',
  'Running the numbers...',
  'Updating your model...',
  'Crunching data...',
  'Processing response...',
  'Recalibrating...',
  'Adding to your profile...',
  'Thinking...',
  'Calculating fit...',
  'Logging that...',
  'Interesting...',
  'Got it...',
  'Almost there...',
];

type Phase = 'questions' | 'processing' | 'results';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const { showPaywall } = usePaywall();

  const [phase, setPhase] = useState<Phase>('questions');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [yesCount, setYesCount] = useState(0);
  const [showingInterstitial, setShowingInterstitial] = useState(false);
  const [interstitialMsg, setInterstitialMsg] = useState('');

  // Interstitial animations (between slides)
  const interstitialOpacity = useRef(new Animated.Value(0)).current;
  const interstitialSpin = useRef(new Animated.Value(0)).current;
  const interstitialScale = useRef(new Animated.Value(0.5)).current;
  const interstitialBarProgress = useRef(new Animated.Value(0)).current;

  // Question animations
  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.85)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const iconPulse = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const yesAnim = useRef(new Animated.Value(0)).current;
  const noAnim = useRef(new Animated.Value(0)).current;

  // Processing animations
  const processingProgress = useRef(new Animated.Value(0)).current;
  const processingOpacity = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const dotAnims = useRef([0, 1, 2, 3, 4, 5].map(() => new Animated.Value(0))).current;
  const [processingMessage, setProcessingMessage] = useState(PROCESSING_MESSAGES[0]);
  const processingMsgAnim = useRef(new Animated.Value(1)).current;

  // Results animations
  const resultsOpacity = useRef(new Animated.Value(0)).current;
  const resultsBadgeScale = useRef(new Animated.Value(0)).current;
  const resultsSlideUp = useRef(new Animated.Value(60)).current;
  const featureAnims = useRef(PRO_FEATURES.map(() => new Animated.Value(0))).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const animateQuestionIn = useCallback(() => {
    cardAnim.setValue(0);
    cardScale.setValue(0.85);
    cardOpacity.setValue(0);
    iconPulse.setValue(0);
    yesAnim.setValue(0);
    noAnim.setValue(0);

    Animated.parallel([
      Animated.spring(cardScale, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconPulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(iconPulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ).start();

      Animated.stagger(120, [
        Animated.spring(yesAnim, { toValue: 1, tension: 70, friction: 7, useNativeDriver: true }),
        Animated.spring(noAnim, { toValue: 1, tension: 70, friction: 7, useNativeDriver: true }),
      ]).start();
    });
  }, [cardAnim, cardScale, cardOpacity, iconPulse, yesAnim, noAnim]);

  useEffect(() => {
    if (phase === 'questions') {
      animateQuestionIn();
      Animated.spring(progressAnim, {
        toValue: (questionIndex + 1) / QUESTIONS.length,
        tension: 40, friction: 8, useNativeDriver: false,
      }).start();
    }
  }, [phase, questionIndex, animateQuestionIn, progressAnim]);

  const playInterstitial = useCallback((nextIndex: number) => {
    setInterstitialMsg(INTERSTITIAL_MESSAGES[nextIndex % INTERSTITIAL_MESSAGES.length]);
    setShowingInterstitial(true);
    interstitialOpacity.setValue(0);
    interstitialSpin.setValue(0);
    interstitialScale.setValue(0.5);
    interstitialBarProgress.setValue(0);

    Animated.parallel([
      Animated.timing(interstitialOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(interstitialScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.timing(interstitialSpin, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true }),
    ).start();

    const duration = 850 + Math.random() * 500;
    Animated.timing(interstitialBarProgress, {
      toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: false,
    }).start();

    setTimeout(() => {
      Animated.timing(interstitialOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
        interstitialSpin.stopAnimation();
        setShowingInterstitial(false);
        if (nextIndex >= QUESTIONS.length) {
          startProcessing();
        } else {
          setQuestionIndex(nextIndex);
        }
      });
    }, duration);
  }, [interstitialOpacity, interstitialSpin, interstitialScale, interstitialBarProgress, startProcessing]);

  const exitQuestionAndAdvance = useCallback((answeredYes: boolean) => {
    if (answeredYes) setYesCount((c) => c + 1);

    const dir = answeredYes ? -1 : 1;

    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(cardScale, { toValue: 0.9, duration: 200, useNativeDriver: true }),
      Animated.timing(cardAnim, {
        toValue: dir * 2,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      playInterstitial(questionIndex + 1);
    });
  }, [questionIndex, cardOpacity, cardScale, cardAnim, playInterstitial]);

  // Processing phase
  const startProcessing = useCallback(() => {
    setPhase('processing');
    processingOpacity.setValue(0);
    processingProgress.setValue(0);
    spinAnim.setValue(0);

    Animated.timing(processingOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 2200, easing: Easing.linear, useNativeDriver: true }),
    ).start();

    dotAnims.forEach((d, i) => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(d, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(d, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ]),
        ).start();
      }, i * 200);
    });

    Animated.timing(processingProgress, {
      toValue: 1, duration: 5000, easing: Easing.out(Easing.quad), useNativeDriver: false,
    }).start();

    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx++;
      if (msgIdx >= PROCESSING_MESSAGES.length) {
        clearInterval(msgInterval);
        setTimeout(() => setPhase('results'), 400);
        return;
      }
      Animated.sequence([
        Animated.timing(processingMsgAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
      ]).start(() => {
        setProcessingMessage(PROCESSING_MESSAGES[msgIdx]);
        Animated.timing(processingMsgAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    }, 320);
  }, [processingOpacity, processingProgress, spinAnim, dotAnims, processingMsgAnim]);

  // Results phase
  useEffect(() => {
    if (phase !== 'results') return;

    resultsOpacity.setValue(0);
    resultsBadgeScale.setValue(0);
    resultsSlideUp.setValue(60);
    featureAnims.forEach((a) => a.setValue(0));
    ctaAnim.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(resultsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(resultsSlideUp, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
      Animated.spring(resultsBadgeScale, { toValue: 1, tension: 70, friction: 5, useNativeDriver: true }),
      Animated.stagger(70, featureAnims.map((a) =>
        Animated.spring(a, { toValue: 1, tension: 65, friction: 8, useNativeDriver: true }),
      )),
      Animated.spring(ctaAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start();
  }, [phase]);

  const handleUpgrade = () => {
    onComplete();
    setTimeout(() => showPaywall(), 350);
  };

  const cardTranslateX = cardAnim.interpolate({
    inputRange: [-2, 0, 1, 2],
    outputRange: [-width, 0, 0, width],
  });

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const interstitialSpin360 = interstitialSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const q = QUESTIONS[questionIndex];

  // Question phase
  if (phase === 'questions') {
    return (
      <View style={[s.container, { paddingTop: insets.top + spacing.md }]}>
        <View style={s.progressContainer}>
          <View style={s.progressTrack}>
            <Animated.View style={[s.progressFill, {
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }]} />
          </View>
          <Text style={s.progressText}>{questionIndex + 1} of {QUESTIONS.length}</Text>
        </View>

        {showingInterstitial ? (
          <Animated.View style={[s.cardArea, { opacity: interstitialOpacity }]}>
            <Animated.View style={{ transform: [{ scale: interstitialScale }], alignItems: 'center' }}>
              <Animated.View style={[s.interstitialSpinner, { transform: [{ rotate: interstitialSpin360 }] }]}>
                <View style={s.interstitialSpinnerDot} />
              </Animated.View>
              <Text style={s.interstitialText}>{interstitialMsg}</Text>
              <View style={s.interstitialBarTrack}>
                <Animated.View style={[s.interstitialBarFill, {
                  width: interstitialBarProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                }]} />
              </View>
            </Animated.View>
          </Animated.View>
        ) : (
          <>
            <View style={s.cardArea}>
              <Animated.View style={[s.questionCard, {
                opacity: cardOpacity,
                transform: [
                  { translateX: cardTranslateX },
                  { scale: cardScale },
                ],
              }]}>
                <Animated.View style={[s.iconCircle, {
                  transform: [{
                    scale: iconPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }),
                  }],
                }]}>
                  <Ionicons name={q.icon as any} size={44} color={colors.primary} />
                </Animated.View>

                <Text style={s.questionText}>{q.question}</Text>
              </Animated.View>
            </View>

            <View style={[s.buttonsRow, { paddingBottom: insets.bottom + spacing.lg }]}>
              <Animated.View style={[s.btnWrap, {
                opacity: yesAnim,
                transform: [{ translateY: yesAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
              }]}>
                <TouchableOpacity
                  style={[s.answerBtn, s.yesBtn]}
                  onPress={() => exitQuestionAndAdvance(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark" size={24} color={colors.white} />
                  <Text style={s.yesBtnText}>{q.yesLabel ?? 'Yes, definitely'}</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={[s.btnWrap, {
                opacity: noAnim,
                transform: [{ translateY: noAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
              }]}>
                <TouchableOpacity
                  style={[s.answerBtn, s.noBtn]}
                  onPress={() => exitQuestionAndAdvance(false)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                  <Text style={s.noBtnText}>{q.noLabel ?? 'Not really'}</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </>
        )}
      </View>
    );
  }

  // Processing phase
  if (phase === 'processing') {
    return (
      <Animated.View style={[s.container, s.centered, { opacity: processingOpacity }]}>
        {/* Spinner ring */}
        <Animated.View style={[s.spinnerRing, { transform: [{ rotate: spin }] }]}>
          <View style={s.spinnerDot} />
        </Animated.View>

        {/* Orbiting dots */}
        <View style={s.dotsRow}>
          {dotAnims.map((d, i) => (
            <Animated.View key={i} style={[s.processingDot, {
              backgroundColor: [colors.primary, colors.accent, colors.warning, colors.success, colors.primaryLight, colors.error][i],
              transform: [{
                scale: d.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] }),
              }],
              opacity: d.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
            }]} />
          ))}
        </View>

        {/* Message */}
        <Animated.Text style={[s.processingMsg, { opacity: processingMsgAnim }]}>
          {processingMessage}
        </Animated.Text>

        {/* Progress bar */}
        <View style={s.procProgressTrack}>
          <Animated.View style={[s.procProgressFill, {
            width: processingProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />
        </View>
      </Animated.View>
    );
  }

  // Results / paywall phase
  const matchPercent = Math.min(Math.round(((yesCount / QUESTIONS.length) * 30) + 68), 98);

  return (
    <Animated.View style={[s.container, {
      opacity: resultsOpacity,
      paddingTop: insets.top + spacing.md,
    }]}>
      <Animated.ScrollView
        contentContainerStyle={[s.resultsContent, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
        style={{ transform: [{ translateY: resultsSlideUp }] }}
      >
        {/* Match badge */}
        <Animated.View style={[s.matchBadgeWrap, { transform: [{ scale: resultsBadgeScale }] }]}>
          <View style={s.matchBadge}>
            <Ionicons name="checkmark-done" size={36} color={colors.primary} />
            <Text style={s.matchPercent}>{matchPercent}% match</Text>
          </View>
        </Animated.View>

        <Text style={s.resultsHeadline}>You're in the right place</Text>
        <Text style={s.resultsSub}>
          Spaced repetition is how your brain actually locks things in.
          StuhDee handles the scheduling so you just focus on learning.
        </Text>

        {/* How StuhDee helps */}
        <View style={s.helpSection}>
          <Text style={s.helpTitle}>What you get with Pro</Text>
          {PRO_FEATURES.map((f, i) => (
            <Animated.View key={f.label} style={[s.helpRow, {
              opacity: featureAnims[i],
              transform: [{ translateX: featureAnims[i].interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
            }]}>
              <View style={s.helpIcon}>
                <Ionicons name={f.icon as any} size={20} color={colors.primary} />
              </View>
              <Text style={s.helpLabel}>{f.label}</Text>
              <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
            </Animated.View>
          ))}
        </View>

        {/* CTAs */}
        <Animated.View style={[s.ctaSection, {
          opacity: ctaAnim,
          transform: [{ translateY: ctaAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
        }]}>
          <Animated.View style={{
            transform: [{
              scale: shimmerAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 1.02, 1],
              }),
            }],
          }}>
            <TouchableOpacity style={s.proBtn} onPress={handleUpgrade} activeOpacity={0.88}>
              <Ionicons name="flash" size={20} color={colors.white} />
              <Text style={s.proBtnText}>Start with Pro · {PRO_PRICE}</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity style={s.freeBtn} onPress={onComplete} activeOpacity={0.85}>
            <Text style={s.freeBtnText}>Continue with Free</Text>
          </TouchableOpacity>

          <Text style={s.legalText}>
            Auto-renewing subscription. Cancel anytime.
          </Text>
        </Animated.View>
      </Animated.ScrollView>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { alignItems: 'center', justifyContent: 'center' },

  // Progress
  progressContainer: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  progressTrack: { height: 6, backgroundColor: colors.surface, borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progressText: { ...typography.small, textAlign: 'center', marginTop: spacing.xs, fontSize: 12 },

  // Interstitial (between slides)
  interstitialSpinner: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 3, borderColor: colors.border,
    borderTopColor: colors.primary,
    marginBottom: spacing.lg,
  },
  interstitialSpinnerDot: {
    position: 'absolute', top: -5, left: '50%', marginLeft: -5,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.primary,
  },
  interstitialText: {
    ...typography.body, color: colors.textSecondary,
    marginBottom: spacing.md, fontSize: 14,
  },
  interstitialBarTrack: {
    width: 140, height: 4,
    backgroundColor: colors.surface, borderRadius: 2,
    overflow: 'hidden',
  },
  interstitialBarFill: {
    height: '100%', backgroundColor: colors.primary, borderRadius: 2,
  },

  // Question card
  cardArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg },
  questionCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadow.lg,
  },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.primary + '18',
    borderWidth: 1.5, borderColor: colors.primary + '40',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  questionText: {
    ...typography.h3, textAlign: 'center', lineHeight: 28, fontSize: 19,
    paddingHorizontal: spacing.sm,
  },

  // Buttons
  buttonsRow: {
    paddingHorizontal: spacing.lg, gap: spacing.sm,
  },
  btnWrap: { width: '100%' },
  answerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.md + 2,
    borderRadius: radius.full,
  },
  yesBtn: { backgroundColor: colors.primary, ...shadow.md },
  noBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  yesBtnText: { ...typography.h4, color: colors.white, fontSize: 16 },
  noBtnText: { ...typography.body, color: colors.textSecondary, fontSize: 16 },

  // Processing
  spinnerRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: colors.border,
    borderTopColor: colors.primary,
    borderRightColor: colors.primaryLight,
    marginBottom: spacing.xl,
  },
  spinnerDot: {
    position: 'absolute', top: -6, left: '50%', marginLeft: -6,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.primary,
  },
  dotsRow: {
    flexDirection: 'row', gap: spacing.md,
    marginBottom: spacing.xl,
  },
  processingDot: {
    width: 12, height: 12, borderRadius: 6,
  },
  processingMsg: {
    ...typography.body, color: colors.textSecondary,
    textAlign: 'center', marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    minHeight: 22,
  },
  procProgressTrack: {
    width: width * 0.7, height: 6,
    backgroundColor: colors.surface, borderRadius: 3,
    overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
  },
  procProgressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },

  // Results
  resultsContent: { paddingHorizontal: spacing.lg, alignItems: 'center', paddingTop: spacing.lg },
  matchBadgeWrap: { marginBottom: spacing.xl, marginTop: spacing.md },
  matchBadge: {
    alignItems: 'center', justifyContent: 'center',
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: colors.primary + '12',
    borderWidth: 2.5, borderColor: colors.primary + '50',
    paddingHorizontal: spacing.sm,
  },
  matchPercent: { ...typography.h4, color: colors.primary, fontSize: 18, marginTop: 4 },

  resultsHeadline: { ...typography.h1, textAlign: 'center', marginBottom: spacing.sm, fontSize: 28 },
  resultsSub: {
    ...typography.bodyMuted, textAlign: 'center',
    lineHeight: 22, paddingHorizontal: spacing.xs,
    marginBottom: spacing.xl,
  },

  helpSection: {
    width: '100%', backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  helpTitle: { ...typography.h3, marginBottom: spacing.md, fontSize: 18 },
  helpRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, paddingVertical: spacing.md - 2,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  helpIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  helpLabel: { ...typography.body, flex: 1, fontSize: 15 },

  ctaSection: { width: '100%', alignItems: 'stretch' },
  proBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: colors.primary,
    paddingVertical: spacing.md + 6,
    borderRadius: radius.full, ...shadow.md,
  },
  proBtnText: { ...typography.h4, color: colors.white, fontSize: 16 },
  freeBtn: {
    paddingVertical: spacing.md + 2, marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border,
  },
  freeBtnText: { ...typography.body, color: colors.textSecondary, fontSize: 15 },
  legalText: { ...typography.small, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center', fontSize: 11 },
});
