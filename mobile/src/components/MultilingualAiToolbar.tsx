import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toRomaji, isJapanese } from 'wanakana';
import { colors, spacing, radius, typography } from '../theme';
import { getLanguageLabel } from '../constants/languages';
import { useMultilingualAssistMutation } from '../services/api';
import { useAiProGate, isAiProRequiredError } from '../hooks/useAiProGate';

interface MultilingualAiToolbarProps {
  topicId: string;
  sourceLanguage: string;
  language: string;
  question: string;
  answer: string;
  onQuestionChange: (v: string) => void;
  onAnswerChange: (v: string) => void;
  onReverseCard?: (q: string, a: string) => void;
  onRequirePro?: () => void;
}

const LATIN_TARGET_LANGS = new Set(['en', 'es', 'fr', 'de', 'it', 'pt']);

export default function MultilingualAiToolbar({
  topicId, sourceLanguage, language, question, answer,
  onQuestionChange, onAnswerChange, onReverseCard, onRequirePro,
}: MultilingualAiToolbarProps) {
  const [assist, { isLoading }] = useMultilingualAssistMutation();
  const [examples, setExamples] = useState<string[]>([]);
  const { requirePro } = useAiProGate(onRequirePro);

  const run = async (
    action: 'translate' | 'examples' | 'reverse' | 'nativeScript',
    extra?: { text?: string; target: 'question' | 'answer' },
  ) => {
    if (!requirePro()) return;
    try {
      const result = await assist({
        topicId,
        action,
        question,
        answer,
        text: extra?.text,
        side: extra?.target === 'answer' ? 'answer' : extra?.target === 'question' ? 'question' : undefined,
      }).unwrap();

      if (action === 'translate' && result.translated && extra) {
        if (extra.target === 'question') onQuestionChange(result.translated);
        else onAnswerChange(result.translated);
      } else if (action === 'examples' && result.examples) {
        setExamples(result.examples);
      } else if (action === 'reverse' && result.reverseCard) {
        if (onReverseCard) {
          onReverseCard(result.reverseCard.question, result.reverseCard.answer);
        } else {
          Alert.alert(
            'Reverse card',
            `Q: ${result.reverseCard.question}\n\nA: ${result.reverseCard.answer}`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Use fields',
                onPress: () => {
                  onQuestionChange(result.reverseCard!.question);
                  onAnswerChange(result.reverseCard!.answer);
                },
              },
            ],
          );
        }
      } else if (action === 'nativeScript') {
        const native = result.nativeScript ?? result.romaji;
        if (native) onAnswerChange(native);
      }
    } catch (err: any) {
      if (isAiProRequiredError(err)) {
        requirePro();
        return;
      }
      Alert.alert('AI assist failed', err?.data?.message || 'Try again');
    }
  };

  const handleNativeAnswer = async () => {
    if (!requirePro()) return;
    const text = question.trim();
    if (!text) {
      Alert.alert('Enter a question first');
      return;
    }

    // Japanese text on the question — add romaji reading aid on the question side
    if (language === 'ja' && isJapanese(text)) {
      const romaji = toRomaji(text);
      if (!question.includes(`(${romaji})`)) {
        onQuestionChange(`${text} (${romaji})`);
      }
      return;
    }

    await run('nativeScript', { text, target: 'answer' });
  };

  const showNativeAnswer = !LATIN_TARGET_LANGS.has(language) || sourceLanguage !== language;
  const nativeLabel = language === 'ja' ? 'Japanese answer' : `${getLanguageLabel(language)} answer`;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>AI language tools</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <ToolChip
          icon="language"
          label="Translate Q→A"
          disabled={isLoading || !question.trim()}
          onPress={() => run('translate', { text: question, target: 'answer' })}
        />
        <ToolChip
          icon="language-outline"
          label="Translate A→Q"
          disabled={isLoading || !answer.trim()}
          onPress={() => run('translate', { text: answer, target: 'question' })}
        />
        <ToolChip
          icon="chatbubbles-outline"
          label="Examples"
          disabled={isLoading || (!question.trim() && !answer.trim())}
          onPress={() => run('examples')}
        />
        <ToolChip
          icon="swap-horizontal"
          label="Reverse"
          disabled={isLoading || !question.trim() || !answer.trim()}
          onPress={() => run('reverse')}
        />
        {showNativeAnswer && (
          <ToolChip
            icon="text-outline"
            label={nativeLabel}
            disabled={isLoading || !question.trim()}
            onPress={handleNativeAnswer}
          />
        )}
        {isLoading && <ActivityIndicator color={colors.primary} style={{ marginLeft: 8 }} />}
      </ScrollView>

      {examples.length > 0 && (
        <View style={styles.examplesBox}>
          <Text style={styles.examplesTitle}>Example sentences</Text>
          {examples.map((ex, i) => (
            <TouchableOpacity
              key={i}
              style={styles.exampleRow}
              onPress={() => onAnswerChange(answer ? `${answer}\n\n${ex}` : ex)}
            >
              <Text style={styles.exampleText}>{ex}</Text>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function ToolChip({
  icon, label, onPress, disabled,
}: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.chip, disabled && styles.chipDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon} size={14} color={colors.primary} />
      <Text style={styles.chipText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.xs },
  row: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, backgroundColor: colors.primary + '15',
    borderWidth: 1, borderColor: colors.primary + '35',
  },
  chipDisabled: { opacity: 0.45 },
  chipText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  examplesBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  examplesTitle: { ...typography.label, fontSize: 10, marginBottom: spacing.xs },
  exampleRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  exampleText: { ...typography.body, fontSize: 13, flex: 1 },
});
