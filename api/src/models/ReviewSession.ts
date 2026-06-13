import mongoose, { Document, Schema } from 'mongoose';

// quality: 0-5 per SM-2 spec
// 0 = complete blackout
// 1 = wrong; correct answer remembered on seeing
// 2 = wrong; but easy to recall once seen
// 3 = correct; but required serious effort
// 4 = correct; after hesitation
// 5 = perfect recall
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface IReviewSession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
  startedAt: Date;
  completedAt?: Date;
  totalCards: number;
  correctCount: number;   // quality >= 3
  wrongCount: number;     // quality < 3
  score: number;          // 0-100 weighted score
  reviews: {
    cardId: mongoose.Types.ObjectId;
    quality: ReviewQuality;
    timeSpentMs: number;
    previousInterval: number;
    newInterval: number;
    previousEaseFactor: number;
    newEaseFactor: number;
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
        quality: { type: Number, enum: [0, 1, 2, 3, 4, 5], required: true },
        timeSpentMs: { type: Number, default: 0 },
        previousInterval: { type: Number, default: 0 },
        newInterval: { type: Number, default: 0 },
        previousEaseFactor: { type: Number, default: 2.5 },
        newEaseFactor: { type: Number, default: 2.5 },
        reviewedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

ReviewSessionSchema.index({ userId: 1, createdAt: -1 });
ReviewSessionSchema.index({ topicId: 1, createdAt: -1 });

export default mongoose.model<IReviewSession>('ReviewSession', ReviewSessionSchema);
