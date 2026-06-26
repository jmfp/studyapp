import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

/** Shown on features that require StuhDee Pro — helps App Store metadata clarity. */
export default function ProBadge({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.badge, compact && styles.badgeCompact]}>
      <Text style={[styles.text, compact && styles.textCompact]}>PRO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.background,
    letterSpacing: 1,
  },
  textCompact: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
});
