import { Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { ContentSubmission } from '../models/ContentSubmission';
import { ContentVersion } from '../models/ContentVersion';
import { Review } from '../models/Review';
import { ReviewComment } from '../models/ReviewComment';
import { Organisation } from '../models/Organisation';
import { NotificationService } from '../services/notificationService';
import { AuditService } from '../services/auditService';
import { AuthenticatedRequest } from '../types';

const ReviewDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'CHANGES_REQUESTED', 'REJECTED']),
  decisionSummary: z.string().min(5, 'Decision summary note is required'),
  notes: z.string().optional(),
});

const AddCommentSchema = z.object({
  text: z.string().min(1, 'Comment text cannot be empty'),
  anchorText: z.string().optional(),
});

export class ReviewController {
  public static async getReviewQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
    const queue = await ContentSubmission.find({
      organisationId: req.organisationId,
      status: { $in: ['READY_FOR_REVIEW', 'IN_REVIEW', 'NEEDS_REVISION', 'SUBMITTED'] },
    })
      .populate('creatorId', 'name email avatarUrl')
      .populate('latestVersionId')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Review queue retrieved.',
      data: queue,
    });
  }

  public static async submitDecision(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { submissionId } = req.params;
    const validated = ReviewDecisionSchema.parse(req.body);
    const orgId = req.organisationId!;
    const reviewerId = req.user!.userId;

    const submission = await ContentSubmission.findOne({ _id: submissionId, organisationId: orgId });
    if (!submission) {
      res.status(404).json({ success: false, message: 'Submission not found.' });
      return;
    }

    // Security check: Creators cannot approve their own submissions unless org policy explicitly allows
    const org = await Organisation.findById(orgId);
    const allowSelfApproval = org?.settings?.allowCreatorSelfApproval ?? false;

    if (submission.creatorId.toString() === reviewerId && !allowSelfApproval && validated.decision === 'APPROVED') {
      res.status(403).json({
        success: false,
        message: 'Compliance Policy Violation: Creators cannot approve their own submissions.',
      });
      return;
    }

    // Check critical violations block if approved
    if (validated.decision === 'APPROVED' && org?.settings?.blockCriticalViolations) {
      if ((submission.criticalViolationsCount ?? 0) > 0) {
        res.status(400).json({
          success: false,
          message: 'Approval blocked: This submission contains unresolved critical compliance violations.',
        });
        return;
      }
    }

    // Map decision to submission status
    let newStatus: any = 'APPROVED';
    if (validated.decision === 'CHANGES_REQUESTED') newStatus = 'NEEDS_REVISION';
    else if (validated.decision === 'REJECTED') newStatus = 'REJECTED';

    submission.status = newStatus;
    submission.assignedReviewerId = new Types.ObjectId(reviewerId);
    submission.finalDecision = {
      decidedBy: new Types.ObjectId(reviewerId),
      decidedAt: new Date(),
      status: validated.decision,
      comment: validated.decisionSummary,
    };
    await submission.save();

    // Create formal Review audit record
    const reviewRecord = await Review.create({
      submissionId: submission._id,
      versionId: submission.latestVersionId,
      organisationId: orgId,
      reviewerId,
      decision: validated.decision,
      decisionSummary: validated.decisionSummary,
      notes: validated.notes,
      completedAt: new Date(),
    });

    await AuditService.log(
      orgId,
      reviewerId,
      req.user!.role,
      `SUBMISSION_${validated.decision}`,
      'ContentSubmission',
      submission._id.toString(),
      { decision: validated.decision, summary: validated.decisionSummary }
    );

    // Notify creator
    await NotificationService.notify(
      orgId,
      submission.creatorId.toString(),
      `Review Decision: ${validated.decision}`,
      `Your submission "${submission.title}" was ${validated.decision.toLowerCase().replace('_', ' ')} by the reviewer: "${validated.decisionSummary}"`,
      validated.decision === 'APPROVED' ? 'SUCCESS' : 'WARNING',
      `/submissions/${submission._id}`
    );

    res.status(200).json({
      success: true,
      message: `Review decision "${validated.decision}" recorded successfully.`,
      data: {
        submission,
        review: reviewRecord,
      },
    });
  }

  public static async addComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { submissionId } = req.params;
    const validated = AddCommentSchema.parse(req.body);

    const submission = await ContentSubmission.findOne({ _id: submissionId, organisationId: req.organisationId });
    if (!submission) {
      res.status(404).json({ success: false, message: 'Submission not found.' });
      return;
    }

    const comment = await ReviewComment.create({
      submissionId: submission._id,
      versionId: submission.latestVersionId,
      organisationId: req.organisationId,
      authorId: req.user!.userId,
      text: validated.text,
      anchorText: validated.anchorText,
      isResolved: false,
    });

    const populatedComment = await ReviewComment.findById(comment._id).populate('authorId', 'name email role avatarUrl');

    res.status(201).json({
      success: true,
      message: 'Comment added.',
      data: populatedComment,
    });
  }

  public static async listReviews(req: AuthenticatedRequest, res: Response): Promise<void> {
    const reviews = await Review.find({ organisationId: req.organisationId })
      .populate('submissionId', 'title contentType currentVersionNumber')
      .populate('reviewerId', 'name email avatarUrl')
      .sort({ completedAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Reviews history retrieved.',
      data: reviews,
    });
  }
}
