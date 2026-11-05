import { Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { ContentSubmission } from '../models/ContentSubmission';
import { ContentVersion } from '../models/ContentVersion';
import { AnalysisResult } from '../models/AnalysisResult';
import { ClaimFinding } from '../models/ClaimFinding';
import { CorrectionSuggestion } from '../models/CorrectionSuggestion';
import { ReviewComment } from '../models/ReviewComment';
import { AnalysisOrchestrator } from '../services/analysisOrchestrator';
import { AuditService } from '../services/auditService';
import { AuthenticatedRequest } from '../types';

const CreateSubmissionSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  contentType: z.enum([
    'AD_COPY',
    'BLOG_POST',
    'SOCIAL_POST',
    'PRODUCT_DESCRIPTION',
    'PRESS_RELEASE',
    'EMAIL_NEWSLETTER',
    'GENERAL_COPY',
  ]).default('AD_COPY'),
  targetAudience: z.string().optional(),
  channel: z.string().optional(),
  content: z.string().min(10, 'Content must be at least 10 characters'),
});

const SubmitRevisionSchema = z.object({
  content: z.string().min(10, 'Revised content must be at least 10 characters'),
  notes: z.string().optional(),
  correctionsApplied: z.array(
    z.object({
      originalText: z.string(),
      replacementText: z.string(),
      ruleRef: z.string().optional(),
    })
  ).optional(),
});

export class ContentController {
  public static async createSubmission(req: AuthenticatedRequest, res: Response): Promise<void> {
    const validated = CreateSubmissionSchema.parse(req.body);
    const orgId = req.organisationId!;
    const userId = req.user!.userId;

    const wordCount = validated.content.trim().split(/\s+/).filter(Boolean).length;

    // 1. Create Submission container
    const submission = new ContentSubmission({
      organisationId: orgId,
      title: validated.title,
      contentType: validated.contentType,
      targetAudience: validated.targetAudience,
      channel: validated.channel,
      currentVersionNumber: 1,
      status: 'ANALYSING',
      creatorId: userId,
    });
    await submission.save();

    // 2. Create Version 1
    const version = new ContentVersion({
      submissionId: submission._id,
      organisationId: orgId,
      versionNumber: 1,
      rawContent: validated.content,
      wordCount,
      creatorId: userId,
      correctionsApplied: [],
      notes: 'Initial submission',
    });
    await version.save();

    submission.latestVersionId = version._id as Types.ObjectId;
    await submission.save();

    await AuditService.log(
      orgId,
      userId,
      req.user!.role,
      'CONTENT_SUBMITTED',
      'ContentSubmission',
      submission._id.toString(),
      { title: submission.title, contentType: submission.contentType, wordCount }
    );

    // 3. Trigger immediate AI Analysis Pipeline
    const analysisData = await AnalysisOrchestrator.analyzeVersion(
      version._id.toString(),
      userId,
      req.user!.role
    );

    const updatedSubmission = await ContentSubmission.findById(submission._id)
      .populate('creatorId', 'name email')
      .populate('latestVersionId');

    res.status(201).json({
      success: true,
      message: 'Content submitted and analyzed successfully.',
      data: {
        submission: updatedSubmission,
        version,
        analysis: analysisData.analysisResult,
        findings: analysisData.findings,
        suggestions: analysisData.suggestions,
      },
    });
  }

  public static async submitRevision(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const validated = SubmitRevisionSchema.parse(req.body);
    const orgId = req.organisationId!;
    const userId = req.user!.userId;

    const submission = await ContentSubmission.findOne({ _id: id, organisationId: orgId });
    if (!submission) {
      res.status(404).json({ success: false, message: 'Content submission not found.' });
      return;
    }

    const nextVersionNumber = submission.currentVersionNumber + 1;
    const wordCount = validated.content.trim().split(/\s+/).filter(Boolean).length;

    const newVersion = new ContentVersion({
      submissionId: submission._id,
      organisationId: orgId,
      versionNumber: nextVersionNumber,
      rawContent: validated.content,
      wordCount,
      creatorId: userId,
      correctionsApplied: (validated.correctionsApplied || []).map((c) => ({
        ...c,
        appliedAt: new Date(),
      })),
      notes: validated.notes || `Revision V${nextVersionNumber}`,
    });
    await newVersion.save();

    submission.currentVersionNumber = nextVersionNumber;
    submission.latestVersionId = newVersion._id as Types.ObjectId;
    submission.status = 'ANALYSING';
    await submission.save();

    await AuditService.log(
      orgId,
      userId,
      req.user!.role,
      'CONTENT_REVISED',
      'ContentSubmission',
      submission._id.toString(),
      { versionNumber: nextVersionNumber, wordCount, appliedCount: validated.correctionsApplied?.length || 0 }
    );

    // Trigger full revalidation of the complete modified text
    const analysisData = await AnalysisOrchestrator.analyzeVersion(
      newVersion._id.toString(),
      userId,
      req.user!.role
    );

    const updatedSubmission = await ContentSubmission.findById(submission._id)
      .populate('creatorId', 'name email')
      .populate('latestVersionId');

    res.status(200).json({
      success: true,
      message: `Revision V${nextVersionNumber} analyzed and revalidated successfully.`,
      data: {
        submission: updatedSubmission,
        version: newVersion,
        analysis: analysisData.analysisResult,
        findings: analysisData.findings,
        suggestions: analysisData.suggestions,
      },
    });
  }

  public static async listSubmissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { status, creatorId, contentType } = req.query;
    const filter: any = { organisationId: req.organisationId };

    if (status) filter.status = status;
    if (contentType) filter.contentType = contentType;

    // Creators only see their submissions by default unless query overrides or Admin/Reviewer
    if (req.user?.role === 'CREATOR') {
      filter.creatorId = req.user.userId;
    } else if (creatorId) {
      filter.creatorId = creatorId;
    }

    const submissions = await ContentSubmission.find(filter)
      .populate('creatorId', 'name email avatarUrl')
      .populate('assignedReviewerId', 'name email')
      .populate('latestVersionId')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Submissions list retrieved.',
      data: submissions,
    });
  }

  public static async getSubmission(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const submission = await ContentSubmission.findOne({ _id: id, organisationId: req.organisationId })
      .populate('creatorId', 'name email avatarUrl')
      .populate('assignedReviewerId', 'name email')
      .populate('latestVersionId');

    if (!submission) {
      res.status(404).json({ success: false, message: 'Content submission not found.' });
      return;
    }

    const versions = await ContentVersion.find({ submissionId: submission._id }).sort({ versionNumber: 1 });
    const comments = await ReviewComment.find({ submissionId: submission._id })
      .populate('authorId', 'name email role avatarUrl')
      .sort({ createdAt: 1 });

    // Retrieve latest analysis, findings, and suggestions
    let latestAnalysis = null;
    let findings: any[] = [];
    let suggestions: any[] = [];

    if (submission.latestVersionId) {
      latestAnalysis = await AnalysisResult.findOne({ versionId: submission.latestVersionId });
      if (latestAnalysis) {
        findings = await ClaimFinding.find({ analysisResultId: latestAnalysis._id });
        suggestions = await CorrectionSuggestion.find({ analysisResultId: latestAnalysis._id });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Submission details retrieved.',
      data: {
        submission,
        versions,
        latestAnalysis,
        findings,
        suggestions,
        comments,
      },
    });
  }

  public static async compareVersions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { v1, v2 } = req.query;

    const v1Num = parseInt(v1 as string, 10);
    const v2Num = parseInt(v2 as string, 10);

    if (isNaN(v1Num) || isNaN(v2Num)) {
      res.status(400).json({ success: false, message: 'Both v1 and v2 version numbers are required.' });
      return;
    }

    const version1 = await ContentVersion.findOne({
      submissionId: id,
      organisationId: req.organisationId,
      versionNumber: v1Num,
    });
    const version2 = await ContentVersion.findOne({
      submissionId: id,
      organisationId: req.organisationId,
      versionNumber: v2Num,
    });

    if (!version1 || !version2) {
      res.status(404).json({ success: false, message: 'One or both versions not found.' });
      return;
    }

    const analysis1 = await AnalysisResult.findOne({ versionId: version1._id });
    const analysis2 = await AnalysisResult.findOne({ versionId: version2._id });

    const findings1 = analysis1 ? await ClaimFinding.find({ analysisResultId: analysis1._id }) : [];
    const findings2 = analysis2 ? await ClaimFinding.find({ analysisResultId: analysis2._id }) : [];

    const score1 = analysis1?.overallScore.finalScore ?? 0;
    const score2 = analysis2?.overallScore.finalScore ?? 0;
    const scoreDelta = score2 - score1;

    res.status(200).json({
      success: true,
      message: 'Version comparison retrieved.',
      data: {
        v1: { version: version1, analysis: analysis1, findings: findings1 },
        v2: { version: version2, analysis: analysis2, findings: findings2 },
        scoreDelta,
        resolvedIssuesCount: Math.max(0, findings1.filter((f) => f.isViolation).length - findings2.filter((f) => f.isViolation).length),
      },
    });
  }
}
