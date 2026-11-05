import request from 'supertest';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { ScoringEngine } from '../ai/scoringEngine';
import { User } from '../models/User';
import { Organisation } from '../models/Organisation';
import { ContentSubmission } from '../models/ContentSubmission';
import { ContentVersion } from '../models/ContentVersion';
import { AuditLog } from '../models/AuditLog';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const app = createApp();

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('Scoring Engine and Human Review Workflow Test Suite', () => {
  let fitFuelOrg: any;
  let creatorUser: any;
  let reviewerUser: any;
  let creatorToken = '';
  let reviewerToken = '';

  beforeAll(async () => {
    fitFuelOrg = await Organisation.findOne({ slug: 'fitfuel-nutrition' });
    creatorUser = await User.findOne({ email: 'creator@fitfuel.com' });
    reviewerUser = await User.findOne({ email: 'reviewer@fitfuel.com' });

    creatorToken = jwt.sign(
      { userId: creatorUser._id.toString(), email: creatorUser.email, role: 'CREATOR', organisationId: fitFuelOrg._id.toString() },
      env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    reviewerToken = jwt.sign(
      { userId: reviewerUser._id.toString(), email: reviewerUser.email, role: 'REVIEWER', organisationId: fitFuelOrg._id.toString() },
      env.JWT_SECRET,
      { expiresIn: '1d' }
    );
  });

  it('Step 1: Scoring engine applies exact deterministic deduction penalties', () => {
    const mockClaims: any[] = [
      {
        claimText: 'Contradicted 40g claim',
        claimCategory: 'PRODUCT',
        verificationStatus: 'CONTRADICTED',
        severity: 'CRITICAL',
        isViolation: true,
        explanation: 'Contradicts official 25g spec',
      },
      {
        claimText: 'Unsubstantiated claim',
        claimCategory: 'SUPERIORITY',
        verificationStatus: 'UNSUPPORTED',
        severity: 'MAJOR',
        isViolation: true,
        explanation: 'Unsupported superlative',
      },
    ];

    const mockTerminology: any[] = [
      {
        term: 'Fitfuel',
        termType: 'PRODUCT_NAMING',
        severity: 'MINOR',
        reason: 'Incorrect capitalization',
      },
    ];

    const mockTone: any = { isCompliant: true, explanation: 'Tone matches' };
    const mockAccessibility: any = { readingEaseScore: 80, readingGradeLevel: 'Easy', issues: [] };

    const scoreResult = ScoringEngine.calculateComplianceScore(
      mockClaims,
      mockTerminology,
      mockTone,
      mockAccessibility
    );

    // Initial 100 - (Critical 25 + Major 10 + Minor 3) = 62
    expect(scoreResult.initialScore).toBe(100);
    expect(scoreResult.totalDeductions).toBe(38);
    expect(scoreResult.finalScore).toBe(62);
    expect(scoreResult.statusBand).toBe('HIGH_RISK');
    expect(scoreResult.criticalViolationsCount).toBe(1);
  });

  it('Step 2: Creator CANNOT approve their own submission (Blocked Self-Approval)', async () => {
    const sub = await ContentSubmission.create({
      organisationId: fitFuelOrg._id,
      title: 'Creator Self Approval Test',
      contentType: 'AD_COPY',
      creatorId: creatorUser._id,
      status: 'READY_FOR_REVIEW',
    });

    // 2a. Direct Creator role is blocked by RBAC
    const resCreator = await request(app)
      .post(`/api/v1/reviews/submission/${sub._id}/decision`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        decision: 'APPROVED',
        decisionSummary: 'I approve my own copy.',
      });

    expect(resCreator.status).toBe(403);

    // 2b. Admin who created the submission is blocked by self-approval compliance policy
    const adminUser = await User.findOne({ email: 'admin@fitfuel.com' });
    const adminToken = jwt.sign(
      { userId: adminUser!._id.toString(), email: adminUser!.email, role: 'ADMIN', organisationId: fitFuelOrg._id.toString() },
      env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const adminSub = await ContentSubmission.create({
      organisationId: fitFuelOrg._id,
      title: 'Admin Self-Submission',
      contentType: 'AD_COPY',
      creatorId: adminUser!._id,
      status: 'READY_FOR_REVIEW',
    });

    const resAdminSelf = await request(app)
      .post(`/api/v1/reviews/submission/${adminSub._id}/decision`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'APPROVED',
        decisionSummary: 'Admin attempting self approval.',
      });

    expect(resAdminSelf.status).toBe(403);
    expect(resAdminSelf.body.message).toContain('Creators cannot approve their own submissions');
  });

  it('Step 3: Authorized Reviewer can examine and formally approve compliant content', async () => {
    const sub = await ContentSubmission.create({
      organisationId: fitFuelOrg._id,
      title: 'Compliant Submission For Marcus',
      contentType: 'AD_COPY',
      creatorId: creatorUser._id,
      criticalViolationsCount: 0,
      latestScore: 95,
      status: 'READY_FOR_REVIEW',
    });

    const res = await request(app)
      .post(`/api/v1/reviews/submission/${sub._id}/decision`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({
        decision: 'APPROVED',
        decisionSummary: 'Content verified against 2026 brand guidelines and lab specifications.',
        notes: 'Ready for scheduled social media distribution.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.submission.status).toBe('APPROVED');
    expect(res.body.data.review.decision).toBe('APPROVED');

    // Verify Audit Log entry exists
    const audit = await AuditLog.findOne({
      entityId: sub._id.toString(),
      action: 'SUBMISSION_APPROVED',
    });
    expect(audit).toBeDefined();
    expect(audit?.actorRole).toBe('REVIEWER');
  });

  it('Step 4: Reviewer can request changes or reject with explanatory notes', async () => {
    const sub = await ContentSubmission.create({
      organisationId: fitFuelOrg._id,
      title: 'Submission Requiring Tweaks',
      contentType: 'SOCIAL_POST',
      creatorId: creatorUser._id,
      criticalViolationsCount: 1,
      latestScore: 65,
      status: 'NEEDS_REVISION',
    });

    const res = await request(app)
      .post(`/api/v1/reviews/submission/${sub._id}/decision`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({
        decision: 'CHANGES_REQUESTED',
        decisionSummary: 'Please adjust protein specification from 40g to 25g and remove 100% guarantee.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.submission.status).toBe('NEEDS_REVISION');
  });
});
