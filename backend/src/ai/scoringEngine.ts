import { Types } from 'mongoose';
import { VerifiedClaimFinding } from './claimVerificationService';
import { TerminologyViolation } from './terminologyService';
import { ToneEvaluationResult } from './toneAnalysisService';
import { AccessibilityEvaluationResult } from './accessibilityService';
import { IDeductionItem } from '../models/AnalysisResult';
import { SeverityLevel } from '../types';

export interface ScoreCalculationResult {
  initialScore: number;
  finalScore: number;
  statusBand: 'STRONG' | 'NEEDS_IMPROVEMENT' | 'HIGH_RISK';
  totalDeductions: number;
  criticalViolationsCount: number;
  deductionsBreakdown: IDeductionItem[];
}

export class ScoringEngine {
  public static calculateComplianceScore(
    verifiedClaims: VerifiedClaimFinding[],
    terminologyViolations: TerminologyViolation[],
    toneResult: ToneEvaluationResult,
    accessibilityResult: AccessibilityEvaluationResult,
    customWeights = { critical: 25, major: 10, minor: 3 }
  ): ScoreCalculationResult {
    const deductions: IDeductionItem[] = [];
    const seenViolationKeys = new Set<string>();

    const addDeduction = (
      key: string,
      category: string,
      severity: SeverityLevel,
      reason: string,
      findingId?: Types.ObjectId,
      ruleId?: string
    ) => {
      // Prevent duplicate deductions for the exact same underlying violation
      if (seenViolationKeys.has(key)) return;
      seenViolationKeys.add(key);

      let points = customWeights.minor;
      if (severity === 'CRITICAL') points = customWeights.critical;
      else if (severity === 'MAJOR') points = customWeights.major;

      deductions.push({
        findingId,
        ruleId,
        category,
        severity,
        deductionPoints: points,
        reason,
      });
    };

    // 1. Process Claim Violations
    for (const claim of verifiedClaims) {
      if (claim.isViolation || claim.verificationStatus === 'CONTRADICTED') {
        const key = `claim_${claim.claimText.toLowerCase().trim()}`;
        addDeduction(
          key,
          `Claim (${claim.claimCategory})`,
          claim.severity,
          claim.explanation,
          undefined,
          claim.matchedRestrictedClaimId?.toString() || claim.matchedFactId?.toString()
        );
      }
    }

    // 2. Process Terminology Violations
    for (const term of terminologyViolations) {
      const key = `term_${term.term.toLowerCase().trim()}`;
      addDeduction(
        key,
        'Terminology',
        term.severity,
        term.reason,
        undefined,
        term.ruleId?.toString()
      );
    }

    // 3. Process Tone Deviation
    if (!toneResult.isCompliant) {
      addDeduction(
        'tone_divergence',
        'Brand Tone',
        'MAJOR',
        toneResult.explanation
      );
    }

    // 4. Process Accessibility Issues
    if (accessibilityResult.readingEaseScore < 45) {
      addDeduction(
        'accessibility_readability',
        'Accessibility',
        'MINOR',
        `Low reading ease score (${accessibilityResult.readingEaseScore}/100). Vocabulary or sentence structure may exclude audiences.`
      );
    }

    // Sum deductions
    const totalDeductions = deductions.reduce((acc, curr) => acc + curr.deductionPoints, 0);
    const initialScore = 100;
    const finalScore = Math.max(0, initialScore - totalDeductions);

    // Determine status band
    let statusBand: 'STRONG' | 'NEEDS_IMPROVEMENT' | 'HIGH_RISK' = 'STRONG';
    if (finalScore < 70) {
      statusBand = 'HIGH_RISK';
    } else if (finalScore < 90) {
      statusBand = 'NEEDS_IMPROVEMENT';
    }

    const criticalCount = deductions.filter((d) => d.severity === 'CRITICAL').length;

    return {
      initialScore,
      finalScore,
      statusBand,
      totalDeductions,
      criticalViolationsCount: criticalCount,
      deductionsBreakdown: deductions,
    };
  }
}
