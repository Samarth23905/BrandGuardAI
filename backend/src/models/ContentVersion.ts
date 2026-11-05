import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICorrectionApplied {
  originalText: string;
  replacementText: string;
  ruleRef?: string;
  appliedAt: Date;
}

export interface IContentVersion extends Document {
  submissionId: Types.ObjectId;
  organisationId: Types.ObjectId;
  versionNumber: number;
  rawContent: string;
  wordCount: number;
  creatorId: Types.ObjectId;
  analysisResultId?: Types.ObjectId;
  correctionsApplied: ICorrectionApplied[];
  notes?: string;
  createdAt: Date;
}

const ContentVersionSchema = new Schema<IContentVersion>(
  {
    submissionId: { type: Schema.Types.ObjectId, ref: 'ContentSubmission', required: true, index: true },
    organisationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    versionNumber: { type: Number, required: true },
    rawContent: { type: String, required: true },
    wordCount: { type: Number, default: 0 },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    analysisResultId: { type: Schema.Types.ObjectId, ref: 'AnalysisResult' },
    correctionsApplied: [
      {
        originalText: { type: String, required: true },
        replacementText: { type: String, required: true },
        ruleRef: { type: String },
        appliedAt: { type: Date, default: Date.now },
      },
    ],
    notes: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

ContentVersionSchema.index({ submissionId: 1, versionNumber: 1 }, { unique: true });

export const ContentVersion = mongoose.model<IContentVersion>('ContentVersion', ContentVersionSchema);
