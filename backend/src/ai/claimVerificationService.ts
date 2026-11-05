import { Types } from 'mongoose';
import { geminiClient } from './geminiClient';
import { PROMPT_TEMPLATES } from './promptTemplates';
import { ExtractedClaimItem } from './claimExtractionService';
import { IApprovedFact } from '../models/ApprovedFact';
import { IRestrictedClaim } from '../models/RestrictedClaim';
import { RetrievedEvidence } from '../rag/vectorStore';
import { VerificationStatus, SeverityLevel } from '../types';

export interface VerifiedClaimFinding {
  claimText: string;
  claimCategory: string;
  startIndex: number;
  endIndex: number;
  verificationStatus: VerificationStatus;
  severity: SeverityLevel;
  confidence: number;
  explanation: string;
  isViolation: boolean;
  matchedEvidenceChunks: Array<{
    chunkId?: Types.ObjectId;
    documentTitle: string;
    similarityScore: number;
    snippet: string;
  }>;
  matchedFactId?: Types.ObjectId;
  matchedRestrictedClaimId?: Types.ObjectId;
}

export class ClaimVerificationService {
  public static async verifyClaims(
    claims: ExtractedClaimItem[],
    approvedFacts: IApprovedFact[],
    restrictedClaims: IRestrictedClaim[],
    ragEvidence: RetrievedEvidence[]
  ): Promise<VerifiedClaimFinding[]> {
    if (!claims || claims.length === 0) {
      return [];
    }

    const verifiedList: VerifiedClaimFinding[] = [];

    // First, pass through deterministic rule-based checker for exact facts and prohibited guarantees
    const ruleChecked = this.evaluateRulesDeterministically(claims, approvedFacts, restrictedClaims, ragEvidence);

    // If Gemini is available, we can refine ambiguities or nuanced claims
    if (geminiClient.isAvailable()) {
      try {
        const approvedFactsText = approvedFacts
          .map((f) => `[Fact ID: ${f._id}] ${f.title}: ${f.factStatement} (Category: ${f.category}, Product: ${f.productRef || 'General'})`)
          .join('\n');

        const restrictedText = restrictedClaims
          .map((r) => `[Restricted ID: ${r._id}] Pattern: "${r.restrictedPattern}" - Reason: ${r.reason} (Severity: ${r.riskSeverity})`)
          .join('\n');

        const ragText = ragEvidence
          .map((e) => `[Doc: ${e.sourceDocument} (Score: ${e.similarityScore})]: ${e.text}`)
          .join('\n\n');

        const aiResponse = await geminiClient.generateStructuredJson<{
          verifications: Array<{
            claimText: string;
            verificationStatus: VerificationStatus;
            severity: SeverityLevel;
            explanation: string;
            isViolation: boolean;
            confidence: number;
          }>;
        }>(
          PROMPT_TEMPLATES.CLAIM_VERIFICATION_USER(claims, approvedFactsText, restrictedText, ragText),
          PROMPT_TEMPLATES.CLAIM_VERIFICATION_SYSTEM
        );

        if (aiResponse && Array.isArray(aiResponse.verifications)) {
          // Merge AI verification with evidence mappings
          for (const item of ruleChecked) {
            const aiItem = aiResponse.verifications.find(
              (v) => v.claimText.toLowerCase().includes(item.claimText.toLowerCase()) ||
                     item.claimText.toLowerCase().includes(v.claimText.toLowerCase())
            );

            // Give precedence to deterministic contradiction or restriction if detected
            if (item.verificationStatus === 'CONTRADICTED' || item.matchedRestrictedClaimId) {
              verifiedList.push(item);
            } else if (aiItem) {
              verifiedList.push({
                ...item,
                verificationStatus: aiItem.verificationStatus,
                severity: aiItem.severity || item.severity,
                explanation: aiItem.explanation || item.explanation,
                isViolation: aiItem.isViolation,
                confidence: aiItem.confidence || 0.9,
              });
            } else {
              verifiedList.push(item);
            }
          }
          return verifiedList;
        }
      } catch (err: any) {
        console.warn(`[ClaimVerificationService] Gemini verification failed (${err.message}). Using deterministic evaluation.`);
      }
    }

    return ruleChecked;
  }

  private static evaluateRulesDeterministically(
    claims: ExtractedClaimItem[],
    approvedFacts: IApprovedFact[],
    restrictedClaims: IRestrictedClaim[],
    ragEvidence: RetrievedEvidence[]
  ): VerifiedClaimFinding[] {
    return claims.map((claim) => {
      const lowerClaim = claim.claimText.toLowerCase();

      // 1. Check against Restricted Claims (Highest priority -> Critical or Major violation)
      for (const restricted of restrictedClaims) {
        if (!restricted.isActive) continue;
        const pattern = restricted.restrictedPattern.toLowerCase().trim();
        
        // Exact substring match OR flexible token-stem match (e.g. "guarantees" matches "guaranteed")
        const patternWords = pattern.split(/\s+/).filter((w) => w.length > 3);
        const matchedWords = patternWords.filter((w) => {
          const stem = w.replace(/(ed|es|s|ing)$/i, '');
          return lowerClaim.includes(stem);
        });
        const isPatternMatch = pattern && (lowerClaim.includes(pattern) || (patternWords.length > 0 && matchedWords.length >= Math.min(3, patternWords.length)));

        if (isPatternMatch) {
          return {
            claimText: claim.claimText,
            claimCategory: claim.claimCategory,
            startIndex: claim.startIndex,
            endIndex: claim.endIndex,
            verificationStatus: 'CONTRADICTED',
            severity: restricted.riskSeverity || 'CRITICAL',
            confidence: 0.98,
            explanation: `Violates prohibited claim rule: "${restricted.restrictedPattern}". Reason: ${restricted.reason}`,
            isViolation: true,
            matchedEvidenceChunks: [],
            matchedRestrictedClaimId: restricted._id as Types.ObjectId,
          };
        }
      }

      // 2. Check for Specific Numerical/Metric Contradictions vs Approved Facts
      // Example: Content says "40g protein", but ApprovedFact says "25g"
      for (const fact of approvedFacts) {
        if (!fact.isActive) continue;
        const lowerFact = fact.factStatement.toLowerCase();

        // Check protein specification contradiction
        const claimProteinMatch = lowerClaim.match(/(\d+)\s*g\s*(?:of\s*)?protein/i);
        const factProteinMatch = lowerFact.match(/(\d+)\s*g\s*(?:of\s*)?protein/i);

        if (claimProteinMatch && factProteinMatch) {
          const claimGrams = parseInt(claimProteinMatch[1], 10);
          const factGrams = parseInt(factProteinMatch[1], 10);

          if (claimGrams === factGrams) {
            return {
              claimText: claim.claimText,
              claimCategory: 'PRODUCT',
              startIndex: claim.startIndex,
              endIndex: claim.endIndex,
              verificationStatus: 'SUPPORTED',
              severity: 'MINOR',
              confidence: 0.99,
              explanation: `Directly supported by verified product specification: "${fact.factStatement}" (${fact.title}).`,
              isViolation: false,
              matchedEvidenceChunks: [],
              matchedFactId: fact._id as Types.ObjectId,
            };
          } else {
            return {
              claimText: claim.claimText,
              claimCategory: 'PRODUCT',
              startIndex: claim.startIndex,
              endIndex: claim.endIndex,
              verificationStatus: 'CONTRADICTED',
              severity: 'CRITICAL',
              confidence: 0.99,
              explanation: `Contradicts authoritative product fact! Claim asserts ${claimGrams}g protein, but official approved specification is ${factGrams}g (${fact.title}).`,
              isViolation: true,
              matchedEvidenceChunks: [],
              matchedFactId: fact._id as Types.ObjectId,
            };
          }
        }

        // Check Calories specification contradiction
        const claimCalMatch = lowerClaim.match(/(\d+)\s*(?:kcal|calories)/i);
        const factCalMatch = lowerFact.match(/(\d+)\s*(?:kcal|calories)/i);
        if (claimCalMatch && factCalMatch) {
          const claimCal = parseInt(claimCalMatch[1], 10);
          const factCal = parseInt(factCalMatch[1], 10);
          if (claimCal === factCal) {
            return {
              claimText: claim.claimText,
              claimCategory: 'PRODUCT',
              startIndex: claim.startIndex,
              endIndex: claim.endIndex,
              verificationStatus: 'SUPPORTED',
              severity: 'MINOR',
              confidence: 0.99,
              explanation: `Matches approved calorie specification (${fact.title}): ${fact.factStatement}`,
              isViolation: false,
              matchedEvidenceChunks: [],
              matchedFactId: fact._id as Types.ObjectId,
            };
          } else {
            return {
              claimText: claim.claimText,
              claimCategory: 'PRODUCT',
              startIndex: claim.startIndex,
              endIndex: claim.endIndex,
              verificationStatus: 'CONTRADICTED',
              severity: 'CRITICAL',
              confidence: 0.99,
              explanation: `Contradicts approved calorie spec (${claimCal} kcal vs approved ${factCal} kcal).`,
              isViolation: true,
              matchedEvidenceChunks: [],
              matchedFactId: fact._id as Types.ObjectId,
            };
          }
        }
      }

      // 3. Check RAG Document Evidence matches
      const relevantChunks = ragEvidence.filter((chunk) => {
        const textLower = chunk.text.toLowerCase();
        // check term overlap
        const words = lowerClaim.split(/\s+/).filter((w) => w.length > 4);
        const matches = words.filter((w) => textLower.includes(w));
        return matches.length >= Math.min(2, words.length) || chunk.similarityScore > 0.45;
      });

      if (relevantChunks.length > 0) {
        const topChunk = relevantChunks[0];
        return {
          claimText: claim.claimText,
          claimCategory: claim.claimCategory,
          startIndex: claim.startIndex,
          endIndex: claim.endIndex,
          verificationStatus: 'SUPPORTED',
          severity: 'MINOR',
          confidence: 0.88,
          explanation: `Corroborated by brand documentation in "${topChunk.sourceDocument}".`,
          isViolation: false,
          matchedEvidenceChunks: relevantChunks.map((c) => ({
            chunkId: c.chunkId ? new Types.ObjectId(c.chunkId) : undefined,
            documentTitle: c.sourceDocument,
            similarityScore: c.similarityScore,
            snippet: c.text.slice(0, 200),
          })),
        };
      }

      // 4. Default for unsupported claims (superlatives, unbacked claims)
      if (claim.claimCategory === 'GUARANTEE' || claim.claimCategory === 'SUPERIORITY') {
        return {
          claimText: claim.claimText,
          claimCategory: claim.claimCategory,
          startIndex: claim.startIndex,
          endIndex: claim.endIndex,
          verificationStatus: 'UNSUPPORTED',
          severity: 'MAJOR',
          confidence: 0.85,
          explanation: `Unsupported claim: No approved company documentation substantiates "${claim.claimText}". Promotional superlatives and guarantees require verified evidence.`,
          isViolation: true,
          matchedEvidenceChunks: [],
        };
      }

      return {
        claimText: claim.claimText,
        claimCategory: claim.claimCategory,
        startIndex: claim.startIndex,
        endIndex: claim.endIndex,
        verificationStatus: 'UNSUPPORTED',
        severity: 'MINOR',
        confidence: 0.75,
        explanation: `Claim lacks explicit verification in the brand knowledge hub. Note: Unsupported indicates absence of verification records, not necessarily factual falsehood.`,
        isViolation: false,
        matchedEvidenceChunks: [],
      };
    });
  }
}
