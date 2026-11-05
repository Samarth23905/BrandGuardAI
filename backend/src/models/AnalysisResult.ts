import mongoose, { Schema, Document, Types } from 'mongoose';
import { SeverityLevel } from '../types';

export interface IDeductionItem {
  findingId?: Types.ObjectId;
  ruleId?: string;
  category: string;
  severity: SeverityLevel;
  deductionPoints: number;
  reason: string;
}

export interface IAnalysisResult extends Document {
  submissionId: Types.ObjectId;
  versionId: Types.ObjectId;
  organisationId: Types.ObjectId;
  overallScore: {
    initialScore: number;
    finalScore: number;
    statusBand: 'STRONG' | 'NEEDS_IMPROVEMENT' | 'HIGH_RISK';
    totalDeductions: number;
  };
  deductionsBreakdown: IDeductionItem[];
  claimsSummary: {
    totalClaims: number;
    supported: number;
    contradicted: number;
    unsupported: number;
    ambiguous: number;
  };
  toneEvaluation: {
    detectedTone: string;
    expectedTone: string;
    isCompliant: boolean;
    explanation: string;
  };
  terminologyEvaluation: {
    issuesFound: number;
    restrictedTermsCount: number;
  };
  messagingEvaluation: {
    isCompliant: boolean;
    explanation: string;
  };
  accessibilityEvaluation: {
    readingEaseScore: number;
    readingGradeLevel: string;
    issues: string[];
  };
  status: 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  processingTimeMs: number;
  aiModelUsed: string;
  createdAt: Date;
}

const AnalysisResultSchema = new Schema<IAnalysisResult>(
  {
    submissionId: { type: Schema.Types.ObjectId, ref: 'ContentSubmission', required: true, index: true },
    versionId: { type: Schema.Types.ObjectId, ref: 'ContentVersion', required: true, index: true },
    organisationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    overallScore: {
      initialScore: { type: Number, default: 100 },
      finalScore: { type: Number, required: true },
      statusBand: { type: String, enum: ['STRONG', 'NEEDS_IMPROVEMENT', 'HIGH_RISK'], required: true },
      totalDeductions: { type: Number, default: 0 },
    },
    deductionsBreakdown: [
      {
        findingId: { type: Schema.Types.ObjectId },
        ruleId: { type: String },
        category: { type: String, required: true },
        severity: { type: String, enum: ['CRITICAL', 'MAJOR', 'MINOR'], required: true },
        deductionPoints: { type: Number, required: true },
        reason: { type: String, required: true },
      },
    ],
    claimsSummary: {
      totalClaims: { type: Number, default: 0 },
      supported: { type: Number, default: 0 },
      contradicted: { type: Number, default: 0 },
      unsupported: { type: Number, default: 0 },
      ambiguous: { type: Number, default: 0 },
    },
    toneEvaluation: {
      detectedTone: { type: String, default: 'Neutral' },
      expectedTone: { type: String, default: 'Professional' },
      isCompliant: { type: Boolean, default: true },
      explanation: { type: String, default: '' },
    },
    terminologyEvaluation: {
      issuesFound: { type: Number, default: 0 },
      restrictedTermsCount: { type: Number, default: 0 },
    },
    messagingEvaluation: {
      isCompliant: { type: Boolean, default: true },
      explanation: { type: String, default: '' },
    },
    accessibilityEvaluation: {
      readingEaseScore: { type: Number, default: 75 },
      readingGradeLevel: { type: String, default: 'Standard' },
      issues: [{ type: String }],
    },
    status: { type: String, enum: ['COMPLETED', 'FAILED'], default: 'COMPLETED' },
    errorMessage: { type: String },
    processingTimeMs: { type: Number, default: 0 },
    aiModelUsed: { type: String, default: 'gemini-2.5-flash' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AnalysisResultSchema.index({ submissionId: 1, versionId: 1 });
AnalysisResultSchema.index({ organisationId: 1, createdAt: -1 });

export const AnalysisResult = mongoose.model<IAnalysisResult>('AnalysisResult', AnalysisResultSchema);
