/** SM-2 spaced repetition — mirrors api/src/utils/sm2.ts */

export interface SM2Input {
  quality: number;
  repetitions: number;
  easeFactor: number;
  interval: number;
}

export interface SM2Output {
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReviewAt: Date;
}

const MIN_EF = 1.3;

export function sm2(input: SM2Input): SM2Output {
  const { quality, repetitions, easeFactor, interval } = input;

  let newRepetitions: number;
  let newInterval: number;
  let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEF = Math.max(MIN_EF, newEF);

  if (quality >= 3) {
    if (repetitions === 0) newInterval = 1;
    else if (repetitions === 1) newInterval = 6;
    else newInterval = Math.round(interval * newEF);
    newRepetitions = repetitions + 1;
  } else {
    newRepetitions = 0;
    newInterval = 1;
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);
  nextReviewAt.setHours(0, 0, 0, 0);

  return { repetitions: newRepetitions, easeFactor: newEF, interval: newInterval, nextReviewAt };
}

export function intervalLabel(days: number): string {
  if (days <= 1) return 'Tomorrow';
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.round(days / 7)} week${Math.round(days / 7) > 1 ? 's' : ''}`;
  if (days < 365) return `${Math.round(days / 30)} month${Math.round(days / 30) > 1 ? 's' : ''}`;
  return `${Math.round(days / 365)} year${Math.round(days / 365) > 1 ? 's' : ''}`;
}

export function sessionScore(qualities: number[]): number {
  if (qualities.length === 0) return 0;
  const total = qualities.reduce((sum, q) => sum + (q / 5) * 100, 0);
  return Math.round(total / qualities.length);
}
