import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Topic from '../models/Topic';
import Card from '../models/Card';
import ReviewSession from '../models/ReviewSession';

const signToken = (id: string) =>
  jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: '30d' });

const userPayload = (user: InstanceType<typeof User>) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  subscriptionTier: user.subscriptionTier,
});

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed });
    const token = signToken(user._id.toString());

    res.status(201).json({ token, user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user._id.toString());
    res.json({ token, user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as any).userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Delete all user data then the account itself
    await Promise.all([
      Topic.deleteMany({ userId }),
      Card.deleteMany({ userId }),
      ReviewSession.deleteMany({ userId }),
    ]);
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

// Called by mobile after RevenueCat purchase is verified on device
export const updateSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { subscriptionTier, revenueCatUserId } = req.body;

    if (!['free', 'pro'].includes(subscriptionTier))
      return res.status(400).json({ message: 'Invalid subscription tier' });

    const user = await User.findByIdAndUpdate(
      userId,
      { subscriptionTier, ...(revenueCatUserId ? { revenueCatUserId } : {}) },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};
