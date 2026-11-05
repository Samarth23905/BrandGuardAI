import mongoose, { Schema, Document, Types } from 'mongoose';
import { UserRole } from '../types';

export interface IAuditLog extends Document {
  organisationId: Types.ObjectId;
  actorId: Types.ObjectId;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorRole: { type: String, enum: ['ADMIN', 'CREATOR', 'REVIEWER'], required: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: String },
    details: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

AuditLogSchema.index({ organisationId: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
