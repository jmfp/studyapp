import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, typography, shadow } from '../../theme';
import { useGetTopicsQuery, useCreateTopicMutation, useDeleteTopicMutation } from '../../services/api';
import type { TopicsStackParamList, Topic } from '../../types';

type Nav = NativeStackNavigationProp<TopicsStackParamList, 'TopicList'>;

const EMOJIS = ['📚', '🧠', '🌍', '🔢', '🎵', '🔬', '🏛️', '💻', '🎨', '📖', '🗣️', '✍️'];
const COLORS = ['#6C63FF', '#FF6B9D', '#4CAF50', '#FF9800', '#00BCD4', '#9C27B0', '#F44336', '#2196F3'];
const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
  { code: 'ko', label: 'Korean', flag: '🇰🇷' },
  { code: 'it', label: 'Italian', flag: '🇮🇹' },
  { code: 'pt', label: 'Portuguese', flag: '🇵🇹' },
  { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { code: 'ru', label: 'Russian', flag: '🇷🇺' },
  { code: 'other', label: 'Other', flag: '🌐' },
];

function AnimatedTopicCard({ topic, index, onPress, onLongPress }: {
  topic: Topic; index: number;
  onPress: () => void; onLongPress: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, tension: 60, friction: 8,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(pressScale, { toValue: 0.96, tension: 200, friction: 5, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressScale, { toValue: 1, tension: 200, friction: 5, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[{
      opacity: anim,
      transform: [
        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) },
        { scale: pressScale },
      ],
    }]}>
      <TouchableOpacity
        style={[styles.topicCard, { borderLeftColor: topic.color, borderLeftWidth: 4 }]}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={[styles.emojiContainer, { backgroundColor: topic.color + '20' }]}>
          <Text style={styles.emoji}>{topic.emoji}</Text>
        </View>
        <View style={styles.topicInfo}>
          <Text style={styles.topicTitle}>{topic.title}</Text>
          {topic.description ? <Text style={styles.topicDesc} numberOfLines={1}>{topic.description}</Text> : null}
          <View style={styles.topicMeta}>
            <View style={styles.metaChip}>
              <Ionicons name="layers-outline" size={12} color={colors.textMuted} />
              <Text style={styles.metaText}>{topic.cardCount} cards</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>
                {LANGUAGES.find((l) => l.code === topic.language)?.flag || '🌐'} {topic.language.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function TopicListScreen() {
  const navigation = useNavigation<Nav>();
  const { data: topics, isLoading } = useGetTopicsQuery();
  const [createTopic, { isLoading: creating }] = useCreateTopicMutation();
  const [deleteTopic] = useDeleteTopicMutation();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📚');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedLang, setSelectedLang] = useState('en');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const addBtnAnim = useRef(new Animated.Value(0)).current;
  const modalContentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(80, [
      Animated.spring(headerAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.spring(addBtnAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  const openModal = () => {
    setShowModal(true);
    modalContentAnim.setValue(0);
    Animated.spring(modalContentAnim, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }).start();
  };

  const handleCreate = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Topic title is required'); return; }
    try {
      await createTopic({ title: title.trim(), description: description.trim(), emoji: selectedEmoji, color: selectedColor, language: selectedLang }).unwrap();
      setShowModal(false);
      setTitle(''); setDescription(''); setSelectedEmoji('📚'); setSelectedColor(COLORS[0]); setSelectedLang('en');
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message || 'Failed to create topic');
    }
  };

  const handleDelete = (topic: Topic) => {
    Alert.alert('Delete Topic', `Delete "${topic.title}" and all its cards?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTopic(topic._id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.Text style={[styles.title, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
        }]}>
          My Topics
        </Animated.Text>
        <Animated.View style={{
          transform: [{ scale: addBtnAnim }],
          opacity: addBtnAnim,
        }}>
          <TouchableOpacity style={styles.addBtn} onPress={openModal}>
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      ) : topics?.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 64 }}>📚</Text>
          <Text style={styles.emptyTitle}>No topics yet</Text>
          <Text style={styles.emptySubtitle}>Create your first topic to get started</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={openModal}>
            <Text style={styles.emptyBtnText}>Create Topic</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {topics?.map((topic, i) => (
            <AnimatedTopicCard
              key={topic._id}
              topic={topic}
              index={i}
              onPress={() => navigation.navigate('TopicDetail', { topicId: topic._id, topicTitle: topic.title })}
              onLongPress={() => handleDelete(topic)}
            />
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, {
            transform: [{ translateY: modalContentAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }],
            opacity: modalContentAnim,
          }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Topic</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Topic title"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
            <TextInput
              style={[styles.modalInput, { marginTop: spacing.sm }]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.pickerLabel}>ICON</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
              {EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiOption, selectedEmoji === e && { backgroundColor: selectedColor + '30', borderColor: selectedColor }]}
                  onPress={() => setSelectedEmoji(e)}
                >
                  <Text style={{ fontSize: 24 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.pickerLabel}>COLOR</Text>
            <View style={styles.colorRow}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotSelected]}
                  onPress={() => setSelectedColor(c)}
                />
              ))}
            </View>

            <Text style={styles.pickerLabel}>LANGUAGE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langRow}>
              {LANGUAGES.map((l) => (
                <TouchableOpacity
                  key={l.code}
                  style={[styles.langChip, selectedLang === l.code && { backgroundColor: selectedColor + '30', borderColor: selectedColor }]}
                  onPress={() => setSelectedLang(l.code)}
                >
                  <Text style={styles.langFlag}>{l.flag}</Text>
                  <Text style={[styles.langLabel, selectedLang === l.code && { color: colors.white }]}>{l.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.createBtn, { backgroundColor: selectedColor }]} onPress={handleCreate} disabled={creating}>
                {creating ? <ActivityIndicator color={colors.white} /> : <Text style={styles.createText}>Create</Text>}
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.lg,
  },
  title: { ...typography.h1 },
  addBtn: {
    width: 46, height: 46, borderRadius: radius.full,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    ...shadow.md,
  },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  emptyTitle: { ...typography.h3, marginTop: spacing.md },
  emptySubtitle: { ...typography.bodyMuted, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  emptyBtn: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  emptyBtnText: { ...typography.h4, color: colors.white },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  topicCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border, ...shadow.sm,
  },
  emojiContainer: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 26 },
  topicInfo: { flex: 1 },
  topicTitle: { ...typography.h4, marginBottom: 2 },
  topicDesc: { ...typography.small, marginBottom: spacing.xs },
  topicMeta: { flexDirection: 'row', gap: spacing.sm },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.background, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  metaText: { fontSize: 12, color: colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  modalTitle: { ...typography.h3, marginBottom: spacing.md },
  modalInput: {
    backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, ...typography.body, color: colors.textPrimary,
  },
  pickerLabel: { ...typography.label, marginTop: spacing.md, marginBottom: spacing.xs },
  emojiRow: { flexDirection: 'row' },
  emojiOption: { padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: 'transparent', marginRight: spacing.xs },
  colorRow: { flexDirection: 'row', gap: spacing.sm },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: colors.white },
  langRow: { flexDirection: 'row' },
  langChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm, backgroundColor: colors.background,
  },
  langFlag: { fontSize: 16 },
  langLabel: { fontSize: 13, color: colors.textSecondary },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingVertical: spacing.md, alignItems: 'center' },
  cancelText: { ...typography.body, color: colors.textSecondary },
  createBtn: { flex: 1, borderRadius: radius.full, paddingVertical: spacing.md, alignItems: 'center' },
  createText: { ...typography.h4, color: colors.white },
});
