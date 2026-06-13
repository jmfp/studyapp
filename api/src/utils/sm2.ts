/**
 * SM-2 Spaced Repetition Algorithm
 * Based on: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
 *
 * Quality ratings:
 *   5 - perfect response
 *   4 - correct response after a hesitation
 *   3 - correct response recalled with serious difficulty
 *   2 - incorrect response; where the correct one seemed easy to recall
 *   1 - incorrect response; the correct one remembered
 *   0 - complete blackout
 *
 * Rules:
 *   - q >= 3: answer was correct (schedule next review)
 *   - q < 3:  answer was wrong  (reset repetitions, reschedule for today/tomorrow)
 *   - After every response, update EF
 *   - If EF drops below 1.3, clamp to 1.3
 */

export interface SM2Input {
  quality: number;       // 0-5
  repetitions: number;   // n: previous repetition count
  easeFactor: number;    // EF: previous ease factor
  interval: number;      // I: previous interval in days
}

export interface SM2Output {
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReviewAt: Date;
}

const MIN_EF = 1.3;
const INITIAL_EF = 2.5;

export function sm2(input: SM2Input): SM2Output {
  const { quality, repetitions, easeFactor, interval } = input;

  let newRepetitions: number;
  let newInterval: number;
  let newEF: number;

  // Update ease factor (applied regardless of pass/fail)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEF = Math.max(MIN_EF, newEF);

  if (quality >= 3) {
    // Correct response — advance the schedule
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEF);
    }
    newRepetitions = repetitions + 1;
  } else {
    // Wrong response — reset to beginning
    newRepetitions = 0;
    newInterval = 1;
    // EF is still updated (penalised) but repetitions reset
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);
  // Zero out time so due date is start-of-day
  nextReviewAt.setHours(0, 0, 0, 0);

  return {
    repetitions: newRepetitions,
    easeFactor: newEF,
    interval: newInterval,
    nextReviewAt,
  };
}

/**
 * Returns a human-readable label for the next review schedule
 */
export function intervalLabel(days: number): string {
  if (days <= 1) return 'Tomorrow';
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.round(days / 7)} week${Math.round(days / 7) > 1 ? 's' : ''}`;
  if (days < 365) return `${Math.round(days / 30)} month${Math.round(days / 30) > 1 ? 's' : ''}`;
  return `${Math.round(days / 365)} year${Math.round(days / 365) > 1 ? 's' : ''}`;
}

/**
 * Weighted score for a session (quality 5 = 100%, quality 3 = 60%, quality 0 = 0%)
 */
export function sessionScore(qualities: number[]): number {
  if (qualities.length === 0) return 0;
  const total = qualities.reduce((sum, q) => sum + (q / 5) * 100, 0);
  return Math.round(total / qualities.length);
}
