import { Request, Response } from 'express';
import Topic from '../models/Topic';
import Card from '../models/Card';
import { checkAiGenerationAllowed, consumeAiGeneration, getAiUsage, requireProForAi } from '../utils/aiUsage';
import { generateCardsFromSource, isAiConfigured } from '../services/aiService';
import { suggestCardImprovements } from '../services/cardImproveService';
import { getStudyCoachHints } from '../services/studyCoachService';
import { runMultilingualAssist } from '../services/multilingualAiService';
import { generateAnalyticsInsights } from '../services/analyticsInsightsService';
import ReviewSession from '../models/ReviewSession';
import mongoose from 'mongoose';
import { MAX_BULK_CARDS } from '../constants/ai';
import {
  computeStudyStreak,
  getTimezoneOffsetFromQuery,
  localDayBounds,
  toLocalDateKey,
  addDaysToDateKey,
} from '../utils/localDate';

export const getAiUsageStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const usage = await getAiUsage(userId);
    res.json({ ...usage, configured: isAiConfigured() });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const generateCards = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { topicId } = req.params;
    const { sourceType, content, imageBase64, pdfBase64, mimeType, maxCards } = req.body;

    if (!isAiConfigured()) {
      return res.status(503).json({
        message: 'AI generation is not configured. Set OPENAI_API_KEY on the API server.',
        code: 'AI_NOT_CONFIGURED',
      });
    }

    if (!['text', 'url', 'site', 'image', 'pdf'].includes(sourceType)) {
      return res.status(400).json({ message: 'sourceType must be text, url, site, image, or pdf' });
    }

    const topic = await Topic.findOne({ _id: topicId, userId });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    const quota = await checkAiGenerationAllowed(userId);
    if (!quota.allowed) {
      const isProRequired = quota.code === 'AI_PRO_REQUIRED';
      return res.status(403).json({
        message: isProRequired
          ? 'AI features require StuhDee Pro'
          : 'AI generation limit reached for this month',
        code: quota.code ?? 'AI_LIMIT_REACHED',
        usage: quota.usage,
      });
    }

    const result = await generateCardsFromSource({
      sourceType,
      content,
      imageBase64,
      pdfBase64,
      mimeType,
      sourceLanguage: topic.sourceLanguage || 'en',
      language: topic.language || 'en',
      maxCards,
    });

    const consumed = await consumeAiGeneration(userId);

    res.json({
      cards: result.cards,
      usage: consumed.usage,
      meta: result.meta,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed';
    res.status(400).json({ message, code: 'AI_GENERATION_FAILED' });
  }
};

export const improveCard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { topicId, id: cardId } = req.params;
    const trigger = req.body?.trigger === 'weak_card' ? 'weak_card' : 'manual';

    if (!isAiConfigured()) {
      return res.status(503).json({
        message: 'AI is not configured. Set OPENAI_API_KEY on the API server.',
        code: 'AI_NOT_CONFIGURED',
      });
    }

    const proCheck = await requireProForAi(userId);
    if (!proCheck.allowed) {
      return res.status(403).json({
        message: 'AI features require StuhDee Pro',
        code: 'AI_PRO_REQUIRED',
        usage: proCheck.usage,
      });
    }

    const topic = await Topic.findOne({ _id: topicId, userId });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    const card = await Card.findOne({ _id: cardId, topicId, userId });
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const avgQuality = card.qualityHistory.length > 0
      ? +(card.qualityHistory.reduce((a, b) => a + b, 0) / card.qualityHistory.length).toFixed(1)
      : 0;

    const result = await suggestCardImprovements({
      question: card.question,
      answer: card.answer,
      sourceLanguage: topic.sourceLanguage || 'en',
      language: topic.language || 'en',
      timesReviewed: card.timesReviewed,
      timesCorrect: card.timesCorrect,
      timesWrong: card.timesWrong,
      easeFactor: card.easeFactor,
      interval: card.interval,
      avgQuality,
      trigger,
    });

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Card improvement failed';
    res.status(400).json({ message, code: 'AI_IMPROVE_FAILED' });
  }
};

export const studyCoach = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { topicId, id: cardId } = req.params;
    const qualityRated = Number(req.body?.qualityRated ?? 2);

    if (!isAiConfigured()) {
      return res.status(503).json({ message: 'AI is not configured', code: 'AI_NOT_CONFIGURED' });
    }

    const proCheck = await requireProForAi(userId);
    if (!proCheck.allowed) {
      return res.status(403).json({
        message: 'AI features require StuhDee Pro',
        code: 'AI_PRO_REQUIRED',
        usage: proCheck.usage,
      });
    }

    const topic = await Topic.findOne({ _id: topicId, userId });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    const card = await Card.findOne({ _id: cardId, topicId, userId });
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const peers = await Card.find({ topicId, userId, _id: { $ne: cardId } })
      .select('question answer')
      .limit(8);

    const avgQuality = card.qualityHistory.length > 0
      ? +(card.qualityHistory.reduce((a, b) => a + b, 0) / card.qualityHistory.length).toFixed(1)
      : 0;

    const result = await getStudyCoachHints({
      question: card.question,
      answer: card.answer,
      sourceLanguage: topic.sourceLanguage || 'en',
      language: topic.language || 'en',
      timesReviewed: card.timesReviewed,
      timesCorrect: card.timesCorrect,
      avgQuality,
      qualityRated,
      deckPeers: peers.map((p) => ({ question: p.question, answer: p.answer })),
    });

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Study coach failed';
    res.status(400).json({ message, code: 'AI_COACH_FAILED' });
  }
};

export const multilingualAssist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { topicId } = req.params;
    const { action, question, answer, text, side } = req.body;

    if (!isAiConfigured()) {
      return res.status(503).json({ message: 'AI is not configured', code: 'AI_NOT_CONFIGURED' });
    }

    if (!['translate', 'examples', 'reverse', 'romaji', 'nativeScript'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const proCheck = await requireProForAi(userId);
    if (!proCheck.allowed) {
      return res.status(403).json({
        message: 'AI features require StuhDee Pro',
        code: 'AI_PRO_REQUIRED',
        usage: proCheck.usage,
      });
    }

    const topic = await Topic.findOne({ _id: topicId, userId });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    const result = await runMultilingualAssist({
      action,
      question,
      answer,
      text,
      side,
      sourceLanguage: topic.sourceLanguage || 'en',
      language: topic.language || 'en',
    });

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Multilingual assist failed';
    res.status(400).json({ message, code: 'AI_MULTILINGUAL_FAILED' });
  }
};

export const getAnalyticsInsights = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).userId);
    const { topicId } = req.query;
    const tzOffset = getTimezoneOffsetFromQuery(req);
    const todayKey = toLocalDateKey(new Date(), tzOffset);
    const tomorrowKey = addDaysToDateKey(todayKey, 1);

    if (!isAiConfigured()) {
      return res.status(503).json({ message: 'AI is not configured', code: 'AI_NOT_CONFIGURED' });
    }

    const proCheck = await requireProForAi((req as any).userId);
    if (!proCheck.allowed) {
      return res.status(403).json({
        message: 'AI features require StuhDee Pro',
        code: 'AI_PRO_REQUIRED',
        usage: proCheck.usage,
      });
    }

    let topicTitle: string | undefined;
    if (topicId) {
      const topic = await Topic.findOne({ _id: topicId, userId });
      if (!topic) return res.status(404).json({ message: 'Topic not found' });
      topicTitle = topic.title;
    }

    const sessionMatch: Record<string, unknown> = { userId, completedAt: { $exists: true } };
    if (topicId) sessionMatch.topicId = new mongoose.Types.ObjectId(topicId as string);

    const sessions = await ReviewSession.find(sessionMatch).sort({ completedAt: -1 });
    const cardQuery = topicId
      ? { userId, topicId: new mongoose.Types.ObjectId(topicId as string) }
      : { userId };

    const allCards = await Card.find(cardQuery).select(
      'question timesReviewed timesCorrect easeFactor interval nextReviewAt qualityHistory',
    );

    const allQualities = sessions.flatMap((s) => s.reviews.map((r) => r.quality));
    const avgQuality = allQualities.length > 0
      ? +((allQualities as number[]).reduce((a, b) => a + b, 0) / allQualities.length).toFixed(2)
      : 0;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekSessions = sessions.filter((s) => s.completedAt && s.completedAt >= weekAgo);
    const weekQualities = weekSessions.flatMap((s) => s.reviews.map((r) => r.quality));
    const lowQualityCount = weekQualities.filter((q) => q <= 2).length;
    const totalReviewsThisWeek = weekQualities.length;

    const { end: todayEnd } = localDayBounds(todayKey, tzOffset);
    const dueToday = allCards.filter((c) => !c.nextReviewAt || c.nextReviewAt <= todayEnd).length;

    const { start: tomorrowStart, end: tomorrowEnd } = localDayBounds(tomorrowKey, tzOffset);
    const dueTomorrow = allCards.filter(
      (c) => c.nextReviewAt && c.nextReviewAt >= tomorrowStart && c.nextReviewAt <= tomorrowEnd,
    ).length;

    const totalCorrect = sessions.reduce((s, r) => s + r.correctCount, 0);
    const totalCardsReviewed = sessions.reduce((s, r) => s + r.totalCards, 0);
    const retentionRate = totalCardsReviewed > 0 ? Math.round((totalCorrect / totalCardsReviewed) * 100) : 0;

    const streakDays = computeStudyStreak(
      sessions.map((s) => s.completedAt).filter((d): d is Date => !!d),
      tzOffset,
    );

    const weakCards = allCards
      .filter((c) => c.timesReviewed >= 3)
      .map((c) => ({
        question: c.question,
        accuracy: Math.round((c.timesCorrect / c.timesReviewed) * 100),
        timesReviewed: c.timesReviewed,
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    const result = await generateAnalyticsInsights({
      streakDays,
      retentionRate,
      dueToday,
      dueTomorrow,
      avgQuality,
      weakCards,
      lowQualityCount,
      totalReviewsThisWeek,
      topicTitle,
    });

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Insights generation failed';
    res.status(400).json({ message, code: 'AI_INSIGHTS_FAILED' });
  }
};

export const bulkCreateCards = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { topicId } = req.params;
    const { cards } = req.body as { cards?: { question: string; answer: string }[] };

    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ message: 'At least one card is required' });
    }

    if (cards.length > MAX_BULK_CARDS) {
      return res.status(400).json({ message: `Maximum ${MAX_BULK_CARDS} cards per import` });
    }

    const topic = await Topic.findOne({ _id: topicId, userId });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    const cleaned = cards
      .map((c) => ({
        question: String(c.question ?? '').trim(),
        answer: String(c.answer ?? '').trim(),
      }))
      .filter((c) => c.question && c.answer);

    if (cleaned.length === 0) {
      return res.status(400).json({ message: 'No valid cards to save' });
    }

    const created = await Card.insertMany(
      cleaned.map((c) => ({
        topicId,
        userId,
        question: c.question,
        answer: c.answer,
        language: topic.language || 'en',
      })),
    );

    await Topic.findByIdAndUpdate(topicId, { $inc: { cardCount: created.length } });

    res.status(201).json({
      cards: created,
      count: created.length,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};
