import React from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';
import type { StudyCoachResult } from '../types';

interface StudyCoachModalProps {
  visible: boolean;
  data: StudyCoachResult | null;
  onContinue: () => void;
  onClose?: () => void;
  continueLabel?: string;
}

export default function StudyCoachModal({
  visible, data, onContinue, onClose, continueLabel = 'Continue',
}: StudyCoachModalProps) {
  if (!data) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose ?? onContinue}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <Ionicons name="school" size={22} color={colors.primary} />
              <Text style={styles.title}>Study coach</Text>
            </View>
            {(onClose || onContinue) && (
              <TouchableOpacity onPress={onClose ?? onContinue} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.block}>
              <Text style={styles.blockLabel}>WHY YOU MIGHT HAVE MISSED IT</Text>
              <Text style={styles.blockText}>{data.explanation}</Text>
            </View>

            <View style={[styles.block, styles.hookBlock]}>
              <Ionicons name="bulb" size={18} color={colors.warning} />
              <View style={styles.hookContent}>
                <Text style={styles.blockLabel}>MEMORY HOOK</Text>
                <Text style={styles.blockText}>{data.memoryHook}</Text>
              </View>
            </View>

            {data.compareCard && (
              <View style={styles.block}>
                <Text style={styles.blockLabel}>COMPARE WITH THIS CARD</Text>
                <Text style={styles.compareQ}>{data.compareCard.question}</Text>
                <Text style={styles.compareA}>{data.compareCard.answer}</Text>
                <Text style={styles.compareReason}>{data.compareCard.reason}</Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.continueBtn} onPress={onContinue}>
            <Text style={styles.continueText}>{continueLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: 40,
    maxHeight: '75%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.h3 },
  block: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hookBlock: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  hookContent: { flex: 1 },
  blockLabel: { ...typography.label, fontSize: 10, marginBottom: 6, color: colors.textMuted },
  blockText: { ...typography.body, fontSize: 14, lineHeight: 21 },
  compareQ: { ...typography.body, fontWeight: '600', marginBottom: 4 },
  compareA: { ...typography.body, color: colors.primaryLight, marginBottom: 6 },
  compareReason: { ...typography.bodyMuted, fontSize: 13 },
  continueBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  continueText: { color: colors.background, fontWeight: '700', fontSize: 16 },
});
