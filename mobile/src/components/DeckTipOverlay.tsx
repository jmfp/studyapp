import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableWithoutFeedback, Animated, Easing, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography, shadow } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');

const BTN_SIZE = 46;
const HEADER_TOP = 60;
const HEADER_RIGHT = 24;

interface DeckTipOverlayProps {
  onDismiss: () => void;
}

export default function DeckTipOverlay({ onDismiss }: DeckTipOverlayProps) {
  const insets = useSafeAreaInsets();

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const tooltipScale = useRef(new Animated.Value(0)).current;
  const tooltipSlide = useRef(new Animated.Value(20)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const arrowBounce = useRef(new Animated.Value(0)).current;
  const pulseRing = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const handAnim = useRef(new Animated.Value(0)).current;

  const btnCenterX = SCREEN_W - HEADER_RIGHT - BTN_SIZE / 2;
  const btnCenterY = HEADER_TOP + BTN_SIZE / 2;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(ringScale, { toValue: 1, tension: 65, friction: 6, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(tooltipScale, { toValue: 1, tension: 55, friction: 6, useNativeDriver: true }),
        Animated.spring(tooltipSlide, { toValue: 0, tension: 55, friction: 7, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseRing, { toValue: 1.8, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseRing, { toValue: 1, duration: 0, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, { toValue: 0, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowBounce, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(arrowBounce, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(handAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(handAnim, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(tooltipScale, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(onDismiss);
  };

  return (
    <TouchableWithoutFeedback onPress={handleDismiss}>
      <Animated.View style={[s.overlay, { opacity: overlayOpacity }]}>

        {/* Pulsing ring behind the button */}
        <Animated.View style={[s.pulseRing, {
          left: btnCenterX - 34,
          top: btnCenterY - 34,
          opacity: pulseOpacity,
          transform: [{ scale: pulseRing }],
        }]} />

        {/* Spotlight ring */}
        <Animated.View style={[s.spotlightRing, {
          left: btnCenterX - 32,
          top: btnCenterY - 32,
          opacity: ringOpacity,
          transform: [{ scale: ringScale }],
        }]} />

        {/* Fake + button to keep it visible through the overlay */}
        <View style={[s.fakeBtn, {
          left: btnCenterX - BTN_SIZE / 2,
          top: btnCenterY - BTN_SIZE / 2,
        }]}>
          <Ionicons name="add" size={24} color={colors.white} />
        </View>

        {/* Bouncing pointer hand */}
        <Animated.View style={[s.handPointer, {
          left: btnCenterX - 8,
          top: btnCenterY + BTN_SIZE / 2 + 4,
          transform: [{
            translateY: handAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }),
          }],
        }]}>
          <Ionicons name="hand-left" size={28} color={colors.accent} />
        </Animated.View>

        {/* Tooltip bubble */}
        <Animated.View style={[s.tooltip, {
          right: HEADER_RIGHT,
          top: btnCenterY + BTN_SIZE / 2 + 42,
          transform: [
            { scale: tooltipScale },
            { translateY: tooltipSlide },
          ],
        }]}>
          {/* Arrow pointing up */}
          <Animated.View style={[s.tooltipArrow, {
            transform: [{
              translateY: arrowBounce.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }),
            }],
          }]} />

          <View style={s.tooltipIconRow}>
            <View style={s.tooltipIconCircle}>
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </View>
          </View>

          <Text style={s.tooltipTitle}>Start here</Text>
          <Text style={s.tooltipBody}>
            Tap + to create a deck and add your first cards.
          </Text>

          <View style={s.tooltipDivider} />
          <Text style={s.tooltipDismiss}>Tap anywhere to continue</Text>
        </Animated.View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 999,
  },
  pulseRing: {
    position: 'absolute',
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 2, borderColor: colors.primary,
  },
  spotlightRing: {
    position: 'absolute',
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 3, borderColor: colors.accent,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
  },
  fakeBtn: {
    position: 'absolute',
    width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.md,
  },
  handPointer: {
    position: 'absolute',
  },
  tooltip: {
    position: 'absolute',
    width: 260,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1, borderColor: colors.primary + '50',
    ...shadow.lg,
  },
  tooltipArrow: {
    position: 'absolute',
    top: -10,
    right: 14,
    width: 0, height: 0,
    borderLeftWidth: 10, borderLeftColor: 'transparent',
    borderRightWidth: 10, borderRightColor: 'transparent',
    borderBottomWidth: 10, borderBottomColor: colors.surface,
  },
  tooltipIconRow: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tooltipIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  tooltipTitle: {
    ...typography.h4, textAlign: 'center',
    marginBottom: spacing.xs,
  },
  tooltipBody: {
    ...typography.bodyMuted, textAlign: 'center',
    fontSize: 13, lineHeight: 19,
  },
  tooltipDivider: {
    height: 1, backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  tooltipDismiss: {
    ...typography.small, textAlign: 'center',
    color: colors.textMuted, fontSize: 11,
  },
});
