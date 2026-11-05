import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganisationSettings {
  allowCreatorSelfApproval: boolean;
  minPassingScore: number;
  blockCriticalViolations: boolean;
  requireReviewerNotes: boolean;
  scoringWeights: {
    critical: number;
    major: number;
    minor: number;
  };
}

export interface IOrganisation extends Document {
  name: string;
  slug: string;
  industry: string;
  website?: string;
  description?: string;
  settings: IOrganisationSettings;
  createdAt: Date;
  updatedAt: Date;
}

const OrganisationSchema = new Schema<IOrganisation>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    industry: { type: String, default: 'General' },
    website: { type: String },
    description: { type: String },
    settings: {
      allowCreatorSelfApproval: { type: Boolean, default: false },
      minPassingScore: { type: Number, default: 70 },
      blockCriticalViolations: { type: Boolean, default: true },
      requireReviewerNotes: { type: Boolean, default: true },
      scoringWeights: {
        critical: { type: Number, default: 25 },
        major: { type: Number, default: 10 },
        minor: { type: Number, default: 3 },
      },
    },
  },
  { timestamps: true }
);

export const Organisation = mongoose.model<IOrganisation>('Organisation', OrganisationSchema);
