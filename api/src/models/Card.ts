import mongoose, { Document, Schema } from 'mongoose';

export interface ICard extends Document {
  _id: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  question: string;
  answer: string;
  language: string;
  // SM-2 core fields
  repetitions: number;      // n: how many times reviewed with quality >= 3 in a row
  easeFactor: number;       // EF: starts 2.5, min 1.3
  interval: number;         // I: days until next review
  // Stats
  timesReviewed: number;
  timesCorrect: number;     // quality >= 3
  timesWrong: number;       // quality < 3
  qualityHistory: number[]; // last 20 quality ratings
  lastReviewedAt?: Date;
  nextReviewAt?: Date;
  // Computed helpers
  isMature: boolean;        // interval >= 21 days
  createdAt: Date;
  updatedAt: Date;
}

const CardSchema = new Schema<ICard>(
  {
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    language: { type: String, default: 'en' },
    repetitions: { type: Number, default: 0 },
    easeFactor: { type: Number, default: 2.5 },
    interval: { type: Number, default: 0 },
    timesReviewed: { type: Number, default: 0 },
    timesCorrect: { type: Number, default: 0 },
    timesWrong: { type: Number, default: 0 },
    qualityHistory: { type: [Number], default: [] },
    lastReviewedAt: { type: Date },
    nextReviewAt: { type: Date },
    isMature: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CardSchema.index({ topicId: 1, createdAt: -1 });
CardSchema.index({ userId: 1, nextReviewAt: 1 });
CardSchema.index({ userId: 1, isMature: 1 });

export default mongoose.model<ICard>('Card', CardSchema);
