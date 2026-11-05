import { geminiClient } from './geminiClient';
import { PROMPT_TEMPLATES } from './promptTemplates';
import { VerifiedClaimFinding } from './claimVerificationService';
import { TerminologyViolation } from './terminologyService';
import { ToneEvaluationResult } from './toneAnalysisService';

export interface CorrectionSuggestionDraft {
  originalText: string;
  problemType: string;
  reason: string;
  relevantGuidelineRef?: string;
  supportingEvidence?: string;
  suggestedReplacement: string;
  rationale: string;
}

export class CorrectionService {
  public static async generateSuggestions(
    content: string,
    verifiedClaims: VerifiedClaimFinding[],
    terminologyViolations: TerminologyViolation[],
    toneResult: ToneEvaluationResult
  ): Promise<CorrectionSuggestionDraft[]> {
    const suggestions: CorrectionSuggestionDraft[] = [];

    // 1. Process Terminology Violations first (straightforward replacement)
    for (const term of terminologyViolations) {
      if (term.replacementOrAlternative) {
        suggestions.push({
          originalText: term.matchedText,
          problemType: `Terminology: ${term.termType}`,
          reason: term.reason,
          relevantGuidelineRef: term.ruleId?.toString(),
          suggestedReplacement: term.replacementOrAlternative,
          rationale: `Replaces prohibited or non-preferred term "${term.matchedText}" with approved brand terminology "${term.replacementOrAlternative}".`,
        });
      }
    }

    // 2. Process Claim Violations (Contradictions & Prohibited Guarantees)
    const violationsToCorrect = verifiedClaims.filter((c) => c.isViolation);

    if (geminiClient.isAvailable() && violationsToCorrect.length > 0) {
      try {
        const issuesSummary = violationsToCorrect.map((v) => ({
          claimText: v.claimText,
          problem: v.explanation,
          severity: v.severity,
          status: v.verificationStatus,
        }));

        const aiResponse = await geminiClient.generateStructuredJson<{
          suggestions: CorrectionSuggestionDraft[];
        }>(
          `Generate compliant drop-in replacements for the following flagged issues found in this text:\n\nTEXT:\n"""${content}"""\n\nISSUES:\n${JSON.stringify(issuesSummary, null, 2)}`,
          PROMPT_TEMPLATES.CORRECTION_GENERATION_SYSTEM
        );

        if (aiResponse && Array.isArray(aiResponse.suggestions)) {
          for (const s of aiResponse.suggestions) {
            suggestions.push({
              originalText: s.originalText,
              problemType: s.problemType || 'Policy Violation',
              reason: s.reason,
              suggestedReplacement: s.suggestedReplacement,
              rationale: s.rationale,
            });
          }
          return suggestions;
        }
      } catch (err: any) {
        console.warn(`[CorrectionService] Gemini suggestion generation failed (${err.message}). Using deterministic suggestions.`);
      }
    }

    // Deterministic Rule-Based Fallback for Claim Corrections
    for (const v of violationsToCorrect) {
      const lower = v.claimText.toLowerCase();

      // Case A: 40g protein contradiction -> fix to 25g
      if (/40\s*g\s*(?:of\s*)?protein/i.test(lower)) {
        suggestions.push({
          originalText: v.claimText,
          problemType: 'Contradicted Product Specification',
          reason: v.explanation,
          relevantGuidelineRef: v.matchedFactId?.toString(),
          supportingEvidence: 'Official Product Specification: 25g protein per serving',
          suggestedReplacement: v.claimText.replace(/40\s*g/i, '25g'),
          rationale: 'Corrects the protein specification to match the verified official product data (25g).',
        });
      }
      // Case B: Prohibited guarantee: "guarantees 100% muscle growth" -> "supports daily muscle recovery"
      else if (/\b(guarantee|guarantees|100%\s*muscle\s*growth)\b/i.test(lower)) {
        suggestions.push({
          originalText: v.claimText,
          problemType: 'Prohibited Performance Guarantee',
          reason: v.explanation,
          relevantGuidelineRef: v.matchedRestrictedClaimId?.toString(),
          supportingEvidence: 'Approved Claim: "Supports daily protein intake and muscle recovery"',
          suggestedReplacement: 'Formulated to support your daily muscle recovery and fitness goals when paired with regular training.',
          rationale: 'Removes the non-compliant 100% guarantee and replaces it with approved substantiable performance language.',
        });
      }
      // Case C: Unverified superiority: "best supplement in India" -> "premium quality supplement"
      else if (/\b(best\s+supplement\s+in\s+india|#1\s+supplement)\b/i.test(lower)) {
        suggestions.push({
          originalText: v.claimText,
          problemType: 'Unsubstantiated Superiority Claim',
          reason: v.explanation,
          suggestedReplacement: 'A premium, trusted whey protein choice crafted for dedicated athletes in India.',
          rationale: 'Removes the unqualified "#1/best" claim which requires published independent market evidence, while retaining strong premium appeal.',
        });
      }
      // Generic claim correction
      else {
        suggestions.push({
          originalText: v.claimText,
          problemType: 'Unsubstantiated Claim',
          reason: v.explanation,
          suggestedReplacement: `Carefully formulated to help you achieve your wellness objectives.`,
          rationale: 'Replaces unsubstantiated assertion with safe, customer-centric value messaging.',
        });
      }
    }

    // 3. Tone suggestion if non-compliant
    if (!toneResult.isCompliant && toneResult.suggestedToneAdjustment) {
      suggestions.push({
        originalText: 'Tone & Voice Overall',
        problemType: 'Brand Tone Divergence',
        reason: toneResult.explanation,
        suggestedReplacement: 'Adjust overall phrasing to follow brand guidelines.',
        rationale: toneResult.suggestedToneAdjustment,
      });
    }

    return suggestions;
  }
}
