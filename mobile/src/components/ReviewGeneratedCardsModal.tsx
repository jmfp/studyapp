import React, { useState } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';
import { useBulkCreateCardsMutation } from '../services/api';
import type { DraftCard } from '../types';

interface ReviewGeneratedCardsModalProps {
  visible: boolean;
  topicId: string;
  initialCards: DraftCard[];
  onClose: () => void;
  onSaved: (count: number) => void;
}

type EditableCard = DraftCard & { id: string; selected: boolean };

function toEditable(cards: DraftCard[]): EditableCard[] {
  return cards.map((card, index) => ({
    ...card,
    id: `${index}-${card.question.slice(0, 12)}`,
    selected: true,
  }));
}

export default function ReviewGeneratedCardsModal({
  visible, topicId, initialCards, onClose, onSaved,
}: ReviewGeneratedCardsModalProps) {
  const [cards, setCards] = useState<EditableCard[]>([]);
  const [bulkCreate, { isLoading }] = useBulkCreateCardsMutation();

  React.useEffect(() => {
    if (visible && initialCards.length > 0) {
      setCards(toEditable(initialCards));
    }
  }, [visible, initialCards]);

  const selectedCount = cards.filter((c) => c.selected).length;

  const updateCard = (id: string, field: 'question' | 'answer', value: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const toggleCard = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)));
  };

  const removeCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSave = async () => {
    const payload = cards
      .filter((c) => c.selected)
      .map((c) => ({ question: c.question.trim(), answer: c.answer.trim() }))
      .filter((c) => c.question && c.answer);

    if (payload.length === 0) {
      Alert.alert('No cards selected', 'Select at least one card to add to your deck.');
      return;
    }

    try {
      const result = await bulkCreate({ topicId, cards: payload }).unwrap();
      onSaved(result.count);
      onClose();
    } catch (err: any) {
      Alert.alert('Save failed', err?.data?.message || 'Could not save cards.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Review generated cards</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Edit or deselect cards before adding them to your deck. Nothing is saved until you confirm.
          </Text>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {cards.map((card, index) => (
              <View key={card.id} style={[styles.card, !card.selected && styles.cardDeselected]}>
                <View style={styles.cardHeader}>
                  <TouchableOpacity style={styles.checkBtn} onPress={() => toggleCard(card.id)}>
                    <Ionicons
                      name={card.selected ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={card.selected ? colors.primary : colors.textMuted}
                    />
                  </TouchableOpacity>
                  <Text style={styles.cardIndex}>Card {index + 1}</Text>
                  <TouchableOpacity onPress={() => removeCard(card.id)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.label}>QUESTION</Text>
                <TextInput
                  style={styles.input}
                  value={card.question}
                  onChangeText={(v) => updateCard(card.id, 'question', v)}
                  multiline
                />
                <Text style={styles.label}>ANSWER</Text>
                <TextInput
                  style={styles.input}
                  value={card.answer}
                  onChangeText={(v) => updateCard(card.id, 'answer', v)}
                  multiline
                />
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.saveBtn, (isLoading || selectedCount === 0) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isLoading || selectedCount === 0}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.saveText}>Add {selectedCount} card{selectedCount === 1 ? '' : 's'} to deck</Text>
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
    maxHeight: '92%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h3, flex: 1, paddingRight: spacing.md },
  subtitle: { ...typography.bodyMuted, marginTop: spacing.xs, marginBottom: spacing.md },
  list: { maxHeight: 420, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardDeselected: { opacity: 0.55 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  checkBtn: { padding: 2 },
  cardIndex: { ...typography.label, flex: 1 },
  label: { ...typography.label, fontSize: 10, marginBottom: 4, marginTop: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    color: colors.textPrimary,
    fontSize: 14,
    minHeight: 44,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: colors.background, fontWeight: '700', fontSize: 16 },
});
