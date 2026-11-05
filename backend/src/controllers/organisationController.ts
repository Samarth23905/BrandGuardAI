import { Response } from 'express';
import { z } from 'zod';
import { Organisation } from '../models/Organisation';
import { OrganisationMembership } from '../models/OrganisationMembership';
import { AuditService } from '../services/auditService';
import { AuthenticatedRequest } from '../types';

const UpdateSettingsSchema = z.object({
  allowCreatorSelfApproval: z.boolean().optional(),
  minPassingScore: z.number().min(0).max(100).optional(),
  blockCriticalViolations: z.boolean().optional(),
  requireReviewerNotes: z.boolean().optional(),
  scoringWeights: z
    .object({
      critical: z.number().min(1).max(50),
      major: z.number().min(1).max(30),
      minor: z.number().min(1).max(15),
    })
    .optional(),
});

export class OrganisationController {
  public static async getOrganisation(req: AuthenticatedRequest, res: Response): Promise<void> {
    const org = await Organisation.findById(req.organisationId);
    if (!org) {
      res.status(404).json({ success: false, message: 'Organisation not found.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Organisation details', data: org });
  }

  public static async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    const validated = UpdateSettingsSchema.parse(req.body);

    const org = await Organisation.findById(req.organisationId);
    if (!org) {
      res.status(404).json({ success: false, message: 'Organisation not found.' });
      return;
    }

    if (validated.allowCreatorSelfApproval !== undefined) {
      org.settings.allowCreatorSelfApproval = validated.allowCreatorSelfApproval;
    }
    if (validated.minPassingScore !== undefined) {
      org.settings.minPassingScore = validated.minPassingScore;
    }
    if (validated.blockCriticalViolations !== undefined) {
      org.settings.blockCriticalViolations = validated.blockCriticalViolations;
    }
    if (validated.requireReviewerNotes !== undefined) {
      org.settings.requireReviewerNotes = validated.requireReviewerNotes;
    }
    if (validated.scoringWeights) {
      org.settings.scoringWeights = validated.scoringWeights;
    }

    await org.save();

    await AuditService.log(
      org._id.toString(),
      req.user!.userId,
      req.user!.role,
      'ORGANISATION_SETTINGS_UPDATED',
      'Organisation',
      org._id.toString(),
      { newSettings: org.settings }
    );

    res.status(200).json({
      success: true,
      message: 'Organisation governance settings updated successfully.',
      data: org,
    });
  }

  public static async getMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const members = await OrganisationMembership.find({ organisationId: req.organisationId })
      .populate('userId', 'name email role isActive avatarUrl createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Organisation members list',
      data: members,
    });
  }
}
