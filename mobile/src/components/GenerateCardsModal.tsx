import React from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';
import { useGenerateCardsMutation, useGetAiUsageQuery } from '../services/api';
import AiSourceForm, { useAiSourceForm } from './AiSourceForm';
import { useAiProGate, isAiProRequiredError } from '../hooks/useAiProGate';
import ProBadge from './ProBadge';
import type { DraftCard } from '../types';

interface GenerateCardsModalProps {
  visible: boolean;
  topicId: string;
  onClose: () => void;
  onGenerated: (cards: DraftCard[], usage: { remaining: number; limit: number; tier: 'free' | 'pro' }) => void;
  onUpgrade?: () => void;
}

export default function GenerateCardsModal({
  visible, topicId, onClose, onGenerated, onUpgrade,
}: GenerateCardsModalProps) {
  const sourceForm = useAiSourceForm();
  const { data: usage } = useGetAiUsageQuery(undefined, { skip: !visible });
  const [generateCards, { isLoading }] = useGenerateCardsMutation();
  const { isPro, requirePro } = useAiProGate(() => onUpgrade?.());

  const handleClose = () => {
    sourceForm.reset();
    onClose();
  };

  const handleGenerate = async () => {
    if (!requirePro()) return;

    if (usage && usage.remaining <= 0 && isPro) {
      Alert.alert(
        'Monthly limit reached',
        usage.tier === 'free'
          ? 'Free plan includes 1 AI generation per month. Upgrade to Pro for unlimited generations.'
          : 'You have used all AI generations for this month.',
        [
          { text: 'Cancel', style: 'cancel' },
          ...(usage.tier === 'free' && onUpgrade ? [{ text: 'Upgrade', onPress: onUpgrade }] : []),
        ],
      );
      return;
    }

    const validationError = sourceForm.validate();
    if (validationError) {
      Alert.alert('Add content', validationError);
      return;
    }

    try {
      const result = await generateCards({ topicId, ...sourceForm.getPayload() }).unwrap();
      onGenerated(result.cards, result.usage);
      sourceForm.reset();
      onClose();
    } catch (err: any) {
      const code = err?.data?.code;
      if (code === 'AI_PRO_REQUIRED' || isAiProRequiredError(err)) {
        onUpgrade?.();
        return;
      }
      if (code === 'AI_LIMIT_REACHED') {
        Alert.alert('Limit reached', err?.data?.message || 'AI generation limit reached.', [
          { text: 'OK' },
          ...(onUpgrade ? [{ text: 'Upgrade', onPress: onUpgrade }] : []),
        ]);
        return;
      }
      if (code === 'AI_NOT_CONFIGURED') {
        Alert.alert('AI unavailable', 'The server is missing OPENAI_API_KEY. Add it to api/.env and restart the API.');
        return;
      }
      Alert.alert('Generation failed', err?.data?.message || 'Could not generate cards. Try again with more content.');
    }
  };

  const usageLabel = usage
    ? isPro
      ? 'Pro · unlimited AI generations'
      : 'Pro feature — upgrade to generate with AI'
    : 'Checking AI usage...';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <Ionicons name="sparkles" size={22} color={colors.primary} />
              <Text style={styles.title}>Generate with AI</Text>
              <ProBadge compact />
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Requires StuhDee Pro subscription. Paste notes, import a PDF, add a URL, or use a photo — review before saving.
          </Text>
          <Text style={styles.usage}>{usageLabel}</Text>

          <ScrollView style={styles.bodyScroll} keyboardShouldPersistTaps="handled">
            <AiSourceForm form={sourceForm} />
          </ScrollView>

          <TouchableOpacity
            style={[styles.generateBtn, isLoading && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color={colors.background} />
                <Text style={styles.generateText}>{sourceForm.generateButtonLabel}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '88%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.h3 },
  subtitle: { ...typography.bodyMuted, marginTop: spacing.xs },
  usage: { ...typography.small, color: colors.primary, marginTop: spacing.sm, marginBottom: spacing.md },
  bodyScroll: { maxHeight: 340, marginBottom: spacing.md },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
  },
  generateBtnDisabled: { opacity: 0.7 },
  generateText: { color: colors.background, fontWeight: '700', fontSize: 16 },
});
