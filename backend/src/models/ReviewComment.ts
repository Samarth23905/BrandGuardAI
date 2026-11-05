import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReviewComment extends Document {
  submissionId: Types.ObjectId;
  versionId?: Types.ObjectId;
  organisationId: Types.ObjectId;
  authorId: Types.ObjectId;
  text: string;
  anchorText?: string;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewCommentSchema = new Schema<IReviewComment>(
  {
    submissionId: { type: Schema.Types.ObjectId, ref: 'ContentSubmission', required: true, index: true },
    versionId: { type: Schema.Types.ObjectId, ref: 'ContentVersion' },
    organisationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    anchorText: { type: String },
    isResolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ReviewComment = mongoose.model<IReviewComment>('ReviewComment', ReviewCommentSchema);
