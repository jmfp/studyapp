import OpenAI from 'openai';
import {
  DEFAULT_MAX_CARDS,
  MAX_CARDS_PER_GENERATION,
  MAX_PDF_CHUNKS,
  MAX_SOURCE_CHARS,
  PDF_CHUNK_SIZE,
} from '../constants/ai';
import { chunkText, extractPdfText } from '../utils/pdfExtract';

export interface DraftCard {
  question: string;
  answer: string;
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function buildSystemPrompt(sourceLanguage: string, language: string, maxCards: number): string {
  const frontLang = sourceLanguage === 'other' ? 'the source language' : sourceLanguage;
  const backLang = language === 'other' ? 'the target language' : language;

  return `You are an expert flashcard author for spaced repetition study (SM-2).
Create atomic question-answer pairs from the user's study material.
Rules:
- Each card tests exactly ONE recallable fact.
- Questions go on the front in ${frontLang}.
- Answers go on the back in ${backLang}.
- Keep questions concise and unambiguous.
- Keep answers short (ideally one phrase or sentence).
- Do not duplicate concepts.
- Generate up to ${maxCards} cards based on how much content is provided.
Return ONLY valid JSON with this shape: {"cards":[{"question":"...","answer":"..."}]}`;
}

function parseCardsJson(raw: string): DraftCard[] {
  const parsed = JSON.parse(raw) as { cards?: unknown };
  if (!Array.isArray(parsed.cards)) {
    throw new Error('AI response missing cards array');
  }

  const cards = parsed.cards
    .map((item) => {
      const row = item as Record<string, unknown>;
      const question = String(row.question ?? '').trim();
      const answer = String(row.answer ?? '').trim();
      return { question, answer };
    })
    .filter((c) => c.question && c.answer);

  if (cards.length === 0) {
    throw new Error('AI returned no valid cards');
  }

  return cards;
}

export function isAiConfigured(): boolean {
  return Boolean(openai);
}

export async function fetchUrlText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'FlashStudy/1.0 (+https://flashstudy.app)' },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Could not fetch URL (${response.status})`);
  }

  const html = await response.text();
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length < 80) {
    throw new Error('URL did not contain enough readable text');
  }

  return text.slice(0, MAX_SOURCE_CHARS);
}

function dedupeCards(cards: DraftCard[]): DraftCard[] {
  const seen = new Set<string>();
  return cards.filter((card) => {
    const key = card.question.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function generateFromPdf(
  pdfBase64: string,
  sourceLanguage: string,
  language: string,
  maxCards: number,
): Promise<{ cards: DraftCard[]; meta?: { pageCount: number; truncated: boolean; chunksProcessed: number } }> {
  const { text, pageCount, truncated } = await extractPdfText(pdfBase64);
  const chunks = chunkText(text, PDF_CHUNK_SIZE, MAX_PDF_CHUNKS);

  if (chunks.length === 1) {
    const cards = await generateFromText(text, sourceLanguage, language, maxCards);
    return { cards, meta: { pageCount, truncated, chunksProcessed: 1 } };
  }

  const perChunk = Math.max(Math.ceil(maxCards / chunks.length), 4);
  const batchResults = await Promise.all(
    chunks.map((chunk, index) =>
      generateFromText(
        chunk,
        sourceLanguage,
        language,
        perChunk,
        `PDF section ${index + 1} of ${chunks.length}`,
      ),
    ),
  );

  const cards = dedupeCards(batchResults.flat()).slice(0, maxCards);
  if (cards.length === 0) {
    throw new Error('Could not generate cards from this PDF');
  }

  return { cards, meta: { pageCount, truncated, chunksProcessed: chunks.length } };
}

async function generateFromText(
  sourceText: string,
  sourceLanguage: string,
  language: string,
  maxCards: number,
  sectionLabel?: string,
): Promise<DraftCard[]> {
  if (!openai) throw new Error('AI is not configured on the server');

  const trimmed = sourceText.trim().slice(0, MAX_SOURCE_CHARS);
  if (trimmed.length < 40) {
    throw new Error('Please provide at least a few sentences of study material');
  }

  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildSystemPrompt(sourceLanguage, language, maxCards) },
      {
        role: 'user',
        content: sectionLabel
          ? `${sectionLabel}\n\nStudy material:\n\n${trimmed}\n\nGenerate flashcards from this section.`
          : `Study material:\n\n${trimmed}\n\nGenerate flashcards now.`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');

  return parseCardsJson(content).slice(0, maxCards);
}

export async function generateFromImage(
  imageBase64: string,
  mimeType: string,
  sourceLanguage: string,
  language: string,
  maxCards: number,
): Promise<DraftCard[]> {
  if (!openai) throw new Error('AI is not configured on the server');

  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildSystemPrompt(sourceLanguage, language, maxCards) },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract key study concepts from this image and generate flashcards.',
          },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${imageBase64}` },
          },
        ],
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');

  return parseCardsJson(content).slice(0, maxCards);
}

export async function generateCardsFromSource(params: {
  sourceType: 'text' | 'url' | 'image' | 'pdf';
  content?: string;
  imageBase64?: string;
  pdfBase64?: string;
  mimeType?: string;
  sourceLanguage: string;
  language: string;
  maxCards?: number;
}): Promise<{ cards: DraftCard[]; meta?: Record<string, unknown> }> {
  const maxCards = Math.min(
    Math.max(params.maxCards ?? DEFAULT_MAX_CARDS, 3),
    MAX_CARDS_PER_GENERATION,
  );

  if (params.sourceType === 'pdf') {
    if (!params.pdfBase64) throw new Error('PDF data is required');
    return generateFromPdf(
      params.pdfBase64,
      params.sourceLanguage,
      params.language,
      maxCards,
    );
  }

  if (params.sourceType === 'image') {
    if (!params.imageBase64 || !params.mimeType) {
      throw new Error('Image data is required');
    }
    return {
      cards: await generateFromImage(
        params.imageBase64,
        params.mimeType,
        params.sourceLanguage,
        params.language,
        maxCards,
      ),
    };
  }

  let sourceText = params.content?.trim() ?? '';
  if (params.sourceType === 'url') {
    if (!sourceText) throw new Error('URL is required');
    sourceText = await fetchUrlText(sourceText);
  }

  return {
    cards: await generateFromText(sourceText, params.sourceLanguage, params.language, maxCards),
  };
}
