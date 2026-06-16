import type { TextInputProps } from 'react-native';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ko', label: 'Korean' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'ru', label: 'Russian' },
  { code: 'other', label: 'Other' },
] as const;

const CHARACTER_TOOLBAR_CODES = new Set(['ja', 'zh', 'ko', 'ar', 'ru', 'es', 'fr', 'de', 'it', 'pt', 'other']);

export function getLanguageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code.toUpperCase();
}

export function usesComplexScript(code: string): boolean {
  return CHARACTER_TOOLBAR_CODES.has(code);
}

export function getMultilingualInputProps(languageCode: string): Pick<
  TextInputProps,
  'autoCorrect' | 'spellCheck' | 'autoCapitalize' | 'keyboardType' | 'textContentType' | 'writingDirection'
> {
  const complex = usesComplexScript(languageCode);
  return {
    keyboardType: 'default',
    autoCorrect: !complex,
    spellCheck: !complex,
    autoCapitalize: complex ? 'none' : 'sentences',
    textContentType: 'none',
    writingDirection: languageCode === 'ar' ? 'rtl' : 'ltr',
  };
}
