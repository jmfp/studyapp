import { requireOpenai, OPENAI_MODEL } from './openaiClient';

export interface StudyCoachResult {
  explanation: string;
  memoryHook: string;
  compareCard?: {
    question: string;
    answer: string;
    reason: string;
  };
}

export interface StudyCoachContext {
  question: string;
  answer: string;
  sourceLanguage: string;
  language: string;
  timesReviewed: number;
  timesCorrect: number;
  avgQuality: number;
  qualityRated: number;
  deckPeers: { question: string; answer: string }[];
}

export async function getStudyCoachHints(ctx: StudyCoachContext): Promise<StudyCoachResult> {
  const client = requireOpenai();
  const accuracy = ctx.timesReviewed > 0
    ? Math.round((ctx.timesCorrect / ctx.timesReviewed) * 100)
    : 0;

  const peersText = ctx.deckPeers.length > 0
    ? ctx.deckPeers.map((p, i) => `${i + 1}. Q: ${p.question} / A: ${p.answer}`).join('\n')
    : 'No other cards in deck.';

  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.45,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are a concise study coach for spaced repetition flashcards. Be encouraging and practical.',
      },
      {
        role: 'user',
        content: `The learner just rated this card quality ${ctx.qualityRated} (0=blackout, 2=wrong after seeing answer).

Card:
- Question (${ctx.sourceLanguage}): ${ctx.question}
- Answer (${ctx.language}): ${ctx.answer}
- Reviewed ${ctx.timesReviewed} times, ${accuracy}% accuracy, avg quality ${ctx.avgQuality}

Other cards in this deck:
${peersText}

Return JSON:
{
  "explanation": "1-2 sentences on why they might have missed it",
  "memoryHook": "a mnemonic, analogy, or vivid hook (1-2 sentences)",
  "compareCard": {
    "question": "pick ONE other card from the deck list above",
    "answer": "that card's answer",
    "reason": "one sentence on how they relate or contrast"
  }
}

If no deck peers, omit compareCard. Keep total under 120 words.`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');

  const parsed = JSON.parse(content) as Record<string, unknown>;
  const explanation = String(parsed.explanation ?? '').trim();
  const memoryHook = String(parsed.memoryHook ?? '').trim();
  if (!explanation || !memoryHook) throw new Error('Incomplete coach response');

  let compareCard: StudyCoachResult['compareCard'];
  const compare = parsed.compareCard as Record<string, unknown> | undefined;
  if (compare?.question && compare?.answer && compare?.reason) {
    compareCard = {
      question: String(compare.question).trim(),
      answer: String(compare.answer).trim(),
      reason: String(compare.reason).trim(),
    };
  }

  return { explanation, memoryHook, compareCard };
}
