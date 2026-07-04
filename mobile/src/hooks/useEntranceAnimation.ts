import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export type EntranceVariant =
  | 'rise'
  | 'slideLeft'
  | 'slideRight'
  | 'scale'
  | 'fade'
  | 'drop'
  | 'pop';

export type EntranceStyle = {
  opacity: Animated.Value;
  transform: (
    | { translateY: Animated.AnimatedInterpolation<number> }
    | { translateX: Animated.AnimatedInterpolation<number> }
    | { scale: Animated.AnimatedInterpolation<number> }
  )[];
};

const VARIANT_SPRING: Record<EntranceVariant, { tension: number; friction: number }> = {
  rise: { tension: 40, friction: 7 },
  slideLeft: { tension: 52, friction: 9 },
  slideRight: { tension: 52, friction: 9 },
  scale: { tension: 55, friction: 8 },
  fade: { tension: 30, friction: 10 },
  drop: { tension: 46, friction: 6 },
  pop: { tension: 68, friction: 5 },
};

const VARIANT_DISTANCE: Record<EntranceVariant, number> = {
  rise: 44,
  slideLeft: 56,
  slideRight: 56,
  scale: 0,
  fade: 0,
  drop: 28,
  pop: 0,
};

function buildEntranceStyle(
  anim: Animated.Value,
  variant: EntranceVariant,
  distance?: number,
): EntranceStyle {
  const d = distance ?? VARIANT_DISTANCE[variant];

  switch (variant) {
    case 'rise':
      return {
        opacity: anim,
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [d, 0] }) },
          { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
        ],
      };
    case 'slideLeft':
      return {
        opacity: anim,
        transform: [
          { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [d, 0] }) },
        ],
      };
    case 'slideRight':
      return {
        opacity: anim,
        transform: [
          { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-d, 0] }) },
        ],
      };
    case 'scale':
      return {
        opacity: anim,
        transform: [
          { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] }) },
        ],
      };
    case 'fade':
      return { opacity: anim, transform: [] };
    case 'drop':
      return {
        opacity: anim,
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-d, 0] }) },
          { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
        ],
      };
    case 'pop':
      return {
        opacity: anim,
        transform: [
          { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) },
        ],
      };
  }
}

function runEntrance(
  anim: Animated.Value,
  delay: number,
  variant: EntranceVariant,
) {
  anim.setValue(0);
  const { tension, friction } = VARIANT_SPRING[variant];

  if (variant === 'fade') {
    Animated.timing(anim, {
      toValue: 1,
      duration: 520,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    return;
  }

  Animated.spring(anim, {
    toValue: 1,
    tension,
    friction,
    delay,
    useNativeDriver: true,
  }).start();
}

type EntranceOptions = {
  delay?: number;
  variant?: EntranceVariant;
  distance?: number;
};

/** Screen section entrance. Replays when tab/screen gains focus. */
export function useScreenEntrance(
  delayOrOptions: number | EntranceOptions = 0,
  variant: EntranceVariant = 'rise',
): EntranceStyle {
  const opts: EntranceOptions = typeof delayOrOptions === 'number'
    ? { delay: delayOrOptions, variant }
    : { delay: 0, variant: 'rise', ...delayOrOptions };
  const { delay = 0, variant: v = 'rise', distance } = opts;

  const anim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      runEntrance(anim, delay, v);
    }, [anim, delay, v]),
  );

  return buildEntranceStyle(anim, v, distance);
}

/** Mount-only entrance for auth/modals that are not in tab navigator. */
export function useMountEntrance(
  delayOrOptions: number | EntranceOptions = 0,
  variant: EntranceVariant = 'rise',
): EntranceStyle {
  const opts: EntranceOptions = typeof delayOrOptions === 'number'
    ? { delay: delayOrOptions, variant }
    : { delay: 0, variant: 'rise', ...delayOrOptions };
  const { delay = 0, variant: v = 'rise', distance } = opts;

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    runEntrance(anim, delay, v);
  }, [anim, delay, v]);

  return buildEntranceStyle(anim, v, distance);
}

const LIST_VARIANTS: EntranceVariant[] = ['rise', 'slideLeft', 'slideRight', 'pop'];

/** Staggered list item entrance. Pass focusKey from useFocusReplayKey to replay on tab focus. */
export function useListItemEntrance(
  index: number,
  focusKey = 0,
  staggerMs = 70,
  variant?: EntranceVariant,
): EntranceStyle {
  const v = variant ?? LIST_VARIANTS[index % LIST_VARIANTS.length];
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    runEntrance(anim, index * staggerMs, v);
  }, [anim, index, focusKey, staggerMs, v]);

  return buildEntranceStyle(anim, v, v === 'rise' || v === 'slideLeft' || v === 'slideRight' ? 32 : undefined);
}

/** Increment on screen focus so list items can replay their entrance. */
export function useFocusReplayKey(): number {
  const keyRef = useRef(0);
  const [focusKey, setFocusKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      keyRef.current += 1;
      setFocusKey(keyRef.current);
    }, []),
  );

  return focusKey;
}
