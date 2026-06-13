import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { colors, spacing, radius, typography, shadow } from '../../theme';
import type { QuizStackParamList } from '../../types';

const { width } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<QuizStackParamList, 'QuizResult'>;
type Route = RouteProp<QuizStackParamList, 'QuizResult'>;

export default function QuizResultScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { score, correct, wrong, total, topicId, avgQuality } = route.params;

  const [displayScore, setDisplayScore] = useState(0);

  // Animation refs
  const emojiScale = useRef(new Animated.Value(0)).current;
  const emojiRotate = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const circleAnim = useRef(new Animated.Value(0)).current;
  const stat1Anim = useRef(new Animated.Value(0)).current;
  const stat2Anim = useRef(new Animated.Value(0)).current;
  const stat3Anim = useRef(new Animated.Value(0)).current;
  const messageAnim = useRef(new Animated.Value(0)).current;
  const btn1Anim = useRef(new Animated.Value(0)).current;
  const btn2Anim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const bgPulse = useRef(new Animated.Value(1)).current;

  const getGrade = () => {
    if (score >= 90) return { label: 'Outstanding!', emoji: '🏆', color: colors.accent };
    if (score >= 70) return { label: 'Great job!', emoji: '🌟', color: colors.success };
    if (score >= 50) return { label: 'Good effort', emoji: '👍', color: colors.warning };
    return { label: 'Keep going!', emoji: '💪', color: colors.error };
  };

  const grade = getGrade();

  useEffect(() => {
    // Score counter
    let frame = 0;
    const totalFrames = 60;
    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (frame >= totalFrames) clearInterval(timer);
    }, 16);

    // Staggered entrance cascade
    Animated.sequence([
      // Emoji bounces in
      Animated.parallel([
        Animated.spring(emojiScale, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }),
        Animated.timing(emojiRotate, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      // Title fades up
      Animated.spring(titleAnim, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
      // Score ring expands
      Animated.spring(circleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      // Stats cascade in
      Animated.stagger(120, [
        Animated.spring(stat1Anim, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.spring(stat2Anim, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.spring(stat3Anim, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
      ]),
      // Message + buttons
      Animated.stagger(100, [
        Animated.spring(messageAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.spring(btn1Anim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.spring(btn2Anim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();

    // Ring pulse for high scores
    if (score >= 70) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(ringAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    }

    // Background glow pulse for perfect/great scores
    if (score >= 90) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bgPulse, { toValue: 1.04, duration: 1500, useNativeDriver: true }),
          Animated.timing(bgPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    }

    return () => clearInterval(timer);
  }, []);

  const emojiRotateDeg = emojiRotate.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: ['-20deg', '15deg', '-10deg', '8deg', '-4deg', '0deg'] });
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0.1] });
  const ringScale = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });

  const animatedSlideUp = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
  });

  const StatBox = ({ anim, icon, value, label, color }: { anim: Animated.Value; icon: string; value: number; label: string; color: string }) => (
    <Animated.View style={[styles.statBox, { borderColor: color + '40' }, animatedSlideUp(anim)]}>
      <Ionicons name={icon as any} size={26} color={color} />
      <Text style={[styles.statNum, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Emoji */}
      <Animated.View style={[styles.emojiContainer, {
        transform: [{ scale: emojiScale }, { rotate: emojiRotateDeg }, { scale: bgPulse }],
      }]}>
        <Text style={styles.gradeEmoji}>{grade.emoji}</Text>
      </Animated.View>

      {/* Title */}
      <Animated.Text style={[styles.gradeLabel, animatedSlideUp(titleAnim)]}>
        {grade.label}
      </Animated.Text>

      {/* Score circle */}
      <Animated.View style={[styles.scoreSection, {
        transform: [{ scale: circleAnim }],
        opacity: circleAnim,
      }]}>
        {/* Pulsing ring for good scores */}
        {score >= 70 && (
          <Animated.View style={[styles.pulsingRing, {
            borderColor: grade.color,
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          }]} />
        )}
        <View style={[styles.scoreCircle, { borderColor: grade.color }]}>
          <Text style={[styles.scoreNumber, { color: grade.color }]}>{displayScore}</Text>
          <Text style={styles.scorePct}>%</Text>
          <Text style={styles.scoreLabel}>Score</Text>
        </View>
      </Animated.View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <StatBox anim={stat1Anim} icon="checkmark-circle" value={correct} label="Correct" color={colors.success} />
        <StatBox anim={stat2Anim} icon="close-circle" value={wrong} label="Wrong" color={colors.error} />
        <StatBox anim={stat3Anim} icon="layers" value={total} label="Total" color={colors.primary} />
      </View>

      {/* Message */}
      <Animated.View style={[styles.messageBox, animatedSlideUp(messageAnim)]}>
        <View style={styles.avgQualityRow}>
          <Text style={styles.avgQualityLabel}>Avg. recall quality</Text>
          <Text style={[styles.avgQualityValue, { color: avgQuality >= 4 ? colors.accent : avgQuality >= 3 ? colors.success : colors.warning }]}>
            {avgQuality ?? '—'} / 5
          </Text>
        </View>
        <Text style={styles.messageText}>
          {score >= 90
            ? '🔥 Perfect! Cards are scheduled further out. Keep this up!'
            : score >= 70
            ? '✨ Nice work! SM-2 has adjusted each card\'s next review date based on your ratings.'
            : '📖 Missed cards have been reset and will reappear sooner. That\'s how you build memory.'}
        </Text>
      </Animated.View>

      {/* Buttons */}
      <Animated.View style={animatedSlideUp(btn1Anim)}>
        <TouchableOpacity
          style={[styles.primaryAction, { backgroundColor: grade.color }]}
          onPress={() => navigation.replace('QuizSession', { topicId, topicTitle: '' })}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh" size={20} color={colors.background} />
          <Text style={[styles.primaryActionText, { color: colors.background }]}>Study Again</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={animatedSlideUp(btn2Anim)}>
        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={() => navigation.navigate('QuizSelect')}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryActionText}>Choose another topic</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: 80, alignItems: 'center' },
  emojiContainer: { marginBottom: spacing.sm },
  gradeEmoji: { fontSize: 80 },
  gradeLabel: { ...typography.h1, marginBottom: spacing.xl, textAlign: 'center' },
  scoreSection: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  pulsingRing: {
    position: 'absolute',
    width: 170, height: 170, borderRadius: 85,
    borderWidth: 2,
  },
  scoreCircle: {
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: colors.surface, borderWidth: 5,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.lg,
  },
  scoreNumber: { fontSize: 48, fontWeight: '900', lineHeight: 52 },
  scorePct: { position: 'absolute', top: 28, right: 26, fontSize: 18, fontWeight: '700', color: colors.textSecondary },
  scoreLabel: { ...typography.small, marginTop: 2 },
  statsGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, width: '100%' },
  statBox: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', gap: spacing.xs,
    borderWidth: 1.5,
  },
  statNum: { fontSize: 26, fontWeight: '800' },
  statLabel: { ...typography.small },
  messageBox: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border, width: '100%', gap: spacing.sm,
  },
  avgQualityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  avgQualityLabel: { ...typography.small, color: colors.textSecondary },
  avgQualityValue: { fontSize: 16, fontWeight: '800' },
  messageText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  primaryAction: {
    borderRadius: radius.full,
    paddingVertical: spacing.md + 4, paddingHorizontal: spacing.xxl,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginBottom: spacing.sm, ...shadow.md, width: width - spacing.lg * 2,
  },
  primaryActionText: { fontSize: 17, fontWeight: '700' },
  secondaryAction: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.full,
    paddingVertical: spacing.md, alignItems: 'center', width: width - spacing.lg * 2,
  },
  secondaryActionText: { ...typography.body, color: colors.textSecondary },
});
