import React, { useState } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { colors, spacing, radius, typography } from '../theme';
import { useGenerateCardsMutation, useGetAiUsageQuery } from '../services/api';
import type { DraftCard } from '../types';

type SourceTab = 'text' | 'url' | 'pdf' | 'image';

const MAX_PDF_BYTES = 25 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  const [tab, setTab] = useState<SourceTab>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [imageName, setImageName] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfSize, setPdfSize] = useState<number | null>(null);

  const { data: usage } = useGetAiUsageQuery(undefined, { skip: !visible });
  const [generateCards, { isLoading }] = useGenerateCardsMutation();

  const reset = () => {
    setTab('text');
    setText('');
    setUrl('');
    setImageName(null);
    setImageBase64(null);
    setImageMime(null);
    setPdfName(null);
    setPdfBase64(null);
    setPdfSize(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to generate cards from an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets[0]?.base64) return;

    const asset = result.assets[0];
    setImageName(asset.fileName || 'Selected image');
    setImageBase64(asset.base64);
    setImageMime(asset.mimeType || 'image/jpeg');
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const size = asset.size ?? 0;

    if (size > MAX_PDF_BYTES) {
      Alert.alert('PDF too large', `Maximum PDF size is ${formatFileSize(MAX_PDF_BYTES)}. This file is ${formatFileSize(size)}.`);
      return;
    }

    try {
      const base64 = await readAsStringAsync(asset.uri, { encoding: EncodingType.Base64 });
      setPdfName(asset.name || 'Selected PDF');
      setPdfBase64(base64);
      setPdfSize(size || Math.round(base64.length * 0.75));
    } catch {
      Alert.alert('Could not read PDF', 'Try choosing the file again or use a smaller PDF.');
    }
  };

  const handleGenerate = async () => {
    if (usage && usage.remaining <= 0) {
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

    try {
      const payload =
        tab === 'pdf'
          ? { topicId, sourceType: 'pdf' as const, pdfBase64: pdfBase64! }
          : tab === 'image'
          ? { topicId, sourceType: 'image' as const, imageBase64: imageBase64!, mimeType: imageMime! }
          : tab === 'url'
            ? { topicId, sourceType: 'url' as const, content: url.trim() }
            : { topicId, sourceType: 'text' as const, content: text.trim() };

      if (tab === 'text' && !text.trim()) {
        Alert.alert('Add content', 'Paste your notes or study material first.');
        return;
      }
      if (tab === 'url' && !url.trim()) {
        Alert.alert('Add URL', 'Enter a webpage URL to extract study content.');
        return;
      }
      if (tab === 'image' && !imageBase64) {
        Alert.alert('Add image', 'Choose a photo of your notes or textbook page.');
        return;
      }
      if (tab === 'pdf' && !pdfBase64) {
        Alert.alert('Add PDF', 'Choose a PDF file from your device.');
        return;
      }

      const result = await generateCards(payload).unwrap();
      onGenerated(result.cards, result.usage);
      reset();
      onClose();
    } catch (err: any) {
      const code = err?.data?.code;
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
    ? usage.tier === 'pro'
      ? 'Pro · unlimited AI generations'
      : `${usage.remaining} of ${usage.limit} free generation${usage.limit === 1 ? '' : 's'} left this month`
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
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Paste notes, import a PDF, add a URL, or use a photo — review before saving.</Text>
          <Text style={styles.usage}>{usageLabel}</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
            {(['text', 'pdf', 'url', 'image'] as SourceTab[]).map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.tab, tab === key && styles.tabActive]}
                onPress={() => setTab(key)}
              >
                <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
                  {key === 'text' ? 'Paste' : key === 'url' ? 'URL' : key === 'pdf' ? 'PDF' : 'Image'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {tab === 'text' && (
              <TextInput
                style={styles.textArea}
                placeholder="Paste lecture notes, vocabulary lists, definitions..."
                placeholderTextColor={colors.textMuted}
                value={text}
                onChangeText={setText}
                multiline
                textAlignVertical="top"
              />
            )}

            {tab === 'url' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="https://example.com/article"
                  placeholderTextColor={colors.textMuted}
                  value={url}
                  onChangeText={setUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <Text style={styles.hint}>We extract readable text from the page and build cards from it.</Text>
              </>
            )}

            {tab === 'pdf' && (
              <>
                <TouchableOpacity style={styles.imagePicker} onPress={pickPdf}>
                  <Ionicons name="document-text-outline" size={28} color={colors.primary} />
                  <Text style={styles.imagePickerText}>
                    {pdfName || 'Choose PDF (up to 25MB)'}
                  </Text>
                  {pdfSize != null && (
                    <Text style={styles.fileMeta}>{formatFileSize(pdfSize)}</Text>
                  )}
                </TouchableOpacity>
                <Text style={styles.hint}>
                  Large PDFs are processed in sections automatically. Scanned PDFs without selectable text may not work — use Image instead.
                </Text>
              </>
            )}

            {tab === 'image' && (
              <>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                  <Ionicons name="image-outline" size={28} color={colors.primary} />
                  <Text style={styles.imagePickerText}>
                    {imageName || 'Choose photo of notes or textbook'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.hint}>Works best with clear photos of notes, slides, or textbook pages.</Text>
              </>
            )}
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
                <Text style={styles.generateText}>
                  {tab === 'pdf' ? 'Generate from PDF' : 'Generate flashcards'}
                </Text>
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
  tabsScroll: { marginBottom: spacing.md },
  tabs: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.sm },
  tab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.full, backgroundColor: colors.background, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary + '25', borderWidth: 1, borderColor: colors.primary },
  tabText: { ...typography.body, fontSize: 13, color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  body: { maxHeight: 260, marginBottom: spacing.md },
  textArea: {
    minHeight: 180,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
  },
  hint: { ...typography.small, marginTop: spacing.sm },
  imagePicker: {
    minHeight: 120,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  imagePickerText: { ...typography.body, textAlign: 'center', color: colors.textSecondary },
  fileMeta: { ...typography.small, color: colors.textMuted },
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
