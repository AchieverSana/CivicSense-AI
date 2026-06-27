import mongoose, { Document, Schema } from 'mongoose';

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type IssueStatus = 'open' | 'in-progress' | 'resolved' | 'rejected';
export type IssueCategory =
  | 'Pothole'
  | 'Garbage'
  | 'Water leakage'
  | 'Broken streetlight'
  | 'Road damage'
  | 'Sewage'
  | 'Tree fall'
  | 'Other';

export interface IIssue extends Document {
  title: string;
  description: string;
  category: IssueCategory;
  severity: Severity;
  status: IssueStatus;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
    address: string;
    ward?: string;
    city: string;
  };
  media: Array<{ url: string; publicId: string; type: 'image' | 'video' }>;
  reportedBy: mongoose.Types.ObjectId;
  department: string;
  priorityScore: number;
  aiAnalysis: {
    category: string;
    severity: string;
    confidence: number;
    suggestedDepartment: string;
    estimatedFixDays: number;
    rawResponse?: string;
  };
  votes: mongoose.Types.ObjectId[];
  verifiedBy: mongoose.Types.ObjectId[];
  duplicateOf?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  resolutionNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema = new Schema<IIssue>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 2000 },
    category: {
      type: String,
      required: true,
      enum: ['Pothole', 'Garbage', 'Water leakage', 'Broken streetlight', 'Road damage', 'Sewage', 'Tree fall', 'Other'],
    },
    severity: { type: String, required: true, enum: ['Critical', 'High', 'Medium', 'Low'] },
    status: { type: String, default: 'open', enum: ['open', 'in-progress', 'resolved', 'rejected'] },
    location: {
      type: { type: String, default: 'Point', enum: ['Point'] },
      coordinates: { type: [Number], required: true }, // [lng, lat]
      address: { type: String, required: true },
      ward: String,
      city: { type: String, required: true },
    },
    media: [{ url: String, publicId: String, type: { type: String, enum: ['image', 'video'] } }],
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: String, required: true },
    priorityScore: { type: Number, default: 0, min: 0, max: 100 },
    aiAnalysis: {
      category: String,
      severity: String,
      confidence: Number,
      suggestedDepartment: String,
      estimatedFixDays: Number,
      rawResponse: String,
    },
    votes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    verifiedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    duplicateOf: { type: Schema.Types.ObjectId, ref: 'Issue' },
    resolvedAt: Date,
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolutionNote: String,
  },
  { timestamps: true }
);

// Geospatial index for nearby queries
IssueSchema.index({ location: '2dsphere' });
IssueSchema.index({ status: 1, createdAt: -1 });
IssueSchema.index({ 'location.city': 1, category: 1 });
IssueSchema.index({ priorityScore: -1 });

export default mongoose.model<IIssue>('Issue', IssueSchema);
