import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { colors, spacing, radius, typography, shadow } from '../../theme';
import type { QuizStackParamList } from '../../types';

const { width } = Dimensions.get('window');
const TAB_BAR_CLEARANCE = Platform.OS === 'ios' ? 96 : 80;

type Nav = NativeStackNavigationProp<QuizStackParamList, 'QuizResult'>;
type Route = RouteProp<QuizStackParamList, 'QuizResult'>;

export default function QuizResultScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const bottomPad = TAB_BAR_CLEARANCE + insets.bottom;
  const { score, correct, wrong, total, topicId, avgQuality } = route.params;

  const [displayScore, setDisplayScore] = useState(0);

  const iconScale = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
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
    if (score >= 90) return { label: 'Outstanding!', icon: 'trophy', color: colors.accent };
    if (score >= 70) return { label: 'Great job!', icon: 'star', color: colors.success };
    if (score >= 50) return { label: 'Good effort', icon: 'thumbs-up', color: colors.warning };
    return { label: 'Keep going!', icon: 'trending-up', color: colors.error };
  };

  const getMessage = () => {
    if (score >= 90) {
      return {
        icon: 'flame' as const,
        color: colors.accent,
        text: 'Perfect! Cards are scheduled further out. Keep this up!',
      };
    }
    if (score >= 70) {
      return {
        icon: 'sparkles' as const,
        color: colors.success,
        text: "Nice work! SM-2 has adjusted each card's next review date based on your ratings.",
      };
    }
    return {
      icon: 'book-outline' as const,
      color: colors.primary,
      text: "Missed cards have been reset and will reappear sooner. That's how you build memory.",
    };
  };

  const grade = getGrade();
  const message = getMessage();

  useEffect(() => {
    let frame = 0;
    const totalFrames = 60;
    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (frame >= totalFrames) clearInterval(timer);
    }, 16);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(iconScale, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }),
        Animated.timing(iconRotate, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.spring(titleAnim, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
      Animated.spring(circleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.stagger(120, [
        Animated.spring(stat1Anim, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.spring(stat2Anim, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.spring(stat3Anim, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
      ]),
      Animated.stagger(100, [
        Animated.spring(messageAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.spring(btn1Anim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.spring(btn2Anim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();

    if (score >= 70) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(ringAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    }

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

  const iconRotateDeg = iconRotate.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: ['-20deg', '15deg', '-10deg', '8deg', '-4deg', '0deg'],
  });
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.gradeIconWrap, {
        backgroundColor: grade.color + '18',
        borderColor: grade.color + '40',
        transform: [{ scale: iconScale }, { rotate: iconRotateDeg }, { scale: bgPulse }],
      }]}>
        <Ionicons name={grade.icon as any} size={52} color={grade.color} />
      </Animated.View>

      <Animated.Text style={[styles.gradeLabel, animatedSlideUp(titleAnim)]}>
        {grade.label}
      </Animated.Text>

      <Animated.View style={[styles.scoreSection, {
        transform: [{ scale: circleAnim }],
        opacity: circleAnim,
      }]}>
        {score >= 70 && (
          <Animated.View style={[styles.pulsingRing, {
            borderColor: grade.color,
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          }]} />
        )}
        <View style={[styles.scoreCircle, { borderColor: grade.color }]}>
          <View style={styles.scoreValueRow}>
            <Text style={[styles.scoreNumber, { color: grade.color }]}>{displayScore}</Text>
            <Text style={[styles.scorePct, { color: grade.color }]}>%</Text>
          </View>
          <Text style={styles.scoreLabel}>Score</Text>
        </View>
      </Animated.View>

      <View style={styles.statsGrid}>
        <StatBox anim={stat1Anim} icon="checkmark-circle" value={correct} label="Correct" color={colors.success} />
        <StatBox anim={stat2Anim} icon="close-circle" value={wrong} label="Wrong" color={colors.error} />
        <StatBox anim={stat3Anim} icon="layers" value={total} label="Total" color={colors.primary} />
      </View>

      <Animated.View style={[styles.messageBox, animatedSlideUp(messageAnim)]}>
        <View style={styles.avgQualityRow}>
          <Text style={styles.avgQualityLabel}>Avg. recall quality</Text>
          <Text style={[styles.avgQualityValue, { color: avgQuality >= 4 ? colors.accent : avgQuality >= 3 ? colors.success : colors.warning }]}>
            {avgQuality ?? '—'} / 5
          </Text>
        </View>
        <View style={styles.messageRow}>
          <Ionicons name={message.icon} size={20} color={message.color} style={styles.messageIcon} />
          <Text style={styles.messageText}>{message.text}</Text>
        </View>
      </Animated.View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: 80, alignItems: 'center' },
  gradeIconWrap: {
    width: 96, height: 96, borderRadius: radius.xl,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm, borderWidth: 1,
  },
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
  scoreValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  scoreNumber: { fontSize: 44, fontWeight: '900', lineHeight: 44 },
  scorePct: { fontSize: 20, fontWeight: '700', marginBottom: 5, opacity: 0.9 },
  scoreLabel: { ...typography.small, marginTop: 4 },
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
  avgQualityRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  avgQualityLabel: { ...typography.small, color: colors.textSecondary },
  avgQualityValue: { fontSize: 16, fontWeight: '800' },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  messageIcon: { marginTop: 2 },
  messageText: { ...typography.body, color: colors.textSecondary, lineHeight: 24, flex: 1 },
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
    marginBottom: spacing.sm,
  },
  secondaryActionText: { ...typography.body, color: colors.textSecondary },
});
