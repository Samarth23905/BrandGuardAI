import { Response } from 'express';
import { Types } from 'mongoose';
import { ContentSubmission } from '../models/ContentSubmission';
import { AnalysisResult } from '../models/AnalysisResult';
import { ClaimFinding } from '../models/ClaimFinding';
import { Review } from '../models/Review';
import { AuthenticatedRequest } from '../types';

export class AnalyticsController {
  public static async getGovernanceMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orgId = new Types.ObjectId(req.organisationId!);
    const { startDate, endDate, creatorId, status } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    const submissionMatch: any = { organisationId: orgId };
    if (Object.keys(dateFilter).length > 0) submissionMatch.createdAt = dateFilter;
    if (creatorId) submissionMatch.creatorId = new Types.ObjectId(creatorId as string);
    if (status) submissionMatch.status = status;

    // 1. Submissions Volume & Status Aggregation
    const statusCounts = await ContentSubmission.aggregate([
      { $match: submissionMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    let totalSubmissions = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let pendingReviews = 0;
    let needsRevision = 0;

    for (const item of statusCounts) {
      totalSubmissions += item.count;
      if (item._id === 'APPROVED') approvedCount = item.count;
      else if (item._id === 'REJECTED') rejectedCount = item.count;
      else if (item._id === 'READY_FOR_REVIEW' || item._id === 'IN_REVIEW') pendingReviews += item.count;
      else if (item._id === 'NEEDS_REVISION') needsRevision += item.count;
    }

    // 2. Average Compliance Score & Score Bands Distribution
    const scoreAgg = await AnalysisResult.aggregate([
      { $match: { organisationId: orgId, ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}) } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$overallScore.finalScore' },
          totalAnalyses: { $sum: 1 },
          strongCount: {
            $sum: { $cond: [{ $eq: ['$overallScore.statusBand', 'STRONG'] }, 1, 0] },
          },
          needsImprovementCount: {
            $sum: { $cond: [{ $eq: ['$overallScore.statusBand', 'NEEDS_IMPROVEMENT'] }, 1, 0] },
          },
          highRiskCount: {
            $sum: { $cond: [{ $eq: ['$overallScore.statusBand', 'HIGH_RISK'] }, 1, 0] },
          },
        },
      },
    ]);

    const avgComplianceScore = scoreAgg.length > 0 ? Math.round(scoreAgg[0].avgScore || 0) : 0;
    const scoreBands = scoreAgg.length > 0
      ? [
          { name: 'Strong (90-100)', count: scoreAgg[0].strongCount, fill: '#10B981' },
          { name: 'Needs Improvement (70-89)', count: scoreAgg[0].needsImprovementCount, fill: '#F59E0B' },
          { name: 'High Risk (0-69)', count: scoreAgg[0].highRiskCount, fill: '#EF4444' },
        ]
      : [];

    // 3. Claims Findings & Verification Breakdown
    const claimsVerificationAgg = await ClaimFinding.aggregate([
      { $match: { organisationId: orgId } },
      {
        $group: {
          _id: '$verificationStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const claimsBreakdown = {
      SUPPORTED: 0,
      CONTRADICTED: 0,
      UNSUPPORTED: 0,
      AMBIGUOUS: 0,
    };
    claimsVerificationAgg.forEach((item) => {
      if (item._id in claimsBreakdown) {
        (claimsBreakdown as any)[item._id] = item.count;
      }
    });

    // 4. Critical vs Major vs Minor Violations Count
    const violationsBySeverity = await ClaimFinding.aggregate([
      { $match: { organisationId: orgId, isViolation: true } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    let criticalViolations = 0;
    let majorViolations = 0;
    let minorViolations = 0;

    violationsBySeverity.forEach((item) => {
      if (item._id === 'CRITICAL') criticalViolations = item.count;
      else if (item._id === 'MAJOR') majorViolations = item.count;
      else if (item._id === 'MINOR') minorViolations = item.count;
    });

    const totalDetectedIssues = criticalViolations + majorViolations + minorViolations;

    // 5. Most Common Unsupported Claims & Frequent Violations
    const topViolations = await ClaimFinding.aggregate([
      { $match: { organisationId: orgId, isViolation: true } },
      {
        $group: {
          _id: '$claimText',
          category: { $first: '$claimCategory' },
          severity: { $first: '$severity' },
          count: { $sum: 1 },
          explanation: { $first: '$explanation' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    // 6. Submissions Trend Over Time (Last 7 days / weekly)
    const trendAgg = await ContentSubmission.aggregate([
      { $match: { organisationId: orgId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } },
          avgScore: { $avg: '$latestScore' },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 14 },
    ]);

    // 7. Average Review Turnaround Time
    const reviewTurnaround = await Review.aggregate([
      { $match: { organisationId: orgId } },
      {
        $lookup: {
          from: 'contentsubmissions',
          localField: 'submissionId',
          foreignField: '_id',
          as: 'sub',
        },
      },
      { $unwind: '$sub' },
      {
        $project: {
          diffHours: {
            $divide: [{ $subtract: ['$completedAt', '$sub.createdAt'] }, 1000 * 60 * 60],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgTurnaroundHours: { $avg: '$diffHours' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const avgTurnaroundHours = reviewTurnaround.length > 0
      ? Number((reviewTurnaround[0].avgTurnaroundHours || 0).toFixed(1))
      : 0;

    res.status(200).json({
      success: true,
      message: 'Governance analytics retrieved successfully.',
      data: {
        summary: {
          totalSubmissions,
          approvedCount,
          rejectedCount,
          pendingReviews,
          needsRevision,
          approvalRate: totalSubmissions > 0 ? Math.round((approvedCount / totalSubmissions) * 100) : 0,
          avgComplianceScore,
          totalDetectedIssues,
          criticalViolations,
          majorViolations,
          minorViolations,
          avgTurnaroundHours,
        },
        scoreBands,
        claimsBreakdown,
        topViolations,
        timelineTrends: trendAgg.map((t) => ({
          date: t._id,
          total: t.total,
          approved: t.approved,
          avgScore: Math.round(t.avgScore || 0),
        })),
      },
    });
  }
}
