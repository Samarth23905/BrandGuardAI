import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICorrectionSuggestion extends Document {
  analysisResultId: Types.ObjectId;
  claimFindingId?: Types.ObjectId;
  versionId: Types.ObjectId;
  submissionId: Types.ObjectId;
  organisationId: Types.ObjectId;
  originalText: string;
  problemType: string;
  reason: string;
  relevantGuidelineRef?: string;
  supportingEvidence?: string;
  suggestedReplacement: string;
  rationale: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'MODIFIED';
  userFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CorrectionSuggestionSchema = new Schema<ICorrectionSuggestion>(
  {
    analysisResultId: { type: Schema.Types.ObjectId, ref: 'AnalysisResult', required: true, index: true },
    claimFindingId: { type: Schema.Types.ObjectId, ref: 'ClaimFinding' },
    versionId: { type: Schema.Types.ObjectId, ref: 'ContentVersion', required: true, index: true },
    submissionId: { type: Schema.Types.ObjectId, ref: 'ContentSubmission', required: true, index: true },
    organisationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    originalText: { type: String, required: true },
    problemType: { type: String, required: true },
    reason: { type: String, required: true },
    relevantGuidelineRef: { type: String },
    supportingEvidence: { type: String },
    suggestedReplacement: { type: String, required: true },
    rationale: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'MODIFIED'],
      default: 'PENDING',
    },
    userFeedback: { type: String },
  },
  { timestamps: true }
);

CorrectionSuggestionSchema.index({ analysisResultId: 1, status: 1 });

export const CorrectionSuggestion = mongoose.model<ICorrectionSuggestion>(
  'CorrectionSuggestion',
  CorrectionSuggestionSchema
);
