import OpenAI from 'openai';
import { isAiConfigured } from './aiService';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export type ImprovementType =
  | 'shorten_answer'
  | 'split_card'
  | 'mnemonic'
  | 'clarify_question';

export interface CardImprovementSuggestion {
  id: string;
  type: ImprovementType;
  title: string;
  explanation: string;
  suggestedQuestion?: string;
  suggestedAnswer?: string;
  additionalCards?: { question: string; answer: string }[];
  mnemonic?: string;
}

export interface CardImprovementResult {
  suggestions: CardImprovementSuggestion[];
  isWeakCard: boolean;
}

export interface CardImproveContext {
  question: string;
  answer: string;
  sourceLanguage: string;
  language: string;
  timesReviewed: number;
  timesCorrect: number;
  timesWrong: number;
  easeFactor: number;
  interval: number;
  avgQuality: number;
  trigger: 'manual' | 'weak_card';
}

function buildImprovePrompt(ctx: CardImproveContext): string {
  const accuracy = ctx.timesReviewed > 0
    ? Math.round((ctx.timesCorrect / ctx.timesReviewed) * 100)
    : 0;

  const weakNote = ctx.trigger === 'weak_card' || (ctx.timesReviewed >= 3 && accuracy < 70)
    ? 'This card is struggling in review — prioritize fixes that improve recall.'
    : 'This is a new or healthy card — focus on atomicity and clarity.';

  return `You are an expert spaced-repetition flashcard coach (SM-2 / Anki style).
Analyze this flashcard and suggest 1-4 concrete improvements.

Card:
- Question (${ctx.sourceLanguage}): ${ctx.question}
- Answer (${ctx.language}): ${ctx.answer}
- Times reviewed: ${ctx.timesReviewed}
- Accuracy: ${accuracy}%
- Avg quality (0-5): ${ctx.avgQuality}
- Ease factor: ${ctx.easeFactor}
- Interval: ${ctx.interval} days

${weakNote}

Improvement types you may use:
- shorten_answer: answer is too long for one recallable fact
- split_card: card tests multiple facts — split into atomic cards
- mnemonic: suggest a memory hook (keep the core answer, add mnemonic separately)
- clarify_question: question is vague or ambiguous

Rules:
- Questions should stay in ${ctx.sourceLanguage}, answers in ${ctx.language}.
- For split_card: put the first card in suggestedQuestion/suggestedAnswer, extras in additionalCards (1-2 more cards max).
- For mnemonic: set mnemonic field; keep suggestedAnswer as the improved concise answer if needed.
- For shorten_answer or clarify_question: provide suggestedQuestion and/or suggestedAnswer.
- Only suggest changes that meaningfully help. Skip nitpicks.
- Each suggestion needs a short title (like a UI headline) and explanation (1-2 sentences).

Return ONLY valid JSON:
{
  "suggestions": [
    {
      "id": "unique-id",
      "type": "shorten_answer|split_card|mnemonic|clarify_question",
      "title": "...",
      "explanation": "...",
      "suggestedQuestion": "optional",
      "suggestedAnswer": "optional",
      "additionalCards": [{"question":"...","answer":"..."}],
      "mnemonic": "optional"
    }
  ]
}`;
}

function parseImprovements(raw: string): CardImprovementSuggestion[] {
  const parsed = JSON.parse(raw) as { suggestions?: unknown };
  if (!Array.isArray(parsed.suggestions)) {
    throw new Error('AI response missing suggestions array');
  }

  const validTypes = new Set<ImprovementType>([
    'shorten_answer', 'split_card', 'mnemonic', 'clarify_question',
  ]);

  const suggestions: CardImprovementSuggestion[] = [];

  for (const [index, item] of parsed.suggestions.entries()) {
    const row = item as Record<string, unknown>;
    const type = String(row.type ?? '') as ImprovementType;
    if (!validTypes.has(type)) continue;

    const additionalCards = Array.isArray(row.additionalCards)
      ? row.additionalCards
        .map((c) => {
          const card = c as Record<string, unknown>;
          const question = String(card.question ?? '').trim();
          const answer = String(card.answer ?? '').trim();
          return question && answer ? { question, answer } : null;
        })
        .filter((c): c is { question: string; answer: string } => c !== null)
      : undefined;

    const title = String(row.title ?? 'Suggestion').trim();
    const explanation = String(row.explanation ?? '').trim();
    if (!title || !explanation) continue;

    suggestions.push({
      id: String(row.id ?? `suggestion-${index + 1}`),
      type,
      title,
      explanation,
      suggestedQuestion: row.suggestedQuestion ? String(row.suggestedQuestion).trim() : undefined,
      suggestedAnswer: row.suggestedAnswer ? String(row.suggestedAnswer).trim() : undefined,
      additionalCards: additionalCards?.length ? additionalCards : undefined,
      mnemonic: row.mnemonic ? String(row.mnemonic).trim() : undefined,
    });
  }

  if (suggestions.length === 0) {
    throw new Error('AI returned no valid suggestions');
  }

  return suggestions.slice(0, 4);
}

export { isAiConfigured };

export async function suggestCardImprovements(
  ctx: CardImproveContext,
): Promise<CardImprovementResult> {
  if (!openai) throw new Error('AI is not configured on the server');

  const accuracy = ctx.timesReviewed > 0
    ? Math.round((ctx.timesCorrect / ctx.timesReviewed) * 100)
    : 100;

  const isWeakCard = ctx.timesReviewed >= 3 && accuracy < 70;

  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.35,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You help learners improve flashcards for spaced repetition.' },
      { role: 'user', content: buildImprovePrompt(ctx) },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');

  return {
    suggestions: parseImprovements(content),
    isWeakCard,
  };
}
