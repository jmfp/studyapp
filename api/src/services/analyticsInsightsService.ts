import { requireOpenai, OPENAI_MODEL } from './openaiClient';

export interface AnalyticsInsightsInput {
  streakDays: number;
  retentionRate: number;
  dueToday: number;
  dueTomorrow: number;
  avgQuality: number;
  weakCards: { question: string; accuracy: number; timesReviewed: number }[];
  lowQualityCount: number;
  totalReviewsThisWeek: number;
  topicTitle?: string;
}

export interface AnalyticsInsightsResult {
  summary: string;
  recommendation: string;
  focusArea?: string;
}

export async function generateAnalyticsInsights(
  data: AnalyticsInsightsInput,
): Promise<AnalyticsInsightsResult> {
  const client = requireOpenai();

  const weakSummary = data.weakCards.length > 0
    ? data.weakCards.map((c) => `"${c.question}" (${c.accuracy}% accuracy, ${c.timesReviewed} reviews)`).join('; ')
    : 'none identified';

  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.55,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You write brief, motivating weekly study insights for a flashcard app user. Be specific, warm, and actionable.',
      },
      {
        role: 'user',
        content: `Write a personalized study insight from this data:
${data.topicTitle ? `Topic filter: ${data.topicTitle}` : 'All topics'}
- Streak: ${data.streakDays} days
- Retention rate: ${data.retentionRate}%
- Cards due today: ${data.dueToday}
- Cards due tomorrow: ${data.dueTomorrow}
- Avg recall quality (0-5): ${data.avgQuality}
- Low-quality ratings (0-2) this week: ${data.lowQualityCount}
- Cards reviewed this week: ${data.totalReviewsThisWeek}
- Weak cards: ${weakSummary}

Return JSON:
{
  "summary": "2-3 sentences narrating patterns (like 'You struggled with X this week')",
  "recommendation": "1-2 sentences with a concrete next step (e.g. focused 5-min session)",
  "focusArea": "short label like 'verb conjugation' or 'vocabulary' if detectable, else omit"
}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');

  const parsed = JSON.parse(content) as Record<string, unknown>;
  const summary = String(parsed.summary ?? '').trim();
  const recommendation = String(parsed.recommendation ?? '').trim();
  if (!summary || !recommendation) throw new Error('Incomplete insights response');

  return {
    summary,
    recommendation,
    focusArea: parsed.focusArea ? String(parsed.focusArea).trim() : undefined,
  };
}
