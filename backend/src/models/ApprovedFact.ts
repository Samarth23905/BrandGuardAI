import mongoose, { Schema, Document, Types } from 'mongoose';

export type FactCategory = 'PRODUCT' | 'PRICING' | 'INGREDIENT' | 'PERFORMANCE' | 'COMPANY';

export interface IApprovedFact extends Document {
  organisationId: Types.ObjectId;
  category: FactCategory;
  title: string;
  factStatement: string;
  productRef?: string;
  verificationEvidence?: string;
  sourceDocumentRef?: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovedFactSchema = new Schema<IApprovedFact>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    category: {
      type: String,
      enum: ['PRODUCT', 'PRICING', 'INGREDIENT', 'PERFORMANCE', 'COMPANY'],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    factStatement: { type: String, required: true },
    productRef: { type: String, trim: true },
    verificationEvidence: { type: String },
    sourceDocumentRef: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ApprovedFactSchema.index({ organisationId: 1, isActive: 1, category: 1 });

export const ApprovedFact = mongoose.model<IApprovedFact>('ApprovedFact', ApprovedFactSchema);
