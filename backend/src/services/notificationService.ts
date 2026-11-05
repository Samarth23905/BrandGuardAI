import { Types } from 'mongoose';
import { Notification, NotificationType } from '../models/Notification';

export class NotificationService {
  public static async notify(
    organisationId: string | Types.ObjectId,
    recipientId: string | Types.ObjectId,
    title: string,
    message: string,
    type: NotificationType = 'INFO',
    linkUrl?: string
  ): Promise<void> {
    try {
      await Notification.create({
        organisationId: new Types.ObjectId(organisationId),
        recipientId: new Types.ObjectId(recipientId),
        title,
        message,
        type,
        linkUrl,
        isRead: false,
      });
    } catch (err: any) {
      console.error('[NotificationService] Failed to create notification:', err.message);
    }
  }
}
