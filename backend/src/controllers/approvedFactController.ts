import { Response } from 'express';
import { z } from 'zod';
import { ApprovedFact } from '../models/ApprovedFact';
import { AuditService } from '../services/auditService';
import { AuthenticatedRequest } from '../types';

const FactSchema = z.object({
  category: z.enum(['PRODUCT', 'PRICING', 'INGREDIENT', 'PERFORMANCE', 'COMPANY']),
  title: z.string().min(2, 'Title is required'),
  factStatement: z.string().min(3, 'Fact statement is required'),
  productRef: z.string().optional(),
  verificationEvidence: z.string().optional(),
  sourceDocumentRef: z.string().optional(),
  isActive: z.boolean().default(true),
});

export class ApprovedFactController {
  public static async listFacts(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { category, isActive } = req.query;
    const filter: any = { organisationId: req.organisationId };
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const facts = await ApprovedFact.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, message: 'Approved facts retrieved', data: facts });
  }

  public static async createFact(req: AuthenticatedRequest, res: Response): Promise<void> {
    const validated = FactSchema.parse(req.body);

    const fact = await ApprovedFact.create({
      ...validated,
      organisationId: req.organisationId,
      createdBy: req.user!.userId,
    });

    await AuditService.log(
      req.organisationId!,
      req.user!.userId,
      req.user!.role,
      'APPROVED_FACT_CREATED',
      'ApprovedFact',
      fact._id.toString(),
      { title: fact.title, statement: fact.factStatement }
    );

    res.status(201).json({ success: true, message: 'Approved fact created successfully', data: fact });
  }

  public static async updateFact(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const validated = FactSchema.partial().parse(req.body);

    const fact = await ApprovedFact.findOneAndUpdate(
      { _id: id, organisationId: req.organisationId },
      { $set: validated },
      { new: true }
    );

    if (!fact) {
      res.status(404).json({ success: false, message: 'Approved fact not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Approved fact updated', data: fact });
  }

  public static async deleteFact(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const fact = await ApprovedFact.findOneAndDelete({ _id: id, organisationId: req.organisationId });

    if (!fact) {
      res.status(404).json({ success: false, message: 'Approved fact not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Approved fact deleted successfully' });
  }
}
