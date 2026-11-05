import mongoose, { Schema, Document, Types } from 'mongoose';
import { ReviewDecision } from '../types';

export interface IReview extends Document {
  submissionId: Types.ObjectId;
  versionId?: Types.ObjectId;
  organisationId: Types.ObjectId;
  reviewerId: Types.ObjectId;
  decision: ReviewDecision;
  decisionSummary: string;
  notes?: string;
  completedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    submissionId: { type: Schema.Types.ObjectId, ref: 'ContentSubmission', required: true, index: true },
    versionId: { type: Schema.Types.ObjectId, ref: 'ContentVersion' },
    organisationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    decision: {
      type: String,
      enum: ['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'],
      required: true,
      index: true,
    },
    decisionSummary: { type: String, required: true },
    notes: { type: String },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

ReviewSchema.index({ organisationId: 1, completedAt: -1 });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
