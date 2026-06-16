import { Request, Response } from 'express';
import mongoose from 'mongoose';
import ReviewSession from '../models/ReviewSession';
import Card from '../models/Card';
import { sm2, sessionScore, intervalLabel } from '../utils/sm2';
import type { ReviewQuality } from '../models/ReviewSession';

export const startSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { topicId } = req.params;
    const session = await ReviewSession.create({ userId, topicId, startedAt: new Date() });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const submitReview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { sessionId } = req.params;
    const { cardId, quality, timeSpentMs } = req.body as {
      cardId: string;
      quality: ReviewQuality;
      timeSpentMs: number;
    };

    if (cardId === undefined || quality === undefined)
      return res.status(400).json({ message: 'cardId and quality (0-5) required' });

    if (quality < 0 || quality > 5 || !Number.isInteger(quality))
      return res.status(400).json({ message: 'quality must be an integer 0-5' });

    const card = await Card.findOne({ _id: cardId, userId });
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const prevEF = card.easeFactor;
    const prevInterval = card.interval;

    const result = sm2({
      quality,
      repetitions: card.repetitions,
      easeFactor: card.easeFactor,
      interval: card.interval,
    });

    const isCorrect = quality >= 3;
    const updatedHistory = [...card.qualityHistory.slice(-19), quality];

    await Card.findByIdAndUpdate(cardId, {
      repetitions: result.repetitions,
      easeFactor: result.easeFactor,
      interval: result.interval,
      nextReviewAt: result.nextReviewAt,
      lastReviewedAt: new Date(),
      isMature: result.interval >= 21,
      $inc: {
        timesReviewed: 1,
        timesCorrect: isCorrect ? 1 : 0,
        timesWrong: isCorrect ? 0 : 1,
      },
      qualityHistory: updatedHistory,
    });

    const session = await ReviewSession.findOneAndUpdate(
      { _id: sessionId, userId },
      {
        $push: {
          reviews: {
            cardId,
            quality,
            timeSpentMs: timeSpentMs || 0,
            previousInterval: prevInterval,
            newInterval: result.interval,
            previousEaseFactor: prevEF,
            newEaseFactor: result.easeFactor,
            reviewedAt: new Date(),
          },
        },
        $inc: {
          totalCards: 1,
          correctCount: isCorrect ? 1 : 0,
          wrongCount: isCorrect ? 0 : 1,
        },
      },
      { new: true }
    );

    if (!session) return res.status(404).json({ message: 'Session not found' });

    res.json({
      session,
      sm2Result: {
        newInterval: result.interval,
        newEaseFactor: result.easeFactor,
        nextReviewAt: result.nextReviewAt,
        nextReviewLabel: intervalLabel(result.interval),
        repetitions: result.repetitions,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const completeSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { sessionId } = req.params;
    const session = await ReviewSession.findOne({ _id: sessionId, userId });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const qualities = session.reviews.map((r) => r.quality);
    const score = sessionScore(qualities);

    const updated = await ReviewSession.findByIdAndUpdate(
      sessionId,
      { completedAt: new Date(), score },
      { new: true }
    ).populate('topicId', 'title emoji color');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const getSessionHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { topicId } = req.params;
    const sessions = await ReviewSession.find({ userId, topicId, completedAt: { $exists: true } })
      .sort({ completedAt: -1 })
      .limit(50)
      .select('-reviews');
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).userId);
    const { topicId } = req.query;

    const matchStage: Record<string, unknown> = { userId, completedAt: { $exists: true } };
    if (topicId) matchStage.topicId = new mongoose.Types.ObjectId(topicId as string);

    const sessions = await ReviewSession.find(matchStage).sort({ completedAt: -1 });

    // ─── Basic totals ─────────────────────────────────────────────────────────
    const totalSessions = sessions.length;
    const totalCardsReviewed = sessions.reduce((s, r) => s + r.totalCards, 0);
    const totalCorrect = sessions.reduce((s, r) => s + r.correctCount, 0);
    const totalWrong = sessions.reduce((s, r) => s + r.wrongCount, 0);
    const overallAccuracy = totalCardsReviewed > 0 ? Math.round((totalCorrect / totalCardsReviewed) * 100) : 0;
    const averageScore = totalSessions > 0 ? Math.round(sessions.reduce((s, r) => s + r.score, 0) / totalSessions) : 0;

    // ─── Quality distribution (how often each quality was given) ─────────────
    const allQualities = sessions.flatMap((s) => s.reviews.map((r) => r.quality));
    const qualityDistribution = [0, 1, 2, 3, 4, 5].map((q) => ({
      quality: q,
      count: allQualities.filter((x) => x === q).length,
      label: ['Blackout', 'Bad', 'Hard (seen)', 'Hard', 'Good', 'Easy'][q],
    }));

    // ─── Average quality over time (trend) ────────────────────────────────────
    const avgQuality = allQualities.length > 0
      ? +((allQualities as number[]).reduce((a, b) => a + b, 0) / allQualities.length).toFixed(2)
      : 0;

    // ─── 7-day daily activity ─────────────────────────────────────────────────
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const dailyActivity = last7Days.map((day) => {
      const daySessions = sessions.filter((s) => s.completedAt?.toISOString().split('T')[0] === day);
      const dayQualities = daySessions.flatMap((s) => s.reviews.map((r) => r.quality));
      return {
        date: day,
        sessions: daySessions.length,
        cardsReviewed: daySessions.reduce((s, r) => s + r.totalCards, 0),
        accuracy: daySessions.length > 0 ? Math.round(daySessions.reduce((s, r) => s + r.score, 0) / daySessions.length) : 0,
        avgQuality: dayQualities.length > 0
          ? +((dayQualities as number[]).reduce((a, b) => a + b, 0) / dayQualities.length).toFixed(1)
          : 0,
      };
    });

    // ─── Card-level stats ─────────────────────────────────────────────────────
    const cardQuery = topicId ? { userId, topicId: new mongoose.Types.ObjectId(topicId as string) } : { userId };
    const allCards = await Card.find(cardQuery).select(
      'question answer topicId timesReviewed timesCorrect timesWrong easeFactor interval repetitions isMature nextReviewAt qualityHistory'
    );

    const reviewedCards = allCards.filter((c) => c.timesReviewed > 0);
    const matureCards = allCards.filter((c) => c.isMature).length;
    const youngCards = reviewedCards.filter((c) => !c.isMature).length;
    const newCards = allCards.filter((c) => c.timesReviewed === 0).length;

    // ─── Due cards ───────────────────────────────────────────────────────────
    const now = new Date();
    const dueToday = allCards.filter((c) => !c.nextReviewAt || c.nextReviewAt <= now).length;

    // ─── Weak cards (lowest accuracy, reviewed at least 3 times) ────────────
    const weakCards = reviewedCards
      .filter((c) => c.timesReviewed >= 3)
      .map((c) => ({
        _id: c._id,
        topicId: c.topicId,
        question: c.question,
        answer: c.answer,
        accuracy: Math.round((c.timesCorrect / c.timesReviewed) * 100),
        timesReviewed: c.timesReviewed,
        easeFactor: +c.easeFactor.toFixed(2),
        interval: c.interval,
        avgQuality: c.qualityHistory.length > 0
          ? +(c.qualityHistory.reduce((a, b) => a + b, 0) / c.qualityHistory.length).toFixed(1)
          : 0,
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 8);

    // ─── Strongest cards (highest EF, mature) ────────────────────────────────
    const strongCards = reviewedCards
      .filter((c) => c.isMature)
      .sort((a, b) => b.easeFactor - a.easeFactor)
      .slice(0, 5)
      .map((c) => ({
        _id: c._id,
        question: c.question,
        easeFactor: +c.easeFactor.toFixed(2),
        interval: c.interval,
        accuracy: Math.round((c.timesCorrect / c.timesReviewed) * 100),
      }));

    // ─── Retention rate (% of reviews that were quality >= 3) ───────────────
    const retentionRate = totalCardsReviewed > 0 ? Math.round((totalCorrect / totalCardsReviewed) * 100) : 0;

    // ─── Forecast: cards due per day for next 7 days ─────────────────────────
    const forecast = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(23, 59, 59, 999);
      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      return {
        date: startOfDay.toISOString().split('T')[0],
        dueCount: allCards.filter((c) => {
          if (!c.nextReviewAt) return i === 0;
          return c.nextReviewAt >= startOfDay && c.nextReviewAt <= d;
        }).length,
      };
    });

    // ─── Study streak ─────────────────────────────────────────────────────────
    const sessionDays = [
      ...new Set(sessions.map((s) => s.completedAt?.toISOString().split('T')[0])),
    ]
      .filter(Boolean)
      .sort()
      .reverse() as string[];

    let streakDays = 0;
    for (let i = 0; i < sessionDays.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      const exp = expected.toISOString().split('T')[0];
      if (sessionDays[i] === exp) streakDays++;
      else break;
    }

    res.json({
      // Totals
      totalSessions,
      totalCardsReviewed,
      totalCorrect,
      totalWrong,
      overallAccuracy,
      averageScore,
      retentionRate,
      avgQuality,
      streakDays,
      dueToday,
      // Card states (like Anki)
      cardStates: { new: newCards, young: youngCards, mature: matureCards, total: allCards.length },
      // Distribution
      qualityDistribution,
      dailyActivity,
      forecast,
      recentSessions: sessions.slice(0, 10).map((s) => ({
        _id: s._id,
        topicId: s.topicId,
        score: s.score,
        totalCards: s.totalCards,
        correctCount: s.correctCount,
        wrongCount: s.wrongCount,
        completedAt: s.completedAt,
      })),
      weakCards,
      strongCards,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};
