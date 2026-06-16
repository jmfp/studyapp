import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { colors, spacing, radius, typography } from '../theme';

export type AiSourceTab = 'text' | 'url' | 'pdf' | 'image';

export interface AiSourcePayload {
  sourceType: 'text' | 'url' | 'site' | 'image' | 'pdf';
  content?: string;
  imageBase64?: string;
  pdfBase64?: string;
  mimeType?: string;
}

const MAX_PDF_BYTES = 25 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function useAiSourceForm() {
  const [tab, setTab] = useState<AiSourceTab>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [crawlSite, setCrawlSite] = useState(false);
  const [imageName, setImageName] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfSize, setPdfSize] = useState<number | null>(null);

  const reset = () => {
    setTab('text');
    setText('');
    setUrl('');
    setCrawlSite(false);
    setImageName(null);
    setImageBase64(null);
    setImageMime(null);
    setPdfName(null);
    setPdfBase64(null);
    setPdfSize(null);
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

  const validate = (): string | null => {
    if (tab === 'text' && !text.trim()) return 'Paste your notes or study material first.';
    if (tab === 'url' && !url.trim()) return 'Enter a webpage URL.';
    if (tab === 'image' && !imageBase64) return 'Choose a photo of your notes or textbook page.';
    if (tab === 'pdf' && !pdfBase64) return 'Choose a PDF file from your device.';
    return null;
  };

  const getPayload = (): AiSourcePayload => {
    if (tab === 'pdf') return { sourceType: 'pdf', pdfBase64: pdfBase64! };
    if (tab === 'image') return { sourceType: 'image', imageBase64: imageBase64!, mimeType: imageMime! };
    if (tab === 'url') {
      const trimmed = url.trim();
      return crawlSite
        ? { sourceType: 'site', content: trimmed }
        : { sourceType: 'url', content: trimmed };
    }
    return { sourceType: 'text', content: text.trim() };
  };

  const generateButtonLabel = tab === 'pdf'
    ? 'Generate from PDF'
    : tab === 'url' && crawlSite
      ? 'Crawl site & generate'
      : 'Generate flashcards';

  return {
    tab, setTab, text, setText, url, setUrl, crawlSite, setCrawlSite,
    imageName, pdfName, pdfSize, pickImage, pickPdf,
    reset, validate, getPayload, generateButtonLabel,
  };
}

interface AiSourceFormProps {
  form: ReturnType<typeof useAiSourceForm>;
  compact?: boolean;
}

export default function AiSourceForm({ form, compact }: AiSourceFormProps) {
  const {
    tab, setTab, text, setText, url, setUrl, crawlSite, setCrawlSite,
    imageName, pdfName, pdfSize, pickImage, pickPdf,
  } = form;

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
        {(['text', 'pdf', 'url', 'image'] as AiSourceTab[]).map((key) => (
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

      <View style={[styles.body, compact && styles.bodyCompact]}>
        {tab === 'text' && (
          <TextInput
            style={[styles.textArea, compact && styles.textAreaCompact]}
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
              placeholder="https://learnopengl.com or https://docs.example.com"
              placeholderTextColor={colors.textMuted}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <View style={styles.crawlRow}>
              <View style={styles.crawlLabel}>
                <Ionicons name="globe-outline" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.crawlTitle}>Crawl entire site</Text>
                  <Text style={styles.hint}>
                    Follows same-domain links from the base URL (up to 20 pages). Great for docs sites and tutorials.
                  </Text>
                </View>
              </View>
              <Switch
                value={crawlSite}
                onValueChange={setCrawlSite}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={crawlSite ? colors.primary : colors.textMuted}
              />
            </View>
            {!crawlSite && (
              <Text style={styles.hint}>Single page mode extracts readable text from one URL.</Text>
            )}
          </>
        )}

        {tab === 'pdf' && (
          <>
            <TouchableOpacity style={styles.imagePicker} onPress={pickPdf}>
              <Ionicons name="document-text-outline" size={28} color={colors.primary} />
              <Text style={styles.imagePickerText}>{pdfName || 'Choose PDF (up to 25MB)'}</Text>
              {pdfSize != null && <Text style={styles.fileMeta}>{formatFileSize(pdfSize)}</Text>}
            </TouchableOpacity>
            <Text style={styles.hint}>
              Large PDFs are processed in sections. Scanned PDFs without text — use Image instead.
            </Text>
          </>
        )}

        {tab === 'image' && (
          <>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              <Ionicons name="image-outline" size={28} color={colors.primary} />
              <Text style={styles.imagePickerText}>{imageName || 'Choose photo of notes or textbook'}</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>Works best with clear photos of notes, slides, or textbook pages.</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsScroll: { marginBottom: spacing.md },
  tabs: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.sm },
  tab: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: radius.full, backgroundColor: colors.background, alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primary + '25', borderWidth: 1, borderColor: colors.primary },
  tabText: { ...typography.body, fontSize: 13, color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  body: { marginBottom: spacing.sm },
  bodyCompact: { marginBottom: 0, gap: spacing.sm },
  textArea: {
    minHeight: 140,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  textAreaCompact: { minHeight: 100 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
  },
  crawlRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginTop: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  crawlLabel: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  crawlTitle: { ...typography.body, fontWeight: '600', fontSize: 14, marginBottom: 2 },
  hint: { ...typography.small, marginTop: spacing.xs, color: colors.textMuted },
  imagePicker: {
    minHeight: 100,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  imagePickerText: { ...typography.body, textAlign: 'center', color: colors.textSecondary },
  fileMeta: { ...typography.small, color: colors.textMuted },
});
