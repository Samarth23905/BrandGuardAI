import { Response } from 'express';
import { Notification } from '../models/Notification';
import { AuthenticatedRequest } from '../types';

export class NotificationController {
  public static async listNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    const notifications = await Notification.find({
      recipientId: req.user!.userId,
      organisationId: req.organisationId,
    }).sort({ createdAt: -1 }).limit(25);

    const unreadCount = await Notification.countDocuments({
      recipientId: req.user!.userId,
      organisationId: req.organisationId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved.',
      data: {
        notifications,
        unreadCount,
      },
    });
  }

  public static async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    if (id === 'all') {
      await Notification.updateMany(
        { recipientId: req.user!.userId, organisationId: req.organisationId, isRead: false },
        { $set: { isRead: true } }
      );
    } else {
      await Notification.updateOne(
        { _id: id, recipientId: req.user!.userId },
        { $set: { isRead: true } }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Notifications updated.',
    });
  }
}
