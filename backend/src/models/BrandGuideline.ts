import mongoose, { Schema, Document, Types } from 'mongoose';
import { GuidelineCategory, SeverityLevel } from '../types';

export interface IBrandGuideline extends Document {
  organisationId: Types.ObjectId;
  category: GuidelineCategory;
  title: string;
  ruleDescription: string;
  severity: SeverityLevel;
  sourceDocument?: string;
  sourceVersion?: string;
  tags: string[];
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BrandGuidelineSchema = new Schema<IBrandGuideline>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    category: {
      type: String,
      enum: ['TONE', 'STYLE', 'MESSAGING', 'VISUAL', 'ACCESSIBILITY', 'POLICY'],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    ruleDescription: { type: String, required: true },
    severity: { type: String, enum: ['CRITICAL', 'MAJOR', 'MINOR'], default: 'MAJOR' },
    sourceDocument: { type: String },
    sourceVersion: { type: String, default: '1.0' },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

BrandGuidelineSchema.index({ organisationId: 1, category: 1, isActive: 1 });

export const BrandGuideline = mongoose.model<IBrandGuideline>('BrandGuideline', BrandGuidelineSchema);
