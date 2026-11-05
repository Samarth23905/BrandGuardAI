import { Response } from 'express';
import { z } from 'zod';
import { TerminologyRule } from '../models/TerminologyRule';
import { AuditService } from '../services/auditService';
import { AuthenticatedRequest } from '../types';

const TerminologySchema = z.object({
  termType: z.enum(['RESTRICTED', 'APPROVED', 'PREFERRED_ALTERNATIVE', 'PRODUCT_NAMING']),
  term: z.string().min(1, 'Term is required'),
  replacementOrAlternative: z.string().optional(),
  ruleContext: z.string().optional(),
  caseSensitive: z.boolean().default(false),
  severity: z.enum(['CRITICAL', 'MAJOR', 'MINOR']).default('MINOR'),
  isActive: z.boolean().default(true),
});

export class TerminologyController {
  public static async listRules(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { termType, isActive } = req.query;
    const filter: any = { organisationId: req.organisationId };
    if (termType) filter.termType = termType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const rules = await TerminologyRule.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, message: 'Terminology rules retrieved', data: rules });
  }

  public static async createRule(req: AuthenticatedRequest, res: Response): Promise<void> {
    const validated = TerminologySchema.parse(req.body);

    const rule = await TerminologyRule.create({
      ...validated,
      organisationId: req.organisationId,
      createdBy: req.user!.userId,
    });

    await AuditService.log(
      req.organisationId!,
      req.user!.userId,
      req.user!.role,
      'TERMINOLOGY_RULE_CREATED',
      'TerminologyRule',
      rule._id.toString(),
      { term: rule.term, type: rule.termType }
    );

    res.status(201).json({ success: true, message: 'Terminology rule created', data: rule });
  }

  public static async updateRule(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const validated = TerminologySchema.partial().parse(req.body);

    const rule = await TerminologyRule.findOneAndUpdate(
      { _id: id, organisationId: req.organisationId },
      { $set: validated },
      { new: true }
    );

    if (!rule) {
      res.status(404).json({ success: false, message: 'Terminology rule not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Terminology rule updated', data: rule });
  }

  public static async deleteRule(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const rule = await TerminologyRule.findOneAndDelete({ _id: id, organisationId: req.organisationId });

    if (!rule) {
      res.status(404).json({ success: false, message: 'Terminology rule not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Terminology rule deleted' });
  }
}
