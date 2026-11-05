import mongoose, { Schema, Document, Types } from 'mongoose';

export type ApprovedClaimCategory = 'MARKETING' | 'PROMOTIONAL' | 'PRODUCT_DESCRIPTION' | 'GENERAL';

export interface IApprovedClaim extends Document {
  organisationId: Types.ObjectId;
  category: ApprovedClaimCategory;
  claimStatement: string;
  permittedContext?: string;
  substantiationDocumentRef?: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovedClaimSchema = new Schema<IApprovedClaim>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    category: {
      type: String,
      enum: ['MARKETING', 'PROMOTIONAL', 'PRODUCT_DESCRIPTION', 'GENERAL'],
      required: true,
      default: 'MARKETING',
    },
    claimStatement: { type: String, required: true },
    permittedContext: { type: String },
    substantiationDocumentRef: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ApprovedClaimSchema.index({ organisationId: 1, isActive: 1 });

export const ApprovedClaim = mongoose.model<IApprovedClaim>('ApprovedClaim', ApprovedClaimSchema);
