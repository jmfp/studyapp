import mongoose, { Document, Schema } from 'mongoose';

export interface ICard extends Document {
  _id: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  question: string;
  answer: string;
  language: string;
  timesReviewed: number;
  timesCorrect: number;
  timesWrong: number;
  lastReviewedAt?: Date;
  easeFactor: number;
  interval: number;
  nextReviewAt?: Date;
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
    timesReviewed: { type: Number, default: 0 },
    timesCorrect: { type: Number, default: 0 },
    timesWrong: { type: Number, default: 0 },
    lastReviewedAt: { type: Date },
    easeFactor: { type: Number, default: 2.5 },
    interval: { type: Number, default: 1 },
    nextReviewAt: { type: Date },
  },
  { timestamps: true }
);

CardSchema.index({ topicId: 1, createdAt: -1 });
CardSchema.index({ userId: 1, nextReviewAt: 1 });

export default mongoose.model<ICard>('Card', CardSchema);
