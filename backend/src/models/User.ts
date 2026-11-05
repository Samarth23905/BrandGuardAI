import mongoose, { Schema, Document, Types } from 'mongoose';
import { UserRole } from '../types';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  organisationId: Types.ObjectId;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'CREATOR', 'REVIEWER'], required: true, default: 'CREATOR' },
    organisationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    isActive: { type: Boolean, default: true },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

UserSchema.index({ organisationId: 1, role: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
