import type { Card } from '../types';

export function isWeakCard(card: Pick<Card, 'timesReviewed' | 'timesCorrect'>): boolean {
  if (card.timesReviewed < 3) return false;
  const accuracy = Math.round((card.timesCorrect / card.timesReviewed) * 100);
  return accuracy < 70;
}

export function cardAccuracy(card: Pick<Card, 'timesReviewed' | 'timesCorrect'>): number | null {
  if (card.timesReviewed === 0) return null;
  return Math.round((card.timesCorrect / card.timesReviewed) * 100);
}

export function weakCardToCard(weak: {
  _id: string;
  topicId?: string;
  question: string;
  answer?: string;
  accuracy: number;
  timesReviewed: number;
  easeFactor: number;
  interval: number;
}): Card | null {
  if (!weak.topicId) return null;
  const timesCorrect = Math.round((weak.accuracy / 100) * weak.timesReviewed);
  return {
    _id: weak._id,
    topicId: weak.topicId,
    userId: '',
    question: weak.question,
    answer: weak.answer ?? '',
    language: 'en',
    repetitions: 0,
    easeFactor: weak.easeFactor,
    interval: weak.interval,
    isMature: false,
    qualityHistory: [],
    timesReviewed: weak.timesReviewed,
    timesCorrect,
    timesWrong: weak.timesReviewed - timesCorrect,
    createdAt: '',
    updatedAt: '',
  };
}
