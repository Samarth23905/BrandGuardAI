import { Response } from 'express';
import { z } from 'zod';
import { RestrictedClaim } from '../models/RestrictedClaim';
import { AuditService } from '../services/auditService';
import { AuthenticatedRequest } from '../types';

const RestrictedClaimValidator = z.object({
  category: z.enum([
    'PROHIBITED_GUARANTEE',
    'UNSUPPORTED_HEALTH',
    'MISLEADING_PERFORMANCE',
    'UNVERIFIED_COMPARISON',
    'RESTRICTED_PROMOTIONAL',
    'GENERAL_COMPLIANCE',
  ]),
  restrictedPattern: z.string().min(2, 'Pattern is required'),
  reason: z.string().min(5, 'Reason is required'),
  riskSeverity: z.enum(['CRITICAL', 'MAJOR', 'MINOR']).default('CRITICAL'),
  suggestedAlternative: z.string().optional(),
  isActive: z.boolean().default(true),
});

export class RestrictedClaimController {
  public static async listRestricted(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { category, isActive } = req.query;
    const filter: any = { organisationId: req.organisationId };
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const list = await RestrictedClaim.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, message: 'Restricted claims retrieved', data: list });
  }

  public static async createRestricted(req: AuthenticatedRequest, res: Response): Promise<void> {
    const validated = RestrictedClaimValidator.parse(req.body);

    const item = await RestrictedClaim.create({
      ...validated,
      organisationId: req.organisationId,
      createdBy: req.user!.userId,
    });

    await AuditService.log(
      req.organisationId!,
      req.user!.userId,
      req.user!.role,
      'RESTRICTED_CLAIM_CREATED',
      'RestrictedClaim',
      item._id.toString(),
      { pattern: item.restrictedPattern, severity: item.riskSeverity }
    );

    res.status(201).json({ success: true, message: 'Restricted claim policy created', data: item });
  }

  public static async updateRestricted(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const validated = RestrictedClaimValidator.partial().parse(req.body);

    const item = await RestrictedClaim.findOneAndUpdate(
      { _id: id, organisationId: req.organisationId },
      { $set: validated },
      { new: true }
    );

    if (!item) {
      res.status(404).json({ success: false, message: 'Restricted claim not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Restricted claim updated', data: item });
  }

  public static async deleteRestricted(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const item = await RestrictedClaim.findOneAndDelete({ _id: id, organisationId: req.organisationId });

    if (!item) {
      res.status(404).json({ success: false, message: 'Restricted claim not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Restricted claim deleted' });
  }
}
