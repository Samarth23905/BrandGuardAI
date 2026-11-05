import mongoose, { Schema, Document, Types } from 'mongoose';
import { SeverityLevel } from '../types';

export type TermType = 'RESTRICTED' | 'APPROVED' | 'PREFERRED_ALTERNATIVE' | 'PRODUCT_NAMING';

export interface ITerminologyRule extends Document {
  organisationId: Types.ObjectId;
  termType: TermType;
  term: string;
  replacementOrAlternative?: string;
  ruleContext?: string;
  caseSensitive: boolean;
  severity: SeverityLevel;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TerminologyRuleSchema = new Schema<ITerminologyRule>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    termType: {
      type: String,
      enum: ['RESTRICTED', 'APPROVED', 'PREFERRED_ALTERNATIVE', 'PRODUCT_NAMING'],
      required: true,
      index: true,
    },
    term: { type: String, required: true, trim: true },
    replacementOrAlternative: { type: String, trim: true },
    ruleContext: { type: String },
    caseSensitive: { type: Boolean, default: false },
    severity: { type: String, enum: ['CRITICAL', 'MAJOR', 'MINOR'], default: 'MINOR' },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

TerminologyRuleSchema.index({ organisationId: 1, isActive: 1 });

export const TerminologyRule = mongoose.model<ITerminologyRule>('TerminologyRule', TerminologyRuleSchema);
