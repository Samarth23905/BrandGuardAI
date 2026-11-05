import { Response } from 'express';
import { z } from 'zod';
import { CorrectionSuggestion } from '../models/CorrectionSuggestion';
import { ContentVersion } from '../models/ContentVersion';
import { ContentSubmission } from '../models/ContentSubmission';
import { AnalysisOrchestrator } from '../services/analysisOrchestrator';
import { AuditService } from '../services/auditService';
import { AuthenticatedRequest } from '../types';

const UpdateSuggestionSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'MODIFIED']),
  userFeedback: z.string().optional(),
});

const ApplyCorrectionsSchema = z.object({
  versionId: z.string(),
  acceptedSuggestionIds: z.array(z.string()),
});

export class CorrectionController {
  public static async updateSuggestionStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const validated = UpdateSuggestionSchema.parse(req.body);

    const suggestion = await CorrectionSuggestion.findOneAndUpdate(
      { _id: id, organisationId: req.organisationId },
      { $set: validated },
      { new: true }
    );

    if (!suggestion) {
      res.status(404).json({ success: false, message: 'Correction suggestion not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Correction suggestion marked as ${validated.status}.`,
      data: suggestion,
    });
  }

  public static async applyBatchCorrections(req: AuthenticatedRequest, res: Response): Promise<void> {
    const validated = ApplyCorrectionsSchema.parse(req.body);
    const orgId = req.organisationId!;
    const userId = req.user!.userId;

    const currentVersion = await ContentVersion.findOne({
      _id: validated.versionId,
      organisationId: orgId,
    });
    if (!currentVersion) {
      res.status(404).json({ success: false, message: 'Source version not found.' });
      return;
    }

    const submission = await ContentSubmission.findOne({
      _id: currentVersion.submissionId,
      organisationId: orgId,
    });
    if (!submission) {
      res.status(404).json({ success: false, message: 'Content submission not found.' });
      return;
    }

    const suggestions = await CorrectionSuggestion.find({
      _id: { $in: validated.acceptedSuggestionIds },
      organisationId: orgId,
    });

    let updatedText = currentVersion.rawContent;
    const correctionsApplied = [];

    for (const sugg of suggestions) {
      if (sugg.originalText && sugg.suggestedReplacement) {
        if (updatedText.includes(sugg.originalText)) {
          updatedText = updatedText.replace(sugg.originalText, sugg.suggestedReplacement);
          correctionsApplied.push({
            originalText: sugg.originalText,
            replacementText: sugg.suggestedReplacement,
            ruleRef: sugg.relevantGuidelineRef,
            appliedAt: new Date(),
          });
          sugg.status = 'ACCEPTED';
          await sugg.save();
        }
      }
    }

    // Create next version
    const nextVersionNum = submission.currentVersionNumber + 1;
    const newVersion = new ContentVersion({
      submissionId: submission._id,
      organisationId: orgId,
      versionNumber: nextVersionNum,
      rawContent: updatedText,
      wordCount: updatedText.trim().split(/\s+/).filter(Boolean).length,
      creatorId: userId,
      correctionsApplied,
      notes: `Applied ${correctionsApplied.length} AI suggestions automatically.`,
    });
    await newVersion.save();

    submission.currentVersionNumber = nextVersionNum;
    submission.latestVersionId = newVersion._id as any;
    submission.status = 'ANALYSING';
    await submission.save();

    await AuditService.log(
      orgId,
      userId,
      req.user!.role,
      'CORRECTIONS_APPLIED',
      'ContentVersion',
      newVersion._id.toString(),
      { count: correctionsApplied.length, newVersionNumber: nextVersionNum }
    );

    // Full revalidation of complete revised text
    const revalidation = await AnalysisOrchestrator.analyzeVersion(
      newVersion._id.toString(),
      userId,
      req.user!.role
    );

    res.status(200).json({
      success: true,
      message: `Corrections applied. Created Version ${nextVersionNum} with revalidation complete.`,
      data: {
        newVersion,
        analysis: revalidation.analysisResult,
        findings: revalidation.findings,
        suggestions: revalidation.suggestions,
      },
    });
  }
}
