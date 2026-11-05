import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { Organisation } from '../models/Organisation';
import { User } from '../models/User';
import { ContentSubmission } from '../models/ContentSubmission';
import { ContentVersion } from '../models/ContentVersion';
import { AnalysisOrchestrator } from '../services/analysisOrchestrator';
import { ClaimFinding } from '../models/ClaimFinding';

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('AI & RAG Compliance Pipeline Test Cases (Section 18 Verification)', () => {
  let fitFuelOrg: any;
  let creatorUser: any;

  beforeAll(async () => {
    fitFuelOrg = await Organisation.findOne({ slug: 'fitfuel-nutrition' });
    creatorUser = await User.findOne({ email: 'creator@fitfuel.com' });
    expect(fitFuelOrg).toBeDefined();
    expect(creatorUser).toBeDefined();
  });

  // TEST 1: Content: "Our product contains 25g protein per serving." -> Expected: SUPPORTED.
  it('TEST 1: Correct 25g protein specification claim is verified as SUPPORTED', async () => {
    const text = 'Our product contains 25g protein per serving.';
    const sub = await ContentSubmission.create({
      organisationId: fitFuelOrg._id,
      title: 'Test 1 - 25g Protein',
      contentType: 'AD_COPY',
      creatorId: creatorUser._id,
    });
    const ver = await ContentVersion.create({
      submissionId: sub._id,
      organisationId: fitFuelOrg._id,
      versionNumber: 1,
      rawContent: text,
      wordCount: text.split(' ').length,
      creatorId: creatorUser._id,
    });
    sub.latestVersionId = ver._id as any;
    await sub.save();

    const result = await AnalysisOrchestrator.analyzeVersion(ver._id.toString(), creatorUser._id.toString(), 'CREATOR');
    const proteinFinding = result.findings.find((f) => f.claimText.includes('25g') || f.explanation.includes('25g'));

    expect(proteinFinding).toBeDefined();
    expect(proteinFinding.verificationStatus).toBe('SUPPORTED');
    expect(proteinFinding.isViolation).toBe(false);
  });

  // TEST 2: Content: "Our product contains 40g protein per serving." -> Expected: CONTRADICTED.
  it('TEST 2: Erroneous 40g protein specification claim is verified as CONTRADICTED', async () => {
    const text = 'Our product contains 40g protein per serving.';
    const sub = await ContentSubmission.create({
      organisationId: fitFuelOrg._id,
      title: 'Test 2 - 40g Protein',
      contentType: 'AD_COPY',
      creatorId: creatorUser._id,
    });
    const ver = await ContentVersion.create({
      submissionId: sub._id,
      organisationId: fitFuelOrg._id,
      versionNumber: 1,
      rawContent: text,
      wordCount: text.split(' ').length,
      creatorId: creatorUser._id,
    });
    sub.latestVersionId = ver._id as any;
    await sub.save();

    const result = await AnalysisOrchestrator.analyzeVersion(ver._id.toString(), creatorUser._id.toString(), 'CREATOR');
    const proteinFinding = result.findings.find((f) => f.claimText.includes('40g') || f.explanation.includes('40g'));

    expect(proteinFinding).toBeDefined();
    expect(proteinFinding.verificationStatus).toBe('CONTRADICTED');
    expect(proteinFinding.severity).toBe('CRITICAL');
    expect(proteinFinding.isViolation).toBe(true);
  });

  // TEST 3: Content: "Our product guarantees 100% muscle growth." -> Expected: RESTRICTED/CONTRADICTED.
  it('TEST 3: Prohibited performance guarantee triggers restricted claim violation', async () => {
    const text = 'Our product guarantees 100% muscle growth in 30 days.';
    const sub = await ContentSubmission.create({
      organisationId: fitFuelOrg._id,
      title: 'Test 3 - 100% Guarantee',
      contentType: 'AD_COPY',
      creatorId: creatorUser._id,
    });
    const ver = await ContentVersion.create({
      submissionId: sub._id,
      organisationId: fitFuelOrg._id,
      versionNumber: 1,
      rawContent: text,
      wordCount: text.split(' ').length,
      creatorId: creatorUser._id,
    });
    sub.latestVersionId = ver._id as any;
    await sub.save();

    const result = await AnalysisOrchestrator.analyzeVersion(ver._id.toString(), creatorUser._id.toString(), 'CREATOR');
    const guaranteeFinding = result.findings.find((f) => f.claimText.includes('guarantees') || f.explanation.includes('prohibited'));

    expect(guaranteeFinding).toBeDefined();
    expect(guaranteeFinding.severity).toBe('CRITICAL');
    expect(guaranteeFinding.isViolation).toBe(true);
  });

  // TEST 4: Content: "Our product is the best supplement in India." -> Expected: UNSUPPORTED / RESTRICTED.
  it('TEST 4: Unverified superiority claim is detected and flagged', async () => {
    const text = 'Our product is the best supplement in India.';
    const sub = await ContentSubmission.create({
      organisationId: fitFuelOrg._id,
      title: 'Test 4 - Best in India',
      contentType: 'AD_COPY',
      creatorId: creatorUser._id,
    });
    const ver = await ContentVersion.create({
      submissionId: sub._id,
      organisationId: fitFuelOrg._id,
      versionNumber: 1,
      rawContent: text,
      wordCount: text.split(' ').length,
      creatorId: creatorUser._id,
    });
    sub.latestVersionId = ver._id as any;
    await sub.save();

    const result = await AnalysisOrchestrator.analyzeVersion(ver._id.toString(), creatorUser._id.toString(), 'CREATOR');
    const superiorityFinding = result.findings.find((f) => f.claimText.includes('best') || f.claimCategory === 'SUPERIORITY');

    expect(superiorityFinding).toBeDefined();
    expect(superiorityFinding.isViolation).toBe(true);
  });

  // TEST 5: Compliant product description -> Expected: No major brand violations.
  it('TEST 5: Compliant product description passes with high compliance score', async () => {
    const text = 'FitFuel Whey provides 25g protein and 120 kcal per serving. Designed to support daily protein intake and assist with athletic recovery after training.';
    const sub = await ContentSubmission.create({
      organisationId: fitFuelOrg._id,
      title: 'Test 5 - Compliant Copy',
      contentType: 'PRODUCT_DESCRIPTION',
      creatorId: creatorUser._id,
    });
    const ver = await ContentVersion.create({
      submissionId: sub._id,
      organisationId: fitFuelOrg._id,
      versionNumber: 1,
      rawContent: text,
      wordCount: text.split(' ').length,
      creatorId: creatorUser._id,
    });
    sub.latestVersionId = ver._id as any;
    await sub.save();

    const result = await AnalysisOrchestrator.analyzeVersion(ver._id.toString(), creatorUser._id.toString(), 'CREATOR');

    expect(result.analysisResult.overallScore.finalScore).toBeGreaterThanOrEqual(90);
    expect(result.analysisResult.overallScore.statusBand).toBe('STRONG');
  });

  // TEST 6: Corrected version of previously flagged advertisement -> Revalidation accurately identifies resolved issues.
  it('TEST 6: Revalidation of corrected version reflects resolved issues and score improvement', async () => {
    // V1 with critical errors
    const v1Text = 'FitFuel Whey has 40g protein and guarantees 100% muscle growth in 30 days.';
    const sub = await ContentSubmission.create({
      organisationId: fitFuelOrg._id,
      title: 'Test 6 - Multi-version Revision',
      contentType: 'AD_COPY',
      creatorId: creatorUser._id,
      currentVersionNumber: 1,
    });
    const ver1 = await ContentVersion.create({
      submissionId: sub._id,
      organisationId: fitFuelOrg._id,
      versionNumber: 1,
      rawContent: v1Text,
      wordCount: v1Text.split(' ').length,
      creatorId: creatorUser._id,
    });
    sub.latestVersionId = ver1._id as any;
    await sub.save();

    const res1 = await AnalysisOrchestrator.analyzeVersion(ver1._id.toString(), creatorUser._id.toString(), 'CREATOR');
    const scoreV1 = res1.analysisResult.overallScore.finalScore;

    // V2 with corrected specs and compliant claims
    const v2Text = 'FitFuel Whey has 25g protein and supports daily protein intake when paired with regular training.';
    const ver2 = await ContentVersion.create({
      submissionId: sub._id,
      organisationId: fitFuelOrg._id,
      versionNumber: 2,
      rawContent: v2Text,
      wordCount: v2Text.split(' ').length,
      creatorId: creatorUser._id,
      correctionsApplied: [
        { originalText: '40g', replacementText: '25g', appliedAt: new Date() },
        { originalText: 'guarantees 100% muscle growth', replacementText: 'supports daily protein intake', appliedAt: new Date() },
      ],
    });
    sub.currentVersionNumber = 2;
    sub.latestVersionId = ver2._id as any;
    await sub.save();

    const res2 = await AnalysisOrchestrator.analyzeVersion(ver2._id.toString(), creatorUser._id.toString(), 'CREATOR');
    const scoreV2 = res2.analysisResult.overallScore.finalScore;

    expect(scoreV2).toBeGreaterThan(scoreV1);
    expect(res2.analysisResult.overallScore.statusBand).toBe('STRONG');
    expect(res2.findings.filter((f) => f.isViolation).length).toBe(0);
  });
});
