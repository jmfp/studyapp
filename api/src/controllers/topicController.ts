import { Request, Response } from 'express';
import Topic from '../models/Topic';
import Card from '../models/Card';
import ReviewSession from '../models/ReviewSession';

export const getTopics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const topics = await Topic.find({ userId }).sort({ updatedAt: -1 });
    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const getTopic = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const topic = await Topic.findOne({ _id: req.params.id, userId });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const createTopic = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, description, language, color, emoji } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const topic = await Topic.create({ userId, title, description, language, color, emoji });
    res.status(201).json(topic);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const updateTopic = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, description, language, color, emoji } = req.body;
    const topic = await Topic.findOneAndUpdate(
      { _id: req.params.id, userId },
      { title, description, language, color, emoji },
      { new: true, runValidators: true }
    );
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const deleteTopic = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const topic = await Topic.findOneAndDelete({ _id: req.params.id, userId });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    await Card.deleteMany({ topicId: req.params.id });
    await ReviewSession.deleteMany({ topicId: req.params.id });
    res.json({ message: 'Topic deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};
