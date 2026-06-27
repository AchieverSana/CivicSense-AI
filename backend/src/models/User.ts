import mongoose, { Document, Schema } from 'mongoose';

export type BadgeTier = 'Bronze Hero' | 'Silver Hero' | 'Gold Hero' | 'Platinum Hero';

export interface IUser extends Document {
  uid: string; // Firebase UID
  name: string;
  email: string;
  avatar?: string;
  role: 'citizen' | 'admin' | 'authority';
  points: number;
  badge: BadgeTier;
  city: string;
  issuesReported: number;
  issuesVerified: number;
  issuesResolved: number;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    avatar: String,
    role: { type: String, default: 'citizen', enum: ['citizen', 'admin', 'authority'] },
    points: { type: Number, default: 0 },
    badge: { type: String, default: 'Bronze Hero', enum: ['Bronze Hero', 'Silver Hero', 'Gold Hero', 'Platinum Hero'] },
    city: { type: String, default: 'Jaipur' },
    issuesReported: { type: Number, default: 0 },
    issuesVerified: { type: Number, default: 0 },
    issuesResolved: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-update badge tier based on points
UserSchema.pre('save', function (next) {
  if (this.points >= 5000) this.badge = 'Platinum Hero';
  else if (this.points >= 1500) this.badge = 'Gold Hero';
  else if (this.points >= 500) this.badge = 'Silver Hero';
  else this.badge = 'Bronze Hero';
  next();
});

export default mongoose.model<IUser>('User', UserSchema);
