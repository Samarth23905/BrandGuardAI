import { Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog';
import { UserRole } from '../types';

export class AuditService {
  public static async log(
    organisationId: string | Types.ObjectId,
    actorId: string | Types.ObjectId,
    actorRole: UserRole,
    action: string,
    entityType: string,
    entityId?: string,
    details: Record<string, any> = {},
    ipAddress?: string
  ): Promise<void> {
    try {
      await AuditLog.create({
        organisationId: new Types.ObjectId(organisationId),
        actorId: new Types.ObjectId(actorId),
        actorRole,
        action,
        entityType,
        entityId,
        details,
        ipAddress,
      });
    } catch (err: any) {
      console.error('[AuditService] Failed to record audit log:', err.message);
    }
  }
}
