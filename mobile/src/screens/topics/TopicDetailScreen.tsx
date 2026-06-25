import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Modal, Animated, Keyboard, Platform, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type CompositeNavigationProp, type RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, typography, shadow } from '../../theme';
import { useGetCardsQuery, useGetTopicQuery, useCreateCardMutation, useUpdateCardMutation, useDeleteCardMutation } from '../../services/api';
import type { TopicsStackParamList, MainTabParamList, Card } from '../../types';
import { TopicIcon } from '../../constants/topicIcons';
import { getLanguageLabel } from '../../constants/languages';
import MultilingualTextInput from '../../components/MultilingualTextInput';
import GenerateCardsModal from '../../components/GenerateCardsModal';
import ReviewGeneratedCardsModal from '../../components/ReviewGeneratedCardsModal';
import CardImproveModal from '../../components/CardImproveModal';
import MultilingualAiToolbar from '../../components/MultilingualAiToolbar';
import type { DraftCard } from '../../types';
import { isWeakCard } from '../../utils/cardStats';
import { useAiProGate } from '../../hooks/useAiProGate';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<TopicsStackParamList, 'TopicDetail'>,
  BottomTabNavigationProp<MainTabParamList>
>;
type Route = RouteProp<TopicsStackParamList, 'TopicDetail'>;

const MIN_CARD_HEIGHT = 120;

function AnimatedCard({ card, index, onFlip, isFlipped, onDelete, onImprove, onEdit }: {
  card: Card; index: number; isFlipped: boolean;
  onFlip: () => void; onDelete: () => void; onImprove: () => void; onEdit: () => void;
}) {
  const [frontHeight, setFrontHeight] = useState(0);
  const [backHeight, setBackHeight] = useState(0);
  const cardHeight = Math.max(frontHeight, backHeight, MIN_CARD_HEIGHT);

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
  const weak = isWeakCard(card);

  const handleLongPress = () => {
    Alert.alert('Card options', undefined, [
      { text: 'Edit', onPress: onEdit },
      { text: 'Improve with AI', onPress: onImprove },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Animated.View style={{
      opacity: entranceAnim,
      transform: [
        { translateY: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
        { scale: Animated.multiply(pressScale, entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] })) },
      ],
      marginBottom: spacing.sm,
    }}>
      {/* Measure both faces so the flip container fits the taller side */}
      <View style={styles.measureContainer} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <View style={styles.measureFace} onLayout={(e) => setFrontHeight(e.nativeEvent.layout.height)}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardSide}><Text style={styles.cardSideText}>QUESTION</Text></View>
            {weak && (
              <View style={styles.weakBadge}>
                <Ionicons name="alert-circle" size={12} color={colors.error} />
                <Text style={styles.weakBadgeText}>Needs work</Text>
              </View>
            )}
            {accuracy !== null && (
              <Text style={[styles.accuracyText, { color: accuracy >= 70 ? colors.success : accuracy >= 40 ? colors.warning : colors.error }]}>
                {accuracy}%
              </Text>
            )}
          </View>
          <Text style={styles.cardText}>{card.question}</Text>
          <Text style={styles.cardMeta}>
            {card.timesReviewed > 0 ? `Reviewed ${card.timesReviewed}× · tap to flip` : 'Tap to flip'}
          </Text>
        </View>
        <View style={styles.measureFace} onLayout={(e) => setBackHeight(e.nativeEvent.layout.height)}>
          <View style={styles.cardTopRow}>
            <View style={[styles.cardSide, { backgroundColor: colors.primary + '30' }]}>
              <Text style={[styles.cardSideText, { color: colors.primaryLight }]}>ANSWER</Text>
            </View>
            <View style={styles.cardBackActions}>
              <View style={styles.improveBtn}><Ionicons name="pencil" size={16} color={colors.textSecondary} /></View>
              <View style={styles.improveBtn}><Ionicons name="sparkles" size={16} color={colors.primary} /></View>
            </View>
          </View>
          <Text style={[styles.cardText, { color: colors.primaryLight }]}>{card.answer}</Text>
          <Text style={styles.cardMeta}>Long press for edit, AI, or delete</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.cardOuter, { height: cardHeight }]}
        onPress={onFlip}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Front face */}
        <Animated.View style={[styles.cardFace, styles.cardFront, { transform: [{ rotateY: frontRotate }] }]}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardSide}><Text style={styles.cardSideText}>QUESTION</Text></View>
            {weak && (
              <View style={styles.weakBadge}>
                <Ionicons name="alert-circle" size={12} color={colors.error} />
                <Text style={styles.weakBadgeText}>Needs work</Text>
              </View>
            )}
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
            <View style={styles.cardBackActions}>
              <TouchableOpacity style={styles.improveBtn} onPress={onEdit} hitSlop={8}>
                <Ionicons name="pencil" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.improveBtn} onPress={onImprove} hitSlop={8}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.cardText, { color: colors.primaryLight }]}>{card.answer}</Text>
          <Text style={styles.cardMeta}>Long press for edit, AI, or delete</Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function TopicDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { topicId, topicTitle } = route.params;
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const { data: topic } = useGetTopicQuery(topicId);
  const { data: cards, isLoading } = useGetCardsQuery(topicId);
  const [createCard, { isLoading: creating }] = useCreateCardMutation();
  const [updateCard, { isLoading: updating }] = useUpdateCardMutation();
  const [deleteCard] = useDeleteCardMutation();

  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showImproveModal, setShowImproveModal] = useState(false);
  const [improveCard, setImproveCard] = useState<Card | null>(null);
  const [improveTrigger, setImproveTrigger] = useState<'manual' | 'weak_card'>('manual');
  const { requirePro } = useAiProGate();
  const [generatedCards, setGeneratedCards] = useState<DraftCard[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const headerAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;
  const modalScrollRef = useRef<ScrollView>(null);
  const questionSectionY = useRef(0);
  const answerSectionY = useRef(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const scrollModalToSection = (y: number) => {
    setTimeout(() => modalScrollRef.current?.scrollTo({ y: Math.max(0, y - spacing.sm), animated: true }), 80);
  };

  const closeCardModal = () => {
    setShowModal(false);
    setEditingCard(null);
    setQuestion('');
    setAnswer('');
    setKeyboardHeight(0);
    Keyboard.dismiss();
  };

  const openModal = () => {
    setEditingCard(null);
    setQuestion('');
    setAnswer('');
    setShowModal(true);
    modalAnim.setValue(0);
    Animated.spring(modalAnim, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }).start();
  };

  const openEditModal = (card: Card) => {
    setEditingCard(card);
    setQuestion(card.question);
    setAnswer(card.answer);
    setShowModal(true);
    modalAnim.setValue(0);
    Animated.spring(modalAnim, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }).start();
  };

  const modalMaxHeight = keyboardHeight > 0
    ? windowHeight - keyboardHeight - spacing.sm
    : windowHeight * 0.88;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
  }, []);

  const frontLang = topic?.sourceLanguage ?? 'en';
  const backLang = topic?.language ?? 'en';
  const isSaving = creating || updating;

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) {
      Alert.alert('Error', 'Both question and answer are required');
      return;
    }
    try {
      if (editingCard) {
        await updateCard({
          id: editingCard._id,
          topicId,
          data: {
            question: question.trim(),
            answer: answer.trim(),
            language: backLang,
          },
        }).unwrap();
      } else {
        await createCard({
          topicId,
          question: question.trim(),
          answer: answer.trim(),
          language: backLang,
        }).unwrap();
      }
      closeCardModal();
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message || `Failed to ${editingCard ? 'update' : 'create'} card`);
    }
  };

  const handleDelete = (card: Card) => {
    Alert.alert('Delete Card', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCard({ id: card._id, topicId }) },
    ]);
  };

  const openImprove = (card: Card, trigger: 'manual' | 'weak_card' = 'manual') => {
    if (!requirePro()) return;
    setImproveCard(card);
    setImproveTrigger(isWeakCard(card) ? 'weak_card' : trigger);
    setShowImproveModal(true);
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
          <TopicIcon emoji={topic?.emoji || 'book'} size={22} color={topic?.color || colors.primary} />
          <Text style={styles.title}>{topicTitle}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.aiBtn} onPress={() => setShowGenerateModal(true)}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={openModal}>
            <Ionicons name="add" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>
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
            onPress={() => navigation.navigate('QuizTab', {
              screen: 'QuizSession',
              params: { topicId, topicTitle },
            })}
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
          <View style={styles.emptyIcon}>
            <Ionicons name="layers-outline" size={52} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No cards yet</Text>
          <Text style={styles.emptySubtitle}>Add cards manually or generate a deck with AI</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={openModal}>
            <Text style={styles.emptyBtnText}>Add Card</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.emptyAiBtn} onPress={() => setShowGenerateModal(true)}>
            <Ionicons name="sparkles" size={18} color={colors.primary} />
            <Text style={styles.emptyAiBtnText}>Generate with AI</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.tapHint}>Tap to flip · Long press to edit, improve, or delete</Text>
          {cards?.map((card, i) => (
            <AnimatedCard
              key={card._id}
              card={card}
              index={i}
              isFlipped={flippedCards.has(card._id)}
              onFlip={() => toggleFlip(card._id)}
              onDelete={() => handleDelete(card)}
              onImprove={() => openImprove(card)}
              onEdit={() => openEditModal(card)}
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
            marginBottom: keyboardHeight,
            maxHeight: modalMaxHeight,
            paddingBottom: keyboardHeight > 0 ? spacing.md : Math.max(insets.bottom, spacing.lg),
          }]}>
            <View style={styles.modalHandle} />
            <ScrollView
              ref={modalScrollRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text style={styles.modalTitle}>{editingCard ? 'Edit Flashcard' : 'New Flashcard'}</Text>
              <Text style={styles.modalSubtitle}>
                {getLanguageLabel(frontLang)} front · {getLanguageLabel(backLang)} back
              </Text>

              <View onLayout={(e) => { questionSectionY.current = e.nativeEvent.layout.y; }}>
                <Text style={styles.inputLabel}>QUESTION — {getLanguageLabel(frontLang).toUpperCase()}</Text>
                <MultilingualTextInput
                  languageCode={frontLang}
                  placeholder={`Type the ${getLanguageLabel(frontLang).toLowerCase()} prompt...`}
                  value={question}
                  onChangeText={setQuestion}
                  onFocus={() => scrollModalToSection(questionSectionY.current)}
                  multiline
                  numberOfLines={3}
                  autoFocus={!editingCard}
                  textAlignVertical="top"
                />
              </View>

              <View
                style={{ marginTop: spacing.md }}
                onLayout={(e) => { answerSectionY.current = e.nativeEvent.layout.y; }}
              >
                <Text style={styles.inputLabel}>
                  ANSWER — {getLanguageLabel(backLang).toUpperCase()}
                </Text>
                <MultilingualTextInput
                  languageCode={backLang}
                  placeholder="Type or tap characters below..."
                  value={answer}
                  onChangeText={setAnswer}
                  onFocus={() => scrollModalToSection(answerSectionY.current)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {(frontLang !== backLang || frontLang !== 'en' || backLang !== 'en') && (
                <MultilingualAiToolbar
                  topicId={topicId}
                  sourceLanguage={frontLang}
                  language={backLang}
                  question={question}
                  answer={answer}
                  onQuestionChange={setQuestion}
                  onAnswerChange={setAnswer}
                  onReverseCard={(q, a) => {
                    setQuestion(q);
                    setAnswer(a);
                  }}
                  onRequirePro={requirePro}
                />
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeCardModal}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.createBtn} onPress={handleSave} disabled={isSaving}>
                  {isSaving ? <ActivityIndicator color={colors.white} /> : (
                    <Text style={styles.createText}>{editingCard ? 'Save Changes' : 'Add Card'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <GenerateCardsModal
        visible={showGenerateModal}
        topicId={topicId}
        onClose={() => setShowGenerateModal(false)}
        onUpgrade={() => {
          setShowGenerateModal(false);
          requirePro();
        }}
        onGenerated={(cards) => {
          setGeneratedCards(cards);
          setShowReviewModal(true);
        }}
      />

      <ReviewGeneratedCardsModal
        visible={showReviewModal}
        topicId={topicId}
        initialCards={generatedCards}
        onClose={() => {
          setShowReviewModal(false);
          setGeneratedCards([]);
        }}
        onSaved={(count) => {
          setShowReviewModal(false);
          setGeneratedCards([]);
          Alert.alert('Cards added', `${count} flashcard${count === 1 ? '' : 's'} added to this deck.`);
        }}
      />

      <CardImproveModal
        visible={showImproveModal}
        topicId={topicId}
        card={improveCard}
        trigger={improveTrigger}
        onRequirePro={requirePro}
        onClose={() => {
          setShowImproveModal(false);
          setImproveCard(null);
        }}
      />
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  aiBtn: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.primary + '35',
  },
  addBtn: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  metaText: { fontSize: 13, fontWeight: '600' },
  quizBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  quizBtnText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  emptyIcon: {
    width: 96, height: 96, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
  },
  emptyTitle: { ...typography.h3, marginTop: spacing.md },
  emptySubtitle: { ...typography.bodyMuted, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  emptyBtn: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  emptyBtnText: { ...typography.h4, color: colors.white },
  emptyAiBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.primary + '40',
    backgroundColor: colors.primary + '12',
  },
  emptyAiBtnText: { color: colors.primary, fontWeight: '700' },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  tapHint: { ...typography.small, textAlign: 'center', marginBottom: spacing.md, color: colors.textMuted, fontSize: 12 },
  measureContainer: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    zIndex: -1,
  },
  measureFace: {
    padding: spacing.lg,
    width: '100%',
  },
  cardOuter: {
    minHeight: MIN_CARD_HEIGHT,
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    ...shadow.sm,
  },
  cardFace: {
    position: 'absolute', width: '100%', height: '100%',
    borderRadius: radius.lg, padding: spacing.lg,
    backfaceVisibility: 'hidden',
    flexDirection: 'column',
  },
  cardFront: { backgroundColor: colors.surface },
  cardBack: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.primary + '30' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  cardSide: { backgroundColor: colors.surfaceElevated, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  cardSideText: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 },
  accuracyText: { fontSize: 12, fontWeight: '600' },
  weakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.error + '18', borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  weakBadgeText: { fontSize: 10, fontWeight: '700', color: colors.error },
  improveBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center',
  },
  cardBackActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardText: { ...typography.body, lineHeight: 22, fontSize: 15, flexShrink: 0 },
  cardMeta: { ...typography.small, fontSize: 11, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  modalScrollContent: { paddingBottom: spacing.sm },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  modalTitle: { ...typography.h3, marginBottom: 4 },
  modalSubtitle: { ...typography.small, marginBottom: spacing.md },
  inputLabel: { ...typography.label, marginBottom: spacing.xs },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingVertical: spacing.md, alignItems: 'center' },
  cancelText: { ...typography.body, color: colors.textSecondary },
  createBtn: { flex: 2, borderRadius: radius.full, paddingVertical: spacing.md, alignItems: 'center', backgroundColor: colors.primary },
  createText: { ...typography.h4, color: colors.white },
});
