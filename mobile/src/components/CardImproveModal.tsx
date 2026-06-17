import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';
import {
  useImproveCardMutation,
  useUpdateCardMutation,
  useCreateCardMutation,
} from '../services/api';
import type { Card, CardImprovementSuggestion, ImprovementType } from '../types';
import { useAiProGate } from '../hooks/useAiProGate';

const TYPE_META: Record<ImprovementType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  shorten_answer: { icon: 'cut-outline', color: colors.warning },
  split_card: { icon: 'git-branch-outline', color: colors.accent },
  mnemonic: { icon: 'bulb-outline', color: colors.primary },
  clarify_question: { icon: 'help-circle-outline', color: colors.success },
};

interface CardImproveModalProps {
  visible: boolean;
  topicId: string;
  card: Card | null;
  trigger?: 'manual' | 'weak_card';
  onClose: () => void;
  onApplied?: () => void;
  onRequirePro?: () => void;
}

export default function CardImproveModal({
  visible, topicId, card, trigger = 'manual', onClose, onApplied, onRequirePro,
}: CardImproveModalProps) {
  const [improveCard, { isLoading }] = useImproveCardMutation();
  const [updateCard] = useUpdateCardMutation();
  const [createCard] = useCreateCardMutation();
  const { requirePro } = useAiProGate(onRequirePro);
  const [suggestions, setSuggestions] = useState<CardImprovementSuggestion[]>([]);
  const [isWeakCard, setIsWeakCard] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [loadedCardId, setLoadedCardId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !card) {
      setSuggestions([]);
      setLoadedCardId(null);
      return;
    }

    if (loadedCardId === card._id) return;

    if (!requirePro()) {
      onClose();
      return;
    }

    (async () => {
      try {
        const result = await improveCard({
          topicId,
          cardId: card._id,
          trigger,
        }).unwrap();
        setSuggestions(result.suggestions);
        setIsWeakCard(result.isWeakCard);
        setLoadedCardId(card._id);
      } catch (err: any) {
        const code = err?.data?.code;
        if (code === 'AI_PRO_REQUIRED') {
          onRequirePro?.();
          onClose();
          return;
        }
        if (code === 'AI_NOT_CONFIGURED') {
          Alert.alert('AI unavailable', 'Add OPENAI_API_KEY to api/.env and restart the API.');
        } else {
          Alert.alert('Could not analyze card', err?.data?.message || 'Try again later.');
        }
        onClose();
      }
    })();
  }, [visible, card?._id, topicId, trigger]);

  const applySuggestion = async (suggestion: CardImprovementSuggestion) => {
    if (!card) return;
    setApplyingId(suggestion.id);

    try {
      if (suggestion.type === 'split_card') {
        const question = suggestion.suggestedQuestion ?? card.question;
        const answer = suggestion.suggestedAnswer ?? card.answer;
        await updateCard({
          id: card._id,
          topicId,
          data: { topicId, question, answer },
        }).unwrap();

        for (const extra of suggestion.additionalCards ?? []) {
          await createCard({
            topicId,
            question: extra.question,
            answer: extra.answer,
            language: card.language,
          }).unwrap();
        }
        Alert.alert(
          'Card split',
          `Updated this card and added ${suggestion.additionalCards?.length ?? 0} new card(s).`,
        );
      } else if (suggestion.type === 'mnemonic') {
        const baseAnswer = suggestion.suggestedAnswer ?? card.answer;
        const mnemonic = suggestion.mnemonic;
        const answer = mnemonic && !baseAnswer.includes(mnemonic)
          ? `${baseAnswer}\n\nMnemonic: ${mnemonic}`
          : baseAnswer;
        await updateCard({
          id: card._id,
          topicId,
          data: {
            topicId,
            question: suggestion.suggestedQuestion ?? card.question,
            answer,
          },
        }).unwrap();
        Alert.alert('Mnemonic added', 'Your card answer has been updated.');
      } else {
        await updateCard({
          id: card._id,
          topicId,
          data: {
            topicId,
            question: suggestion.suggestedQuestion ?? card.question,
            answer: suggestion.suggestedAnswer ?? card.answer,
          },
        }).unwrap();
        Alert.alert('Card updated', 'Your flashcard has been improved.');
      }

      onApplied?.();
      onClose();
    } catch (err: any) {
      Alert.alert('Update failed', err?.data?.message || 'Could not apply this suggestion.');
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <Ionicons name="sparkles" size={22} color={colors.primary} />
              <Text style={styles.title}>Improve card</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {card && (
            <Text style={styles.cardPreview} numberOfLines={2}>
              {card.question}
            </Text>
          )}

          {isWeakCard && (
            <View style={styles.weakBanner}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.weakBannerText}>This card is struggling in review</Text>
            </View>
          )}

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.loadingText}>Analyzing your flashcard...</Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {suggestions.map((suggestion) => {
                const meta = TYPE_META[suggestion.type];
                return (
                  <View key={suggestion.id} style={styles.suggestionCard}>
                    <View style={styles.suggestionHeader}>
                      <View style={[styles.iconWrap, { backgroundColor: meta.color + '20' }]}>
                        <Ionicons name={meta.icon} size={18} color={meta.color} />
                      </View>
                      <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                    </View>
                    <Text style={styles.suggestionBody}>{suggestion.explanation}</Text>

                    {(suggestion.suggestedQuestion || suggestion.suggestedAnswer) && (
                      <View style={styles.previewBox}>
                        {suggestion.suggestedQuestion && (
                          <Text style={styles.previewLine}>
                            <Text style={styles.previewLabel}>Q: </Text>
                            {suggestion.suggestedQuestion}
                          </Text>
                        )}
                        {suggestion.suggestedAnswer && (
                          <Text style={styles.previewLine}>
                            <Text style={styles.previewLabel}>A: </Text>
                            {suggestion.suggestedAnswer}
                          </Text>
                        )}
                      </View>
                    )}

                    {suggestion.mnemonic && (
                      <View style={styles.mnemonicBox}>
                        <Text style={styles.mnemonicLabel}>Mnemonic</Text>
                        <Text style={styles.mnemonicText}>{suggestion.mnemonic}</Text>
                      </View>
                    )}

                    {suggestion.additionalCards && suggestion.additionalCards.length > 0 && (
                      <View style={styles.previewBox}>
                        <Text style={styles.previewLabel}>+{suggestion.additionalCards.length} new card(s)</Text>
                        {suggestion.additionalCards.map((extra, i) => (
                          <Text key={i} style={styles.previewLine} numberOfLines={2}>
                            {extra.question}
                          </Text>
                        ))}
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.applyBtn, applyingId === suggestion.id && styles.applyBtnDisabled]}
                      onPress={() => applySuggestion(suggestion)}
                      disabled={applyingId !== null}
                    >
                      {applyingId === suggestion.id ? (
                        <ActivityIndicator color={colors.background} size="small" />
                      ) : (
                        <Text style={styles.applyText}>Apply suggestion</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}
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
    maxHeight: '88%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.h3 },
  cardPreview: { ...typography.bodyMuted, marginTop: spacing.sm, marginBottom: spacing.sm },
  weakBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.error + '15', borderRadius: radius.md,
    padding: spacing.sm, marginBottom: spacing.md,
  },
  weakBannerText: { color: colors.error, fontSize: 13, fontWeight: '600' },
  loadingBox: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  loadingText: { ...typography.bodyMuted },
  list: { maxHeight: 420 },
  suggestionCard: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  suggestionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  suggestionTitle: { ...typography.h4, flex: 1 },
  suggestionBody: { ...typography.body, fontSize: 14, color: colors.textSecondary, marginBottom: spacing.sm },
  previewBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewLabel: { ...typography.label, fontSize: 10 },
  previewLine: { ...typography.body, fontSize: 13, marginTop: 4 },
  mnemonicBox: {
    backgroundColor: colors.primary + '12',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  mnemonicLabel: { ...typography.label, color: colors.primary, fontSize: 10 },
  mnemonicText: { ...typography.body, fontSize: 13, marginTop: 4 },
  applyBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  applyBtnDisabled: { opacity: 0.7 },
  applyText: { color: colors.background, fontWeight: '700', fontSize: 14 },
});
