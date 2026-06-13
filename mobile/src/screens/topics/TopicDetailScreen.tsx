import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal, Animated,
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

function AnimatedCard({ card, index, onFlip, isFlipped, onDelete }: {
  card: Card; index: number; isFlipped: boolean;
  onFlip: () => void; onDelete: () => void;
}) {
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(entranceAnim, {
      toValue: 1, tension: 55, friction: 8,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 1 : 0,
      tension: 50, friction: 6, useNativeDriver: true,
    }).start();
  }, [isFlipped]);

  const handlePressIn = () => Animated.spring(pressScale, { toValue: 0.97, tension: 200, friction: 5, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(pressScale, { toValue: 1, tension: 200, friction: 5, useNativeDriver: true }).start();

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const accuracy = card.timesReviewed > 0 ? Math.round((card.timesCorrect / card.timesReviewed) * 100) : null;

  return (
    <Animated.View style={{
      opacity: entranceAnim,
      transform: [
        { translateY: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
        { scale: Animated.multiply(pressScale, entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] })) },
      ],
      marginBottom: spacing.sm,
    }}>
      <TouchableOpacity
        style={styles.cardOuter}
        onPress={onFlip}
        onLongPress={onDelete}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Front face */}
        <Animated.View style={[styles.cardFace, styles.cardFront, { transform: [{ rotateY: frontRotate }] }]}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardSide}><Text style={styles.cardSideText}>QUESTION</Text></View>
            {accuracy !== null && (
              <Text style={[styles.accuracyText, { color: accuracy >= 70 ? colors.success : accuracy >= 40 ? colors.warning : colors.error }]}>
                {accuracy}%
              </Text>
            )}
          </View>
          <Text style={styles.cardText}>{card.question}</Text>
          {card.timesReviewed > 0 && (
            <Text style={styles.cardMeta}>Reviewed {card.timesReviewed}× · tap to flip</Text>
          )}
          {card.timesReviewed === 0 && (
            <Text style={styles.cardMeta}>Tap to flip</Text>
          )}
        </Animated.View>

        {/* Back face */}
        <Animated.View style={[styles.cardFace, styles.cardBack, { transform: [{ rotateY: backRotate }] }]}>
          <View style={styles.cardTopRow}>
            <View style={[styles.cardSide, { backgroundColor: colors.primary + '30' }]}>
              <Text style={[styles.cardSideText, { color: colors.primaryLight }]}>ANSWER</Text>
            </View>
          </View>
          <Text style={[styles.cardText, { color: colors.primaryLight }]}>{card.answer}</Text>
          <Text style={styles.cardMeta}>Long press to delete</Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

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

  const headerAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
  }, []);

  const openModal = () => {
    setShowModal(true);
    modalAnim.setValue(0);
    Animated.spring(modalAnim, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }).start();
  };

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
    Alert.alert('Delete Card', 'Are you sure?', [
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
      <Animated.View style={[styles.header, {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
      }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.topicEmoji}>{topic?.emoji || '📚'}</Text>
          <Text style={styles.title}>{topicTitle}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openModal}>
          <Ionicons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.metaRow, {
        opacity: headerAnim,
        transform: [{ translateX: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
      }]}>
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
      </Animated.View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      ) : cards?.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 56 }}>🃏</Text>
          <Text style={styles.emptyTitle}>No cards yet</Text>
          <Text style={styles.emptySubtitle}>Add your first flashcard to this topic</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={openModal}>
            <Text style={styles.emptyBtnText}>Add Card</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.tapHint}>Tap a card to flip · Long press to delete</Text>
          {cards?.map((card, i) => (
            <AnimatedCard
              key={card._id}
              card={card}
              index={i}
              isFlipped={flippedCards.has(card._id)}
              onFlip={() => toggleFlip(card._id)}
              onDelete={() => handleDelete(card)}
            />
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, {
            transform: [{ translateY: modalAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }],
            opacity: modalAnim,
          }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Flashcard</Text>
            <Text style={styles.modalSubtitle}>{topicTitle}</Text>

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
          </Animated.View>
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
  tapHint: { ...typography.small, textAlign: 'center', marginBottom: spacing.md, color: colors.textMuted, fontSize: 12 },
  cardOuter: {
    height: 160, backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    ...shadow.sm,
  },
  cardFace: {
    position: 'absolute', width: '100%', height: '100%',
    borderRadius: radius.lg, padding: spacing.lg,
    backfaceVisibility: 'hidden',
  },
  cardFront: { backgroundColor: colors.surface },
  cardBack: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.primary + '30' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  cardSide: { backgroundColor: colors.surfaceElevated, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  cardSideText: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 },
  accuracyText: { fontSize: 12, fontWeight: '600' },
  cardText: { ...typography.body, lineHeight: 22, fontSize: 15, flex: 1 },
  cardMeta: { ...typography.small, fontSize: 11, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  modalTitle: { ...typography.h3, marginBottom: 4 },
  modalSubtitle: { ...typography.small, marginBottom: spacing.md },
  inputLabel: { ...typography.label, marginBottom: spacing.xs },
  textArea: {
    backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, ...typography.body, color: colors.textPrimary, minHeight: 90,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingVertical: spacing.md, alignItems: 'center' },
  cancelText: { ...typography.body, color: colors.textSecondary },
  createBtn: { flex: 2, borderRadius: radius.full, paddingVertical: spacing.md, alignItems: 'center', backgroundColor: colors.primary },
  createText: { ...typography.h4, color: colors.white },
});
