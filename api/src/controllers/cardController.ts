import { Request, Response } from 'express';
import Card from '../models/Card';
import Topic from '../models/Topic';

export const getCards = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { topicId } = req.params;
    const cards = await Card.find({ topicId, userId }).sort({ createdAt: -1 });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const getCard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const card = await Card.findOne({ _id: req.params.id, userId });
    if (!card) return res.status(404).json({ message: 'Card not found' });
    res.json(card);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const createCard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { topicId } = req.params;
    const { question, answer, language } = req.body;

    if (!question || !answer)
      return res.status(400).json({ message: 'Question and answer are required' });

    const topic = await Topic.findOne({ _id: topicId, userId });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    const card = await Card.create({ topicId, userId, question, answer, language: language || topic.language });
    await Topic.findByIdAndUpdate(topicId, { $inc: { cardCount: 1 } });

    res.status(201).json(card);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const updateCard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { question, answer, language } = req.body;
    const card = await Card.findOneAndUpdate(
      { _id: req.params.id, userId },
      { question, answer, language },
      { new: true, runValidators: true }
    );
    if (!card) return res.status(404).json({ message: 'Card not found' });
    res.json(card);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const deleteCard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const card = await Card.findOneAndDelete({ _id: req.params.id, userId });
    if (!card) return res.status(404).json({ message: 'Card not found' });
    await Topic.findByIdAndUpdate(card.topicId, { $inc: { cardCount: -1 } });
    res.json({ message: 'Card deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const getDueCards = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { topicId } = req.params;
    const now = new Date();
    const cards = await Card.find({
      topicId,
      userId,
      $or: [{ nextReviewAt: { $lte: now } }, { nextReviewAt: null }, { timesReviewed: 0 }],
    }).sort({ nextReviewAt: 1 });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};
