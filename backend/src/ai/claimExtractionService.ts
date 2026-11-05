import { geminiClient } from './geminiClient';
import { PROMPT_TEMPLATES } from './promptTemplates';
import { ClaimCategory } from '../types';

export interface ExtractedClaimItem {
  claimText: string;
  claimCategory: ClaimCategory;
  startIndex: number;
  endIndex: number;
  confidence: number;
  preliminaryAssessment?: string;
}

export class ClaimExtractionService {
  public static async extractClaims(text: string): Promise<ExtractedClaimItem[]> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    if (geminiClient.isAvailable()) {
      try {
        const response = await geminiClient.generateStructuredJson<{ claims: ExtractedClaimItem[] }>(
          PROMPT_TEMPLATES.CLAIM_EXTRACTION_USER(text),
          PROMPT_TEMPLATES.CLAIM_EXTRACTION_SYSTEM
        );
        if (response && Array.isArray(response.claims) && response.claims.length > 0) {
          // Validate and anchor character offsets in original text
          return response.claims.map((claim) => {
            const idx = text.indexOf(claim.claimText);
            return {
              claimText: claim.claimText,
              claimCategory: (claim.claimCategory as ClaimCategory) || 'PROMOTIONAL',
              startIndex: idx >= 0 ? idx : claim.startIndex || 0,
              endIndex: idx >= 0 ? idx + claim.claimText.length : (claim.startIndex || 0) + claim.claimText.length,
              confidence: claim.confidence || 0.9,
              preliminaryAssessment: claim.preliminaryAssessment || '',
            };
          });
        }
      } catch (err: any) {
        console.warn(`[ClaimExtractionService] Gemini extraction failed (${err.message}). Using deterministic rule-based extractor.`);
      }
    }

    // Deterministic Rule-Based Fallback for offline/test environments
    return this.deterministicExtract(text);
  }

  private static deterministicExtract(text: string): ExtractedClaimItem[] {
    const claims: ExtractedClaimItem[] = [];
    const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];

    let currentPos = 0;
    for (const rawSentence of sentences) {
      const sentence = rawSentence.trim();
      const sentenceStart = text.indexOf(sentence, currentPos);
      if (sentenceStart >= 0) currentPos = sentenceStart + sentence.length;

      if (!sentence) continue;

      // 1. Guarantee claims
      if (/\b(guarantee|guaranteed|guarantees|100%|risk-free|money-back)\b/i.test(sentence)) {
        claims.push({
          claimText: sentence,
          claimCategory: 'GUARANTEE',
          startIndex: sentenceStart >= 0 ? sentenceStart : 0,
          endIndex: sentenceStart >= 0 ? sentenceStart + sentence.length : sentence.length,
          confidence: 0.95,
          preliminaryAssessment: 'Asserts a guarantee or 100% outcome.',
        });
      }
      // 2. Superiority or comparative claims
      else if (/\b(best|#1|number one|unmatched|surpasses|superior to|leading|proven to be better)\b/i.test(sentence)) {
        claims.push({
          claimText: sentence,
          claimCategory: 'SUPERIORITY',
          startIndex: sentenceStart >= 0 ? sentenceStart : 0,
          endIndex: sentenceStart >= 0 ? sentenceStart + sentence.length : sentence.length,
          confidence: 0.92,
          preliminaryAssessment: 'Asserts superlative market or performance superiority.',
        });
      }
      // 3. Factual & Product specifications (numbers, grams, percentages, metrics)
      else if (/\b(\d+(\.\d+)?\s*(g|mg|kg|kcal|calories|%|days|hours|servings))\b/i.test(sentence) ||
               /\b(contains|formulated with|includes|delivers|specs)\b/i.test(sentence)) {
        claims.push({
          claimText: sentence,
          claimCategory: 'PRODUCT',
          startIndex: sentenceStart >= 0 ? sentenceStart : 0,
          endIndex: sentenceStart >= 0 ? sentenceStart + sentence.length : sentence.length,
          confidence: 0.88,
          preliminaryAssessment: 'Asserts specific product specification or quantitative formulation.',
        });
      }
      // 4. Performance or outcome claims
      else if (/\b(boosts|increases|reduces|builds|transforms|enhances|burns|grows|doubles)\b/i.test(sentence)) {
        claims.push({
          claimText: sentence,
          claimCategory: 'PERFORMANCE',
          startIndex: sentenceStart >= 0 ? sentenceStart : 0,
          endIndex: sentenceStart >= 0 ? sentenceStart + sentence.length : sentence.length,
          confidence: 0.85,
          preliminaryAssessment: 'Asserts a physiological or functional performance outcome.',
        });
      }
      // 5. General promotional claims
      else if (/\b(premium|exceptional|revolutionary|ultimate|pure|finest)\b/i.test(sentence)) {
        claims.push({
          claimText: sentence,
          claimCategory: 'PROMOTIONAL',
          startIndex: sentenceStart >= 0 ? sentenceStart : 0,
          endIndex: sentenceStart >= 0 ? sentenceStart + sentence.length : sentence.length,
          confidence: 0.80,
          preliminaryAssessment: 'Promotional marketing assertion.',
        });
      }
    }

    return claims;
  }
}
