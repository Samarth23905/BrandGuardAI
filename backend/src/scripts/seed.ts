import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { Organisation } from '../models/Organisation';
import { User } from '../models/User';
import { OrganisationMembership } from '../models/OrganisationMembership';
import { BrandGuideline } from '../models/BrandGuideline';
import { ApprovedFact } from '../models/ApprovedFact';
import { ApprovedClaim } from '../models/ApprovedClaim';
import { RestrictedClaim } from '../models/RestrictedClaim';
import { TerminologyRule } from '../models/TerminologyRule';
import { BrandDocument } from '../models/BrandDocument';
import { DocumentChunk } from '../models/DocumentChunk';
import { ContentSubmission } from '../models/ContentSubmission';
import { ContentVersion } from '../models/ContentVersion';
import { AnalysisOrchestrator } from '../services/analysisOrchestrator';
import { embeddingService } from '../rag/embeddingService';

export const seedDatabase = async () => {
  console.log('[Seed] Starting BrandGuard AI Seed Process...');
  await connectDatabase();

  // Clear existing FitFuel demo data if present
  const existingOrg = await Organisation.findOne({ slug: 'fitfuel-nutrition' });
  if (existingOrg) {
    const orgId = existingOrg._id;
    await Promise.all([
      User.deleteMany({ organisationId: orgId }),
      OrganisationMembership.deleteMany({ organisationId: orgId }),
      BrandGuideline.deleteMany({ organisationId: orgId }),
      ApprovedFact.deleteMany({ organisationId: orgId }),
      ApprovedClaim.deleteMany({ organisationId: orgId }),
      RestrictedClaim.deleteMany({ organisationId: orgId }),
      TerminologyRule.deleteMany({ organisationId: orgId }),
      BrandDocument.deleteMany({ organisationId: orgId }),
      DocumentChunk.deleteMany({ organisationId: orgId }),
      ContentSubmission.deleteMany({ organisationId: orgId }),
      ContentVersion.deleteMany({ organisationId: orgId }),
      Organisation.deleteOne({ _id: orgId }),
    ]);
    console.log('[Seed] Cleared previous FitFuel demonstration records.');
  }

  // 1. Create Organisation
  const organisation = await Organisation.create({
    name: 'FitFuel Nutrition',
    slug: 'fitfuel-nutrition',
    industry: 'Sports Nutrition & Health Supplements',
    website: 'https://fitfuel.example.com',
    description: 'Leading sports nutrition brand empowering athletes with science-backed supplements.',
    settings: {
      allowCreatorSelfApproval: false,
      minPassingScore: 70,
      blockCriticalViolations: true,
      requireReviewerNotes: true,
      scoringWeights: {
        critical: 25,
        major: 10,
        minor: 3,
      },
    },
  });
  console.log(`[Seed] Created Organisation: ${organisation.name} (${organisation._id})`);

  // 2. Create Users (Admin, Creator, Reviewer)
  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const admin = await User.create({
    name: 'Sarah Connor (Admin)',
    email: 'admin@fitfuel.com',
    passwordHash,
    role: 'ADMIN',
    organisationId: organisation._id,
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  });

  const creator = await User.create({
    name: 'Alex Rivera (Creator)',
    email: 'creator@fitfuel.com',
    passwordHash,
    role: 'CREATOR',
    organisationId: organisation._id,
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  });

  const reviewer = await User.create({
    name: 'Dr. Marcus Vance (Reviewer)',
    email: 'reviewer@fitfuel.com',
    passwordHash,
    role: 'REVIEWER',
    organisationId: organisation._id,
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  });

  await OrganisationMembership.create([
    { organisationId: organisation._id, userId: admin._id, role: 'ADMIN', status: 'ACTIVE' },
    { organisationId: organisation._id, userId: creator._id, role: 'CREATOR', status: 'ACTIVE' },
    { organisationId: organisation._id, userId: reviewer._id, role: 'REVIEWER', status: 'ACTIVE' },
  ]);
  console.log('[Seed] Created Users: admin@fitfuel.com, creator@fitfuel.com, reviewer@fitfuel.com (Password: Password123!)');

  // 3. Brand Guidelines
  await BrandGuideline.create([
    {
      organisationId: organisation._id,
      category: 'TONE',
      title: 'Empowering & Professional Voice',
      ruleDescription: 'Communication must remain motivating, scientifically grounded, and professional. Avoid sensationalist hype, false guarantees, and aggressive slang.',
      severity: 'MAJOR',
      isActive: true,
      createdBy: admin._id,
    },
    {
      organisationId: organisation._id,
      category: 'STYLE',
      title: 'Evidence-Based Nutrition Claims',
      ruleDescription: 'All health statements must cite nutritional science or official product formulation records. Never imply instantaneous or effortless transformations.',
      severity: 'CRITICAL',
      isActive: true,
      createdBy: admin._id,
    },
    {
      organisationId: organisation._id,
      category: 'MESSAGING',
      title: 'Athletic Partnership Positioning',
      ruleDescription: 'Emphasize that FitFuel products are performance partners to consistent training and balanced nutrition.',
      severity: 'MAJOR',
      isActive: true,
      createdBy: admin._id,
    },
    {
      organisationId: organisation._id,
      category: 'ACCESSIBILITY',
      title: 'Clear Plain-Language Communication',
      ruleDescription: 'Keep consumer explanations accessible to broad audiences without convoluted medical jargon. Always supply clear and descriptive calls to action.',
      severity: 'MINOR',
      isActive: true,
      createdBy: admin._id,
    },
  ]);
  console.log('[Seed] Created Brand Guidelines.');

  // 4. Approved Facts
  await ApprovedFact.create([
    {
      organisationId: organisation._id,
      category: 'PRODUCT',
      title: 'FitFuel Whey Protein Specification',
      factStatement: 'FitFuel Whey contains 25g protein per serving.',
      productRef: 'FitFuel Whey',
      verificationEvidence: 'Laboratory Formulation Sheet FF-WHEY-2026',
      isActive: true,
      createdBy: admin._id,
    },
    {
      organisationId: organisation._id,
      category: 'PRODUCT',
      title: 'FitFuel Whey Calorie Specification',
      factStatement: 'FitFuel Whey contains 120 kcal per serving.',
      productRef: 'FitFuel Whey',
      verificationEvidence: 'Certified Nutritional Facts Panel FF-WHEY-2026',
      isActive: true,
      createdBy: admin._id,
    },
    {
      organisationId: organisation._id,
      category: 'INGREDIENT',
      title: 'Whey Protein Isolate Source',
      factStatement: '100% micro-filtered whey protein isolate sourced from grass-fed dairy.',
      productRef: 'FitFuel Whey',
      isActive: true,
      createdBy: admin._id,
    },
    {
      organisationId: organisation._id,
      category: 'COMPANY',
      title: 'Manufacturing Standards',
      factStatement: 'Manufactured in an FDA-registered and cGMP-certified facility.',
      isActive: true,
      createdBy: admin._id,
    },
  ]);
  console.log('[Seed] Created Approved Facts.');

  // 5. Approved Claims
  await ApprovedClaim.create([
    {
      organisationId: organisation._id,
      category: 'MARKETING',
      claimStatement: 'Supports daily protein intake.',
      permittedContext: 'Ad copy, product packaging, and social media promotions.',
      isActive: true,
      createdBy: admin._id,
    },
    {
      organisationId: organisation._id,
      category: 'PRODUCT_DESCRIPTION',
      claimStatement: 'Promotes muscle recovery after intense physical workouts.',
      permittedContext: 'When accompanied by regular athletic training context.',
      isActive: true,
      createdBy: admin._id,
    },
  ]);
  console.log('[Seed] Created Approved Claims.');

  // 6. Restricted Claims
  await RestrictedClaim.create([
    {
      organisationId: organisation._id,
      category: 'PROHIBITED_GUARANTEE',
      restrictedPattern: 'Guaranteed 100% muscle growth in 30 days',
      reason: 'Prohibited clinical guarantee. FTC regulations and sports nutrition policy forbid absolute physiological growth promises.',
      riskSeverity: 'CRITICAL',
      suggestedAlternative: 'Formulated to support your daily muscle recovery and fitness progression when paired with structured training.',
      isActive: true,
      createdBy: admin._id,
    },
    {
      organisationId: organisation._id,
      category: 'UNVERIFIED_COMPARISON',
      restrictedPattern: 'best supplement in India',
      reason: 'Unsubstantiated market superiority superlative without accredited independent third-party market share audit.',
      riskSeverity: 'MAJOR',
      suggestedAlternative: 'A premier whey protein crafted for dedicated athletes in India.',
      isActive: true,
      createdBy: admin._id,
    },
    {
      organisationId: organisation._id,
      category: 'UNSUPPORTED_HEALTH',
      restrictedPattern: 'cures joint fatigue',
      reason: 'Medical treatment assertion prohibited for dietary supplements under FDA/FSSAI compliance rules.',
      riskSeverity: 'CRITICAL',
      suggestedAlternative: 'Helps support overall post-exercise physical recovery.',
      isActive: true,
      createdBy: admin._id,
    },
  ]);
  console.log('[Seed] Created Restricted Claims.');

  // 7. Terminology Rules
  await TerminologyRule.create([
    {
      organisationId: organisation._id,
      termType: 'PRODUCT_NAMING',
      term: 'Fitfuel',
      replacementOrAlternative: 'FitFuel',
      ruleContext: 'Capitalize both F words according to brand identity guidelines.',
      caseSensitive: true,
      severity: 'MINOR',
      isActive: true,
      createdBy: admin._id,
    },
    {
      organisationId: organisation._id,
      termType: 'RESTRICTED',
      term: 'steroid-like',
      replacementOrAlternative: 'high-potency',
      ruleContext: 'Never associate sports nutrition products with prohibited substances.',
      severity: 'CRITICAL',
      isActive: true,
      createdBy: admin._id,
    },
    {
      organisationId: organisation._id,
      termType: 'PREFERRED_ALTERNATIVE',
      term: 'bulking powder',
      replacementOrAlternative: 'muscle support supplement',
      ruleContext: 'Maintain premium sports wellness positioning rather than colloquial gym slang.',
      severity: 'MINOR',
      isActive: true,
      createdBy: admin._id,
    },
  ]);
  console.log('[Seed] Created Terminology Rules.');

  // 8. Brand Document & Vector Embeddings
  const brandDoc = await BrandDocument.create({
    organisationId: organisation._id,
    title: 'FitFuel Brand Master Guidelines 2026',
    originalFileName: 'fitfuel-brand-guidelines-2026.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 245000,
    filePath: 'uploads/fitfuel-guidelines-sample.pdf',
    category: 'Master Guidelines',
    processingStatus: 'COMPLETED',
    chunkCount: 3,
    version: '1.0',
    uploadedBy: admin._id,
  });

  const knowledgeTexts = [
    'FitFuel Whey is formulated with exactly 25g protein and 120 kcal per single 32g scoop. It delivers 5.5g naturally occurring branched-chain amino acids (BCAAs) to support daily muscle recovery and athletic performance.',
    'All advertising copy must emphasize balanced lifestyle, consistent athletic training, and wholesome nutrition. Never promise effortless results, rapid weight loss, or guaranteed physical transformations.',
    'FitFuel represents clean sports nutrition manufactured in cGMP-certified facilities. The brand name must always be stylized as "FitFuel" with camel case capitalization.',
  ];

  for (let i = 0; i < knowledgeTexts.length; i++) {
    const text = knowledgeTexts[i];
    const embedding = await embeddingService.generateEmbedding(text);
    await DocumentChunk.create({
      organisationId: organisation._id,
      documentId: brandDoc._id,
      chunkIndex: i,
      chunkText: text,
      embedding,
      metadata: {
        sourceDocument: brandDoc.title,
        pageNumber: i + 1,
        category: 'Master Guidelines',
        tokenCount: Math.ceil(text.length / 4),
        version: '1.0',
      },
    });
  }
  console.log('[Seed] Created Brand Documents and indexed Semantic Chunks.');

  // 9. Sample Content Submissions & AI Analysis
  // Submission A: High compliance risk (contains 40g contradiction & restricted guarantee)
  const subA = await ContentSubmission.create({
    organisationId: organisation._id,
    title: 'FitFuel Whey Summer Launch Ad',
    contentType: 'AD_COPY',
    targetAudience: 'Fitness enthusiasts and gym goers aged 20-35',
    channel: 'Instagram & Facebook Ads',
    currentVersionNumber: 1,
    status: 'SUBMITTED',
    creatorId: creator._id,
  });

  const rawTextA = `Introducing the new FitFuel Whey! Our supplement contains 40g protein per serving and guarantees 100% muscle growth in 30 days. Experience steroid-like gains and see why we are the best supplement in India. Visit fitfuel.com to order your bulking powder today!`;

  const verA1 = await ContentVersion.create({
    submissionId: subA._id,
    organisationId: organisation._id,
    versionNumber: 1,
    rawContent: rawTextA,
    wordCount: rawTextA.split(/\s+/).length,
    creatorId: creator._id,
    notes: 'Draft campaign copy for launch',
  });

  subA.latestVersionId = verA1._id as any;
  await subA.save();

  console.log('[Seed] Running AI Analysis Orchestrator on Submission A...');
  await AnalysisOrchestrator.analyzeVersion(verA1._id.toString(), creator._id.toString(), 'CREATOR');

  // Submission B: Compliant Post (High score ~95)
  const subB = await ContentSubmission.create({
    organisationId: organisation._id,
    title: 'Post-Workout Fuel Educational Reel',
    contentType: 'SOCIAL_POST',
    targetAudience: 'Athletes seeking recovery insights',
    channel: 'TikTok & Instagram Reels',
    currentVersionNumber: 1,
    status: 'SUBMITTED',
    creatorId: creator._id,
  });

  const rawTextB = `Fuel your training with FitFuel Whey. Each serving provides 25g protein and 120 kcal to support daily protein intake and assist muscle recovery after tough workouts. Formulated with clean grass-fed whey isolate in a certified facility. Learn more at fitfuel.com.`;

  const verB1 = await ContentVersion.create({
    submissionId: subB._id,
    organisationId: organisation._id,
    versionNumber: 1,
    rawContent: rawTextB,
    wordCount: rawTextB.split(/\s+/).length,
    creatorId: creator._id,
    notes: 'Compliant educational post',
  });

  subB.latestVersionId = verB1._id as any;
  await subB.save();

  console.log('[Seed] Running AI Analysis Orchestrator on Submission B...');
  await AnalysisOrchestrator.analyzeVersion(verB1._id.toString(), creator._id.toString(), 'CREATOR');

  console.log('[Seed] Demonstration Data Seeding Completed Successfully! 🚀');
  await disconnectDatabase();
};

if (require.main === module) {
  seedDatabase().catch((err) => {
    console.error('[Seed] Error during seeding:', err);
    process.exit(1);
  });
}
