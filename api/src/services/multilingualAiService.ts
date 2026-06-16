import { requireOpenai, OPENAI_MODEL } from './openaiClient';

export type MultilingualAction = 'translate' | 'examples' | 'reverse' | 'romaji' | 'nativeScript';

export interface MultilingualRequest {
  action: MultilingualAction;
  question?: string;
  answer?: string;
  text?: string;
  side?: 'question' | 'answer';
  sourceLanguage: string;
  language: string;
}

export interface MultilingualResult {
  question?: string;
  answer?: string;
  translated?: string;
  examples?: string[];
  romaji?: string;
  nativeScript?: string;
  reverseCard?: { question: string; answer: string };
}

const NATIVE_SCRIPT_HINTS: Record<string, string> = {
  ja: 'Japanese (hiragana, katakana, or kanji as appropriate)',
  ko: 'Korean (hangul)',
  zh: 'Chinese (simplified or traditional characters)',
  ar: 'Arabic script',
  ru: 'Cyrillic',
  el: 'Greek',
  he: 'Hebrew',
};

export async function runMultilingualAssist(req: MultilingualRequest): Promise<MultilingualResult> {
  const client = requireOpenai();

  if (req.action === 'romaji' || req.action === 'nativeScript') {
    const prompt = (req.question || req.text || '').trim();
    if (!prompt) throw new Error('Question text is required');
    const target = req.language;
    const source = req.sourceLanguage;
    const scriptHint = NATIVE_SCRIPT_HINTS[target] ?? `native writing system for ${target}`;

    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You write flashcard answers in the target language using only its native script. Never respond in English unless the target language is English.',
        },
        {
          role: 'user',
          content: `Flashcard prompt (${source}): ${prompt}

Write the natural answer in ${target} using ${scriptHint}.
- Use only the native script for ${target}
- No English gloss
- No Latin transliteration (romaji/pinyin) unless ${target} is English or another Latin-alphabet language
- Keep it concise — one word or short phrase

Return JSON: {"native":"..."}`,
        },
      ],
    });
    const content = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(content || '{}') as { native?: string };
    if (!parsed.native) throw new Error('Could not generate native answer');
    const native = parsed.native.trim();
    return { nativeScript: native, romaji: native };
  }

  if (req.action === 'translate') {
    const fromSide = req.side || 'question';
    const raw = fromSide === 'answer' ? (req.answer ?? '') : (req.question ?? req.text ?? '');
    const text = raw.trim();
    const source = fromSide === 'answer' ? req.language : req.sourceLanguage;
    const target = fromSide === 'answer' ? req.sourceLanguage : req.language;
    if (!text) throw new Error('Text is required');

    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: `Translate from ${source} to ${target}.
Use only the native writing system for ${target}. No English unless ${target} is English. No Latin transliteration.
Return JSON: {"translated":"..."}

Text: ${text}`,
        },
      ],
    });
    const content = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(content || '{}') as { translated?: string };
    if (!parsed.translated) throw new Error('Translation failed');
    return { translated: parsed.translated.trim() };
  }

  if (req.action === 'reverse') {
    const q = (req.question || '').trim();
    const a = (req.answer || '').trim();
    if (!q || !a) throw new Error('Question and answer are required');

    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: `Create a reverse flashcard for bidirectional study.
Original — Q (${req.sourceLanguage}): ${q}
Original — A (${req.language}): ${a}

Swap direction: new question should be in ${req.language}, new answer in ${req.sourceLanguage}.
Keep both sides concise and test the same fact from the opposite direction.
Return JSON: {"question":"...","answer":"..."}`,
        },
      ],
    });
    const content = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(content || '{}') as { question?: string; answer?: string };
    if (!parsed.question || !parsed.answer) throw new Error('Reverse card failed');
    return { reverseCard: { question: parsed.question.trim(), answer: parsed.answer.trim() } };
  }

  if (req.action === 'examples') {
    const q = (req.question || '').trim();
    const a = (req.answer || '').trim();
    if (!q && !a) throw new Error('Question or answer is required');

    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.5,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: `Generate 2 short example sentences in ${req.language} that illustrate this flashcard.
Q: ${q}
A: ${a}

Return JSON: {"examples":["sentence 1","sentence 2"]}`,
        },
      ],
    });
    const content = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(content || '{}') as { examples?: string[] };
    const examples = (parsed.examples || []).map((e) => String(e).trim()).filter(Boolean);
    if (examples.length === 0) throw new Error('Could not generate examples');
    return { examples };
  }

  throw new Error('Unknown multilingual action');
}
