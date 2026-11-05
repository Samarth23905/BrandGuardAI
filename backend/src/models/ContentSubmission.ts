import mongoose, { Schema, Document, Types } from 'mongoose';
import { SubmissionStatus, ContentType } from '../types';

export interface IContentSubmission extends Document {
  organisationId: Types.ObjectId;
  title: string;
  contentType: ContentType;
  targetAudience?: string;
  channel?: string;
  currentVersionNumber: number;
  latestVersionId?: Types.ObjectId;
  status: SubmissionStatus;
  creatorId: Types.ObjectId;
  assignedReviewerId?: Types.ObjectId;
  latestScore?: number;
  criticalViolationsCount?: number;
  finalDecision?: {
    decidedBy: Types.ObjectId;
    decidedAt: Date;
    status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
    comment?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ContentSubmissionSchema = new Schema<IContentSubmission>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    title: { type: String, required: true, trim: true },
    contentType: {
      type: String,
      enum: ['AD_COPY', 'BLOG_POST', 'SOCIAL_POST', 'PRODUCT_DESCRIPTION', 'PRESS_RELEASE', 'EMAIL_NEWSLETTER', 'GENERAL_COPY'],
      default: 'AD_COPY',
      required: true,
    },
    targetAudience: { type: String },
    channel: { type: String },
    currentVersionNumber: { type: Number, default: 1 },
    latestVersionId: { type: Schema.Types.ObjectId, ref: 'ContentVersion' },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'ANALYSING', 'NEEDS_REVISION', 'READY_FOR_REVIEW', 'IN_REVIEW', 'APPROVED', 'REJECTED'],
      default: 'SUBMITTED',
      index: true,
    },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedReviewerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    latestScore: { type: Number },
    criticalViolationsCount: { type: Number, default: 0 },
    finalDecision: {
      decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      decidedAt: { type: Date },
      status: { type: String, enum: ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'] },
      comment: { type: String },
    },
  },
  { timestamps: true }
);

ContentSubmissionSchema.index({ organisationId: 1, status: 1 });
ContentSubmissionSchema.index({ organisationId: 1, creatorId: 1 });

export const ContentSubmission = mongoose.model<IContentSubmission>('ContentSubmission', ContentSubmissionSchema);
