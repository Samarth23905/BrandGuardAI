import { Types } from 'mongoose';
import { ContentSubmission } from '../models/ContentSubmission';
import { ContentVersion } from '../models/ContentVersion';
import { AnalysisResult, IAnalysisResult } from '../models/AnalysisResult';
import { ClaimFinding } from '../models/ClaimFinding';
import { CorrectionSuggestion } from '../models/CorrectionSuggestion';
import { ApprovedFact } from '../models/ApprovedFact';
import { RestrictedClaim } from '../models/RestrictedClaim';
import { TerminologyRule } from '../models/TerminologyRule';
import { BrandGuideline } from '../models/BrandGuideline';
import { AuditLog } from '../models/AuditLog';

import { ClaimExtractionService } from '../ai/claimExtractionService';
import { ClaimVerificationService } from '../ai/claimVerificationService';
import { ToneAnalysisService } from '../ai/toneAnalysisService';
import { TerminologyService } from '../ai/terminologyService';
import { MessagingService } from '../ai/messagingService';
import { AccessibilityService } from '../ai/accessibilityService';
import { ScoringEngine } from '../ai/scoringEngine';
import { CorrectionService } from '../ai/correctionService';
import { VectorStore } from '../rag/vectorStore';
import { geminiClient } from '../ai/geminiClient';

export interface AnalysisOrchestrationResult {
  analysisResult: IAnalysisResult;
  findings: any[];
  suggestions: any[];
}

export class AnalysisOrchestrator {
  public static async analyzeVersion(
    versionId: string | Types.ObjectId,
    actorId: string | Types.ObjectId,
    actorRole: 'ADMIN' | 'CREATOR' | 'REVIEWER'
  ): Promise<AnalysisOrchestrationResult> {
    const startTime = Date.now();

    const version = await ContentVersion.findById(versionId);
    if (!version) {
      throw new Error(`ContentVersion ${versionId} not found.`);
    }

    const submission = await ContentSubmission.findById(version.submissionId);
    if (!submission) {
      throw new Error(`ContentSubmission ${version.submissionId} not found.`);
    }

    const orgId = version.organisationId;

    // Update submission status to ANALYSING
    submission.status = 'ANALYSING';
    await submission.save();

    // 1. Load active organisation brand knowledge
    const [approvedFacts, restrictedClaims, terminologyRules, brandGuidelines] = await Promise.all([
      ApprovedFact.find({ organisationId: orgId, isActive: true }),
      RestrictedClaim.find({ organisationId: orgId, isActive: true }),
      TerminologyRule.find({ organisationId: orgId, isActive: true }),
      BrandGuideline.find({ organisationId: orgId, isActive: true }),
    ]);

    const contentText = version.rawContent;

    // 2. Claim Extraction
    const extractedClaims = await ClaimExtractionService.extractClaims(contentText);

    // 3. RAG Knowledge Retrieval for context
    const ragEvidence = await VectorStore.searchSimilarChunks(orgId, contentText, 6, 0.20);

    // 4. Claim Verification
    const verifiedClaims = await ClaimVerificationService.verifyClaims(
      extractedClaims,
      approvedFacts,
      restrictedClaims,
      ragEvidence
    );

    // 5. Brand Tone Analysis
    const toneResult = await ToneAnalysisService.analyzeTone(contentText, brandGuidelines);

    // 6. Terminology Check
    const terminologyResult = TerminologyService.checkTerminology(contentText, terminologyRules);

    // 7. Messaging & Policy Check
    const messagingResult = MessagingService.evaluateMessaging(contentText, brandGuidelines);

    // 8. Accessibility Evaluation
    const accessibilityResult = AccessibilityService.evaluateTextAccessibility(contentText);

    // 9. Transparent Deterministic Compliance Scoring
    const scoringResult = ScoringEngine.calculateComplianceScore(
      verifiedClaims,
      terminologyResult.violations,
      toneResult,
      accessibilityResult
    );

    // 10. Explainable Correction Generation
    const correctionDrafts = await CorrectionService.generateSuggestions(
      contentText,
      verifiedClaims,
      terminologyResult.violations,
      toneResult
    );

    const processingTimeMs = Date.now() - startTime;

    // Claims summary counts
    const supportedCount = verifiedClaims.filter((c) => c.verificationStatus === 'SUPPORTED').length;
    const contradictedCount = verifiedClaims.filter((c) => c.verificationStatus === 'CONTRADICTED').length;
    const unsupportedCount = verifiedClaims.filter((c) => c.verificationStatus === 'UNSUPPORTED').length;
    const ambiguousCount = verifiedClaims.filter((c) => c.verificationStatus === 'AMBIGUOUS').length;

    // 11. Create & Save AnalysisResult
    const analysis = new AnalysisResult({
      submissionId: submission._id,
      versionId: version._id,
      organisationId: orgId,
      overallScore: {
        initialScore: scoringResult.initialScore,
        finalScore: scoringResult.finalScore,
        statusBand: scoringResult.statusBand,
        totalDeductions: scoringResult.totalDeductions,
      },
      deductionsBreakdown: scoringResult.deductionsBreakdown,
      claimsSummary: {
        totalClaims: verifiedClaims.length,
        supported: supportedCount,
        contradicted: contradictedCount,
        unsupported: unsupportedCount,
        ambiguous: ambiguousCount,
      },
      toneEvaluation: {
        detectedTone: toneResult.detectedTone,
        expectedTone: toneResult.expectedTone,
        isCompliant: toneResult.isCompliant,
        explanation: toneResult.explanation,
      },
      terminologyEvaluation: {
        issuesFound: terminologyResult.issuesFound,
        restrictedTermsCount: terminologyResult.restrictedTermsCount,
      },
      messagingEvaluation: {
        isCompliant: messagingResult.isCompliant,
        explanation: messagingResult.explanation,
      },
      accessibilityEvaluation: {
        readingEaseScore: accessibilityResult.readingEaseScore,
        readingGradeLevel: accessibilityResult.readingGradeLevel,
        issues: accessibilityResult.issues,
      },
      status: 'COMPLETED',
      processingTimeMs,
      aiModelUsed: geminiClient.isAvailable() ? geminiClient.getModelName() : 'deterministic-rule-engine-v1',
    });

    await analysis.save();

    // 12. Save ClaimFindings
    const savedFindings = await Promise.all(
      verifiedClaims.map((claim) => {
        const finding = new ClaimFinding({
          analysisResultId: analysis._id,
          versionId: version._id,
          submissionId: submission._id,
          organisationId: orgId,
          claimText: claim.claimText,
          claimCategory: claim.claimCategory,
          startIndex: claim.startIndex,
          endIndex: claim.endIndex,
          verificationStatus: claim.verificationStatus,
          severity: claim.severity,
          confidence: claim.confidence,
          explanation: claim.explanation,
          matchedEvidenceChunks: claim.matchedEvidenceChunks,
          matchedFactId: claim.matchedFactId,
          matchedRestrictedClaimId: claim.matchedRestrictedClaimId,
          isViolation: claim.isViolation,
        });
        return finding.save();
      })
    );

    // 13. Save CorrectionSuggestions
    const savedSuggestions = await Promise.all(
      correctionDrafts.map((draft) => {
        const matchedFinding = savedFindings.find((f) =>
          draft.originalText.toLowerCase().includes(f.claimText.toLowerCase()) ||
          f.claimText.toLowerCase().includes(draft.originalText.toLowerCase())
        );

        const suggestion = new CorrectionSuggestion({
          analysisResultId: analysis._id,
          claimFindingId: matchedFinding ? matchedFinding._id : undefined,
          versionId: version._id,
          submissionId: submission._id,
          organisationId: orgId,
          originalText: draft.originalText,
          problemType: draft.problemType,
          reason: draft.reason,
          relevantGuidelineRef: draft.relevantGuidelineRef,
          supportingEvidence: draft.supportingEvidence,
          suggestedReplacement: draft.suggestedReplacement,
          rationale: draft.rationale,
          status: 'PENDING',
        });
        return suggestion.save();
      })
    );

    // 14. Update Version and Submission references
    version.analysisResultId = analysis._id as Types.ObjectId;
    await version.save();

    submission.latestVersionId = version._id as Types.ObjectId;
    submission.latestScore = scoringResult.finalScore;
    submission.criticalViolationsCount = scoringResult.criticalViolationsCount;

    // Status logic: if critical violations exist or score < 70, mark NEEDS_REVISION; else READY_FOR_REVIEW
    if (scoringResult.criticalViolationsCount > 0 || scoringResult.finalScore < 70) {
      submission.status = 'NEEDS_REVISION';
    } else {
      submission.status = 'READY_FOR_REVIEW';
    }
    await submission.save();

    // 15. Record Audit Log
    await AuditLog.create({
      organisationId: orgId,
      actorId: new Types.ObjectId(actorId),
      actorRole,
      action: 'CONTENT_ANALYSIS_COMPLETED',
      entityType: 'ContentSubmission',
      entityId: submission._id.toString(),
      details: {
        versionNumber: version.versionNumber,
        finalScore: scoringResult.finalScore,
        criticalViolations: scoringResult.criticalViolationsCount,
        totalClaims: verifiedClaims.length,
        processingTimeMs,
      },
    });

    return {
      analysisResult: analysis,
      findings: savedFindings,
      suggestions: savedSuggestions,
    };
  }
}
