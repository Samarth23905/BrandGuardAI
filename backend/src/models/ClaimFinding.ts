import mongoose, { Schema, Document, Types } from 'mongoose';
import { ClaimCategory, VerificationStatus, SeverityLevel } from '../types';

export interface IEvidenceChunkMatch {
  chunkId?: Types.ObjectId;
  documentTitle: string;
  similarityScore: number;
  snippet: string;
}

export interface IClaimFinding extends Document {
  analysisResultId: Types.ObjectId;
  versionId: Types.ObjectId;
  submissionId: Types.ObjectId;
  organisationId: Types.ObjectId;
  claimText: string;
  claimCategory: ClaimCategory;
  startIndex: number;
  endIndex: number;
  verificationStatus: VerificationStatus;
  severity: SeverityLevel;
  confidence: number;
  explanation: string;
  matchedEvidenceChunks: IEvidenceChunkMatch[];
  matchedFactId?: Types.ObjectId;
  matchedRestrictedClaimId?: Types.ObjectId;
  matchedTerminologyRuleId?: Types.ObjectId;
  isViolation: boolean;
  createdAt: Date;
}

const ClaimFindingSchema = new Schema<IClaimFinding>(
  {
    analysisResultId: { type: Schema.Types.ObjectId, ref: 'AnalysisResult', required: true, index: true },
    versionId: { type: Schema.Types.ObjectId, ref: 'ContentVersion', required: true, index: true },
    submissionId: { type: Schema.Types.ObjectId, ref: 'ContentSubmission', required: true, index: true },
    organisationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    claimText: { type: String, required: true },
    claimCategory: {
      type: String,
      enum: ['FACTUAL', 'PRODUCT', 'PERFORMANCE', 'COMPARATIVE', 'SUPERIORITY', 'GUARANTEE', 'HEALTH_SAFETY', 'PROMOTIONAL'],
      required: true,
    },
    startIndex: { type: Number, default: 0 },
    endIndex: { type: Number, default: 0 },
    verificationStatus: {
      type: String,
      enum: ['SUPPORTED', 'CONTRADICTED', 'UNSUPPORTED', 'AMBIGUOUS'],
      required: true,
    },
    severity: { type: String, enum: ['CRITICAL', 'MAJOR', 'MINOR'], default: 'MAJOR' },
    confidence: { type: Number, default: 0.85 },
    explanation: { type: String, required: true },
    matchedEvidenceChunks: [
      {
        chunkId: { type: Schema.Types.ObjectId, ref: 'DocumentChunk' },
        documentTitle: { type: String, default: 'Brand Knowledge Base' },
        similarityScore: { type: Number, default: 0 },
        snippet: { type: String, default: '' },
      },
    ],
    matchedFactId: { type: Schema.Types.ObjectId, ref: 'ApprovedFact' },
    matchedRestrictedClaimId: { type: Schema.Types.ObjectId, ref: 'RestrictedClaim' },
    matchedTerminologyRuleId: { type: Schema.Types.ObjectId, ref: 'TerminologyRule' },
    isViolation: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

ClaimFindingSchema.index({ analysisResultId: 1, isViolation: 1 });
ClaimFindingSchema.index({ organisationId: 1, verificationStatus: 1 });

export const ClaimFinding = mongoose.model<IClaimFinding>('ClaimFinding', ClaimFindingSchema);
