import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  subscriptionTier: 'free' | 'pro';
  revenueCatUserId?: string;
  aiGenerationsUsed: number;
  aiGenerationsMonth: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    subscriptionTier: { type: String, enum: ['free', 'pro'], default: 'free' },
    revenueCatUserId: { type: String },
    aiGenerationsUsed: { type: Number, default: 0 },
    aiGenerationsMonth: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
