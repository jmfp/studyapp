import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { colors, spacing, radius, typography, shadow } from '../../theme';
import { useGetCardsQuery, useGetTopicQuery, useCreateCardMutation, useDeleteCardMutation } from '../../services/api';
import type { TopicsStackParamList, Card } from '../../types';

type Nav = NativeStackNavigationProp<TopicsStackParamList, 'TopicDetail'>;
type Route = RouteProp<TopicsStackParamList, 'TopicDetail'>;

export default function TopicDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { topicId, topicTitle } = route.params;

  const { data: topic } = useGetTopicQuery(topicId);
  const { data: cards, isLoading } = useGetCardsQuery(topicId);
  const [createCard, { isLoading: creating }] = useCreateCardMutation();
  const [deleteCard] = useDeleteCardMutation();

  const [showModal, setShowModal] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const handleCreate = async () => {
    if (!question.trim() || !answer.trim()) {
      Alert.alert('Error', 'Both question and answer are required');
      return;
    }
    try {
      await createCard({ topicId, question: question.trim(), answer: answer.trim() }).unwrap();
      setQuestion(''); setAnswer('');
      setShowModal(false);
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message || 'Failed to create card');
    }
  };

  const handleDelete = (card: Card) => {
    Alert.alert('Delete Card', 'Are you sure you want to delete this card?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCard({ id: card._id, topicId }) },
    ]);
  };

  const toggleFlip = (id: string) => {
    setFlippedCards((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.topicEmoji}>{topic?.emoji || '📚'}</Text>
          <Text style={styles.title}>{topicTitle}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.metaRow}>
        <View style={[styles.metaChip, { backgroundColor: (topic?.color || colors.primary) + '20' }]}>
          <Ionicons name="layers-outline" size={14} color={topic?.color || colors.primary} />
          <Text style={[styles.metaText, { color: topic?.color || colors.primary }]}>{cards?.length || 0} cards</Text>
        </View>
        {cards && cards.length > 0 && (
          <TouchableOpacity
            style={styles.quizBtn}
            onPress={() => navigation.navigate('QuizSession' as any, { topicId, topicTitle })}
          >
            <Ionicons name="play" size={14} color={colors.white} />
            <Text style={styles.quizBtnText}>Start Quiz</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      ) : cards?.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 56 }}>🃏</Text>
          <Text style={styles.emptyTitle}>No cards yet</Text>
          <Text style={styles.emptySubtitle}>Add your first flashcard to this topic</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)}>
            <Text style={styles.emptyBtnText}>Add Card</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.tapHint}>Tap a card to reveal the answer</Text>
          {cards?.map((card) => {
            const isFlipped = flippedCards.has(card._id);
            const accuracy = card.timesReviewed > 0 ? Math.round((card.timesCorrect / card.timesReviewed) * 100) : null;
            return (
              <TouchableOpacity
                key={card._id}
                style={[styles.card, isFlipped && styles.cardFlipped]}
                onPress={() => toggleFlip(card._id)}
                onLongPress={() => handleDelete(card)}
                activeOpacity={0.9}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.cardSide, { backgroundColor: isFlipped ? colors.primary + '20' : colors.surfaceElevated }]}>
                    <Text style={styles.cardSideText}>{isFlipped ? 'ANSWER' : 'QUESTION'}</Text>
                  </View>
                  {accuracy !== null && (
                    <Text style={[styles.accuracyText, { color: accuracy >= 70 ? colors.success : accuracy >= 40 ? colors.warning : colors.error }]}>
                      {accuracy}% accuracy
                    </Text>
                  )}
                </View>
                <Text style={[styles.cardText, isFlipped && { color: colors.primaryLight }]}>
                  {isFlipped ? card.answer : card.question}
                </Text>
                {card.timesReviewed > 0 && (
                  <View style={styles.cardStats}>
                    <Text style={styles.cardStatText}>Reviewed {card.timesReviewed}x</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Flashcard</Text>
            <Text style={styles.modalSubtitle}>For: {topicTitle}</Text>

            <Text style={styles.inputLabel}>QUESTION (FRONT)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Type your question here..."
              placeholderTextColor={colors.textMuted}
              value={question}
              onChangeText={setQuestion}
              multiline
              numberOfLines={3}
              autoFocus
              textAlignVertical="top"
            />

            <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>ANSWER (BACK)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Type the answer here..."
              placeholderTextColor={colors.textMuted}
              value={answer}
              onChangeText={setAnswer}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowModal(false); setQuestion(''); setAnswer(''); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={creating}>
                {creating ? <ActivityIndicator color={colors.white} /> : <Text style={styles.createText}>Add Card</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.md,
  },
  backBtn: { padding: spacing.xs },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, paddingHorizontal: spacing.sm },
  topicEmoji: { fontSize: 24 },
  title: { ...typography.h3, flex: 1 },
  addBtn: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  metaText: { fontSize: 13, fontWeight: '600' },
  quizBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  quizBtnText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  emptyTitle: { ...typography.h3, marginTop: spacing.md },
  emptySubtitle: { ...typography.bodyMuted, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  emptyBtn: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  emptyBtnText: { ...typography.h4, color: colors.white },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  tapHint: { ...typography.small, textAlign: 'center', marginBottom: spacing.md, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border, ...shadow.sm,
  },
  cardFlipped: { borderColor: colors.primary + '50', backgroundColor: colors.surfaceElevated },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  cardSide: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  cardSideText: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.8 },
  accuracyText: { fontSize: 12, fontWeight: '600' },
  cardText: { ...typography.body, lineHeight: 24, fontSize: 16 },
  cardStats: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  cardStatText: { ...typography.small, fontSize: 11 },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  modalTitle: { ...typography.h3, marginBottom: 4 },
  modalSubtitle: { ...typography.small, marginBottom: spacing.md },
  inputLabel: { ...typography.label, marginBottom: spacing.xs },
  textArea: {
    backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, ...typography.body, color: colors.textPrimary,
    minHeight: 90,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingVertical: spacing.md, alignItems: 'center' },
  cancelText: { ...typography.body, color: colors.textSecondary },
  createBtn: { flex: 2, borderRadius: radius.full, paddingVertical: spacing.md, alignItems: 'center', backgroundColor: colors.primary },
  createText: { ...typography.h4, color: colors.white },
});
