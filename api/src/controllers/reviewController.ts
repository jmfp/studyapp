import { Request, Response } from 'express';
import ReviewSession from '../models/ReviewSession';
import Card from '../models/Card';
import mongoose from 'mongoose';

const SM2 = (easeFactor: number, interval: number, result: 'correct' | 'wrong') => {
  if (result === 'wrong') {
    return { easeFactor: Math.max(1.3, easeFactor - 0.2), interval: 1 };
  }
  const newInterval = interval === 1 ? 6 : Math.round(interval * easeFactor);
  const newEase = easeFactor + 0.1;
  return { easeFactor: newEase, interval: newInterval };
};

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
    const { cardId, result, timeSpentMs } = req.body;

    if (!cardId || !result) return res.status(400).json({ message: 'cardId and result required' });

    const card = await Card.findOne({ _id: cardId, userId });
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const { easeFactor, interval } = SM2(card.easeFactor, card.interval, result);
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    await Card.findByIdAndUpdate(cardId, {
      $inc: {
        timesReviewed: 1,
        timesCorrect: result === 'correct' ? 1 : 0,
        timesWrong: result === 'wrong' ? 1 : 0,
      },
      lastReviewedAt: new Date(),
      easeFactor,
      interval,
      nextReviewAt: nextReview,
    });

    const session = await ReviewSession.findOneAndUpdate(
      { _id: sessionId, userId },
      {
        $push: { reviews: { cardId, result, timeSpentMs: timeSpentMs || 0, reviewedAt: new Date() } },
        $inc: {
          totalCards: 1,
          correctCount: result === 'correct' ? 1 : 0,
          wrongCount: result === 'wrong' ? 1 : 0,
        },
      },
      { new: true }
    );

    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
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

    const score = session.totalCards > 0
      ? Math.round((session.correctCount / session.totalCards) * 100)
      : 0;

    const updated = await ReviewSession.findByIdAndUpdate(
      sessionId,
      { completedAt: new Date(), score },
      { new: true }
    ).populate('topicId', 'title');

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

    const totalSessions = sessions.length;
    const totalCardsReviewed = sessions.reduce((s, r) => s + r.totalCards, 0);
    const totalCorrect = sessions.reduce((s, r) => s + r.correctCount, 0);
    const totalWrong = sessions.reduce((s, r) => s + r.wrongCount, 0);
    const overallAccuracy = totalCardsReviewed > 0 ? Math.round((totalCorrect / totalCardsReviewed) * 100) : 0;
    const averageScore = totalSessions > 0 ? Math.round(sessions.reduce((s, r) => s + r.score, 0) / totalSessions) : 0;

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const dailyActivity = last7Days.map((day) => {
      const daySessions = sessions.filter((s) => {
        const sd = s.completedAt?.toISOString().split('T')[0];
        return sd === day;
      });
      return {
        date: day,
        sessions: daySessions.length,
        cardsReviewed: daySessions.reduce((s, r) => s + r.totalCards, 0),
        accuracy: daySessions.length > 0
          ? Math.round(daySessions.reduce((s, r) => s + r.score, 0) / daySessions.length)
          : 0,
      };
    });

    const recentSessions = sessions.slice(0, 10).map((s) => ({
      _id: s._id,
      topicId: s.topicId,
      score: s.score,
      totalCards: s.totalCards,
      correctCount: s.correctCount,
      wrongCount: s.wrongCount,
      completedAt: s.completedAt,
    }));

    const cardStats = await Card.find(topicId
      ? { userId, topicId: topicId as string }
      : { userId }
    ).select('question timesReviewed timesCorrect timesWrong easeFactor nextReviewAt');

    const weakCards = cardStats
      .filter((c) => c.timesReviewed > 0)
      .sort((a, b) => {
        const aRate = a.timesCorrect / a.timesReviewed;
        const bRate = b.timesCorrect / b.timesReviewed;
        return aRate - bRate;
      })
      .slice(0, 5)
      .map((c) => ({
        _id: c._id,
        question: c.question,
        accuracy: Math.round((c.timesCorrect / c.timesReviewed) * 100),
        timesReviewed: c.timesReviewed,
      }));

    const dueToday = cardStats.filter((c) => {
      if (!c.nextReviewAt) return true;
      return c.nextReviewAt <= new Date();
    }).length;

    const streakDays = (() => {
      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      const sessionDays = [...new Set(sessions.map((s) => s.completedAt?.toISOString().split('T')[0]))].sort().reverse();
      for (let i = 0; i < sessionDays.length; i++) {
        const expected = new Date();
        expected.setDate(expected.getDate() - i);
        const exp = expected.toISOString().split('T')[0];
        if (sessionDays[i] === exp || (i === 0 && sessionDays[0] === today)) {
          streak++;
        } else break;
      }
      return streak;
    })();

    res.json({
      totalSessions,
      totalCardsReviewed,
      totalCorrect,
      totalWrong,
      overallAccuracy,
      averageScore,
      streakDays,
      dueToday,
      dailyActivity,
      recentSessions,
      weakCards,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};
