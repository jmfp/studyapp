import mongoose, { Document, Schema } from 'mongoose';

export interface ITopic extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  language: string;
  sourceLanguage: string;
  color: string;
  emoji: string;
  cardCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema = new Schema<ITopic>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    language: { type: String, default: 'en', trim: true },
    sourceLanguage: { type: String, default: 'en', trim: true },
    color: { type: String, default: '#6C63FF' },
    emoji: { type: String, default: '📚' },
    cardCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

TopicSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<ITopic>('Topic', TopicSchema);
