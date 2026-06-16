import { Request, Response } from 'express';
import Topic from '../models/Topic';
import Card from '../models/Card';
import { checkAiGenerationAllowed, consumeAiGeneration, getAiUsage } from '../utils/aiUsage';
import { generateCardsFromSource, isAiConfigured } from '../services/aiService';
import { MAX_BULK_CARDS } from '../constants/ai';

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

    if (!['text', 'url', 'image', 'pdf'].includes(sourceType)) {
      return res.status(400).json({ message: 'sourceType must be text, url, image, or pdf' });
    }

    const topic = await Topic.findOne({ _id: topicId, userId });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    const quota = await checkAiGenerationAllowed(userId);
    if (!quota.allowed) {
      return res.status(403).json({
        message: 'AI generation limit reached for this month',
        code: 'AI_LIMIT_REACHED',
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
