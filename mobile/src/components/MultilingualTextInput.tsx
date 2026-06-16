import React, { useCallback, useState } from 'react';
import { View, TextInput, StyleSheet, type TextInputProps, type StyleProp, type TextStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { getMultilingualInputProps, usesComplexScript } from '../constants/languages';
import MultilingualInputToolbar from './MultilingualInputToolbar';

type Props = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  languageCode: string;
  value: string;
  onChangeText: (text: string) => void;
  style?: StyleProp<TextStyle>;
};

export default function MultilingualTextInput({
  languageCode,
  value,
  onChangeText,
  style,
  ...rest
}: Props) {
  const [selection, setSelection] = useState({ start: value.length, end: value.length });
  const showToolbar = usesComplexScript(languageCode);

  const insertText = useCallback((text: string) => {
    const start = selection.start;
    const end = selection.end;
    const next = value.slice(0, start) + text + value.slice(end);
    onChangeText(next);
    const cursor = start + text.length;
    setSelection({ start: cursor, end: cursor });
  }, [onChangeText, selection.end, selection.start, value]);

  const handleBackspace = useCallback(() => {
    const { start, end } = selection;
    if (start !== end) {
      const next = value.slice(0, start) + value.slice(end);
      onChangeText(next);
      setSelection({ start, end: start });
      return;
    }
    if (start === 0) return;

    const chars = [...value];
    let index = start;
    while (index > 0 && (chars[index - 1] & 0xc0) === 0x80) index -= 1;
    const next = value.slice(0, index) + value.slice(start);
    onChangeText(next);
    setSelection({ start: index, end: index });
  }, [onChangeText, selection, value]);

  return (
    <View>
      <TextInput
        {...getMultilingualInputProps(languageCode)}
        {...rest}
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          if (text.length < value.length && selection.start > text.length) {
            setSelection({ start: text.length, end: text.length });
          }
        }}
        onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
        selection={selection}
        style={[styles.input, style]}
        placeholderTextColor={colors.textMuted}
      />
      {showToolbar && (
        <MultilingualInputToolbar
          languageCode={languageCode}
          onInsert={insertText}
          onBackspace={handleBackspace}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 90,
    lineHeight: 22,
  },
});
