import mongoose, { Document, Schema } from 'mongoose';

export type ReviewResult = 'correct' | 'wrong';

export interface IReviewSession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
  startedAt: Date;
  completedAt?: Date;
  totalCards: number;
  correctCount: number;
  wrongCount: number;
  score: number;
  reviews: {
    cardId: mongoose.Types.ObjectId;
    result: ReviewResult;
    timeSpentMs: number;
    reviewedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSessionSchema = new Schema<IReviewSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    totalCards: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    reviews: [
      {
        cardId: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
        result: { type: String, enum: ['correct', 'wrong'], required: true },
        timeSpentMs: { type: Number, default: 0 },
        reviewedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

ReviewSessionSchema.index({ userId: 1, createdAt: -1 });
ReviewSessionSchema.index({ topicId: 1, createdAt: -1 });

export default mongoose.model<IReviewSession>('ReviewSession', ReviewSessionSchema);
