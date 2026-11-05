import { Response } from 'express';
import { z } from 'zod';
import { BrandGuideline } from '../models/BrandGuideline';
import { AuditService } from '../services/auditService';
import { AuthenticatedRequest } from '../types';

const GuidelineSchema = z.object({
  category: z.enum(['TONE', 'STYLE', 'MESSAGING', 'VISUAL', 'ACCESSIBILITY', 'POLICY']),
  title: z.string().min(2, 'Title is required'),
  ruleDescription: z.string().min(5, 'Rule description is required'),
  severity: z.enum(['CRITICAL', 'MAJOR', 'MINOR']).default('MAJOR'),
  sourceDocument: z.string().optional(),
  sourceVersion: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export class BrandGuidelineController {
  public static async listGuidelines(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { category, isActive } = req.query;
    const filter: any = { organisationId: req.organisationId };

    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const guidelines = await BrandGuideline.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Brand guidelines retrieved.',
      data: guidelines,
    });
  }

  public static async createGuideline(req: AuthenticatedRequest, res: Response): Promise<void> {
    const validated = GuidelineSchema.parse(req.body);

    const guideline = await BrandGuideline.create({
      ...validated,
      organisationId: req.organisationId,
      createdBy: req.user!.userId,
    });

    await AuditService.log(
      req.organisationId!,
      req.user!.userId,
      req.user!.role,
      'BRAND_GUIDELINE_CREATED',
      'BrandGuideline',
      guideline._id.toString(),
      { title: guideline.title, category: guideline.category, severity: guideline.severity }
    );

    res.status(201).json({
      success: true,
      message: 'Brand guideline created successfully.',
      data: guideline,
    });
  }

  public static async updateGuideline(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const validated = GuidelineSchema.partial().parse(req.body);

    const guideline = await BrandGuideline.findOneAndUpdate(
      { _id: id, organisationId: req.organisationId },
      { $set: validated },
      { new: true }
    );

    if (!guideline) {
      res.status(404).json({ success: false, message: 'Brand guideline not found.' });
      return;
    }

    await AuditService.log(
      req.organisationId!,
      req.user!.userId,
      req.user!.role,
      'BRAND_GUIDELINE_UPDATED',
      'BrandGuideline',
      guideline._id.toString(),
      { title: guideline.title }
    );

    res.status(200).json({
      success: true,
      message: 'Brand guideline updated successfully.',
      data: guideline,
    });
  }

  public static async deleteGuideline(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const guideline = await BrandGuideline.findOneAndDelete({ _id: id, organisationId: req.organisationId });
    if (!guideline) {
      res.status(404).json({ success: false, message: 'Brand guideline not found.' });
      return;
    }

    await AuditService.log(
      req.organisationId!,
      req.user!.userId,
      req.user!.role,
      'BRAND_GUIDELINE_DELETED',
      'BrandGuideline',
      guideline._id.toString(),
      { title: guideline.title }
    );

    res.status(200).json({
      success: true,
      message: 'Brand guideline deleted successfully.',
    });
  }
}
