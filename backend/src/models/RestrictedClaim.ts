import mongoose, { Schema, Document, Types } from 'mongoose';
import { SeverityLevel } from '../types';

export type RestrictedClaimCategory =
  | 'PROHIBITED_GUARANTEE'
  | 'UNSUPPORTED_HEALTH'
  | 'MISLEADING_PERFORMANCE'
  | 'UNVERIFIED_COMPARISON'
  | 'RESTRICTED_PROMOTIONAL'
  | 'GENERAL_COMPLIANCE';

export interface IRestrictedClaim extends Document {
  organisationId: Types.ObjectId;
  category: RestrictedClaimCategory;
  restrictedPattern: string; // The phrase or regex pattern that triggers this restriction
  reason: string;
  riskSeverity: SeverityLevel;
  suggestedAlternative?: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RestrictedClaimSchema = new Schema<IRestrictedClaim>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    category: {
      type: String,
      enum: [
        'PROHIBITED_GUARANTEE',
        'UNSUPPORTED_HEALTH',
        'MISLEADING_PERFORMANCE',
        'UNVERIFIED_COMPARISON',
        'RESTRICTED_PROMOTIONAL',
        'GENERAL_COMPLIANCE',
      ],
      required: true,
      index: true,
    },
    restrictedPattern: { type: String, required: true },
    reason: { type: String, required: true },
    riskSeverity: { type: String, enum: ['CRITICAL', 'MAJOR', 'MINOR'], default: 'CRITICAL' },
    suggestedAlternative: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

RestrictedClaimSchema.index({ organisationId: 1, isActive: 1 });

export const RestrictedClaim = mongoose.model<IRestrictedClaim>('RestrictedClaim', RestrictedClaimSchema);
