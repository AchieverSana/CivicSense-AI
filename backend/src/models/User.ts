import mongoose, { Document, Schema, Model } from 'mongoose';

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

interface IUserModel extends Model<IUser> {
  /**
   * Increments points/issuesReported/issuesVerified/etc and persists via
   * .save() so the pre('save') badge hook actually runs.
   * findByIdAndUpdate({ $inc }) bypasses that hook entirely, which is why
   * badges used to get stuck on "Bronze Hero" forever — use this instead
   * of `User.findByIdAndUpdate(id, { $inc: ... })` anywhere points change.
   * Points never go below 0 (e.g. when a vote is retracted).
   */
  awardPoints(userId: string | mongoose.Types.ObjectId, deltas: Partial<Record<'points' | 'issuesReported' | 'issuesVerified' | 'issuesResolved', number>>): Promise<IUser | null>;
}

const UserSchema = new Schema<IUser, IUserModel>(
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

UserSchema.statics.awardPoints = async function (
  userId: string | mongoose.Types.ObjectId,
  deltas: Partial<Record<'points' | 'issuesReported' | 'issuesVerified' | 'issuesResolved', number>>
) {
  const user = await this.findById(userId);
  if (!user) return null;
  for (const [field, delta] of Object.entries(deltas)) {
    const next = (user as any)[field] + (delta || 0);
    (user as any)[field] = Math.max(0, next);
  }
  await user.save();
  return user;
};

export default mongoose.model<IUser, IUserModel>('User', UserSchema);
