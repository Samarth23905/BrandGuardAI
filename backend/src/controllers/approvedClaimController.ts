import { Response } from 'express';
import { z } from 'zod';
import { ApprovedClaim } from '../models/ApprovedClaim';
import { AuditService } from '../services/auditService';
import { AuthenticatedRequest } from '../types';

const ApprovedClaimSchemaValidator = z.object({
  category: z.enum(['MARKETING', 'PROMOTIONAL', 'PRODUCT_DESCRIPTION', 'GENERAL']).default('MARKETING'),
  claimStatement: z.string().min(3, 'Claim statement is required'),
  permittedContext: z.string().optional(),
  substantiationDocumentRef: z.string().optional(),
  isActive: z.boolean().default(true),
});

export class ApprovedClaimController {
  public static async listClaims(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { category, isActive } = req.query;
    const filter: any = { organisationId: req.organisationId };
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const claims = await ApprovedClaim.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, message: 'Approved claims retrieved', data: claims });
  }

  public static async createClaim(req: AuthenticatedRequest, res: Response): Promise<void> {
    const validated = ApprovedClaimSchemaValidator.parse(req.body);

    const claim = await ApprovedClaim.create({
      ...validated,
      organisationId: req.organisationId,
      createdBy: req.user!.userId,
    });

    await AuditService.log(
      req.organisationId!,
      req.user!.userId,
      req.user!.role,
      'APPROVED_CLAIM_CREATED',
      'ApprovedClaim',
      claim._id.toString(),
      { statement: claim.claimStatement }
    );

    res.status(201).json({ success: true, message: 'Approved claim created', data: claim });
  }

  public static async updateClaim(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const validated = ApprovedClaimSchemaValidator.partial().parse(req.body);

    const claim = await ApprovedClaim.findOneAndUpdate(
      { _id: id, organisationId: req.organisationId },
      { $set: validated },
      { new: true }
    );

    if (!claim) {
      res.status(404).json({ success: false, message: 'Approved claim not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Approved claim updated', data: claim });
  }

  public static async deleteClaim(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const claim = await ApprovedClaim.findOneAndDelete({ _id: id, organisationId: req.organisationId });

    if (!claim) {
      res.status(404).json({ success: false, message: 'Approved claim not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Approved claim deleted' });
  }
}
