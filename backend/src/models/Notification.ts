import mongoose, { Schema, Document, Types } from 'mongoose';

export type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT';

export interface INotification extends Document {
  organisationId: Types.ObjectId;
  recipientId: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  linkUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['INFO', 'WARNING', 'SUCCESS', 'ALERT'], default: 'INFO' },
    linkUrl: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

NotificationSchema.index({ recipientId: 1, isRead: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
