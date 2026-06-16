import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput,
} from 'react-native';
import { toHiragana, toKatakana } from 'wanakana';
import { colors, radius, spacing, typography } from '../theme';
import { getLanguageLabel } from '../constants/languages';
import { getScriptPanels, type ScriptPanel } from '../constants/scriptCharsets';

type Props = {
  languageCode: string;
  onInsert: (text: string) => void;
  onBackspace: () => void;
};

function RomajiPanel({ onInsert }: { onInsert: (text: string) => void }) {
  const [romaji, setRomaji] = useState('');

  const handleInsert = (mode: 'hiragana' | 'katakana') => {
    const trimmed = romaji.trim();
    if (!trimmed) return;
    const converted = mode === 'katakana' ? toKatakana(trimmed) : toHiragana(trimmed);
    onInsert(converted);
    setRomaji('');
  };

  return (
    <View style={styles.romajiPanel}>
      <TextInput
        style={styles.romajiInput}
        value={romaji}
        onChangeText={setRomaji}
        placeholder="Type romaji — aka → あか, aka → アカ"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />
      <View style={styles.romajiActions}>
        <TouchableOpacity style={styles.romajiBtn} onPress={() => handleInsert('hiragana')}>
          <Text style={styles.romajiBtnText}>Insert ひらがな</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.romajiBtn, styles.romajiBtnAlt]} onPress={() => handleInsert('katakana')}>
          <Text style={styles.romajiBtnText}>Insert カタカナ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function MultilingualInputToolbar({ languageCode, onInsert, onBackspace }: Props) {
  const panels = useMemo(() => getScriptPanels(languageCode), [languageCode]);
  const [activePanelId, setActivePanelId] = useState(panels[0]?.id ?? 'chars');
  const activePanel = panels.find((p) => p.id === activePanelId) ?? panels[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>{getLanguageLabel(languageCode)} characters</Text>
        <View style={styles.utilityRow}>
          <TouchableOpacity style={styles.utilityBtn} onPress={() => onInsert(' ')}>
            <Text style={styles.utilityText}>Space</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.utilityBtn} onPress={onBackspace}>
            <Text style={styles.utilityText}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>

      {panels.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow} contentContainerStyle={styles.tabContent}>
          {panels.map((panel) => (
            <TouchableOpacity
              key={panel.id}
              style={[styles.tab, activePanelId === panel.id && styles.tabActive]}
              onPress={() => setActivePanelId(panel.id)}
            >
              <Text style={[styles.tabText, activePanelId === panel.id && styles.tabTextActive]}>
                {panel.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {activePanel?.type === 'romaji' ? (
        <RomajiPanel onInsert={onInsert} />
      ) : (
        <ScrollView
          style={styles.gridScroll}
          contentContainerStyle={styles.grid}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          {activePanel?.chars.map((char, index) => (
            <TouchableOpacity
              key={`${char}-${index}`}
              style={styles.charBtn}
              onPress={() => onInsert(char)}
            >
              <Text style={styles.charText}>{char}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  headerLabel: { ...typography.small, fontSize: 11, color: colors.textMuted },
  utilityRow: { flexDirection: 'row', gap: spacing.xs },
  utilityBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  utilityText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  tabRow: { maxHeight: 36 },
  tabContent: { paddingHorizontal: spacing.sm, gap: spacing.xs, paddingBottom: spacing.xs },
  tab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  tabActive: { backgroundColor: colors.primary + '30', borderColor: colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.white },
  gridScroll: { maxHeight: 132 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
    gap: 4,
  },
  charBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  charText: { fontSize: 17, color: colors.textPrimary },
  romajiPanel: { padding: spacing.sm, gap: spacing.sm },
  romajiInput: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 14,
  },
  romajiActions: { flexDirection: 'row', gap: spacing.sm },
  romajiBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  romajiBtnAlt: { backgroundColor: colors.primaryDark },
  romajiBtnText: { fontSize: 12, fontWeight: '700', color: colors.white },
});
