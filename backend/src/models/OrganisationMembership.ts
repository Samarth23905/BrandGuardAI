import mongoose, { Schema, Document, Types } from 'mongoose';
import { UserRole } from '../types';

export interface IOrganisationMembership extends Document {
  organisationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: UserRole;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  joinedAt: Date;
}

const OrganisationMembershipSchema = new Schema<IOrganisationMembership>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['ADMIN', 'CREATOR', 'REVIEWER'], required: true },
    status: { type: String, enum: ['ACTIVE', 'INVITED', 'SUSPENDED'], default: 'ACTIVE' },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

OrganisationMembershipSchema.index({ organisationId: 1, userId: 1 }, { unique: true });

export const OrganisationMembership = mongoose.model<IOrganisationMembership>(
  'OrganisationMembership',
  OrganisationMembershipSchema
);
