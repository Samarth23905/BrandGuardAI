import { geminiClient } from './geminiClient';
import { PROMPT_TEMPLATES } from './promptTemplates';
import { IBrandGuideline } from '../models/BrandGuideline';

export interface ToneEvaluationResult {
  detectedTone: string;
  expectedTone: string;
  isCompliant: boolean;
  explanation: string;
  toneScore: number;
  suggestedToneAdjustment?: string;
}

export class ToneAnalysisService {
  public static async analyzeTone(
    content: string,
    toneGuidelines: IBrandGuideline[]
  ): Promise<ToneEvaluationResult> {
    const activeGuidelines = toneGuidelines.filter((g) => g.category === 'TONE' && g.isActive);
    const expectedToneDesc = activeGuidelines.map((g) => `${g.title}: ${g.ruleDescription}`).join('; ') ||
      'Professional, empowering, trustworthy, and motivating.';

    if (geminiClient.isAvailable()) {
      try {
        const response = await geminiClient.generateStructuredJson<ToneEvaluationResult>(
          PROMPT_TEMPLATES.TONE_ANALYSIS_USER(content, expectedToneDesc),
          PROMPT_TEMPLATES.TONE_ANALYSIS_SYSTEM
        );
        if (response && response.detectedTone) {
          return {
            detectedTone: response.detectedTone,
            expectedTone: response.expectedTone || expectedToneDesc,
            isCompliant: response.isCompliant ?? true,
            explanation: response.explanation || 'Tone aligns with brand voice guidelines.',
            toneScore: response.toneScore || (response.isCompliant ? 90 : 65),
            suggestedToneAdjustment: response.suggestedToneAdjustment,
          };
        }
      } catch (err: any) {
        console.warn(`[ToneAnalysisService] Gemini tone analysis failed (${err.message}). Using heuristic analyzer.`);
      }
    }

    // Deterministic Heuristic Tone Evaluator
    return this.heuristicAnalyzeTone(content, expectedToneDesc);
  }

  private static heuristicAnalyzeTone(content: string, expectedTone: string): ToneEvaluationResult {
    const lower = content.toLowerCase();
    const exclamationCount = (content.match(/!/g) || []).length;
    const allCapsWords = (content.match(/\b[A-Z]{3,}\b/g) || []).length;
    const aggressiveWords = ['miracle', 'insane', 'explode', 'crush', 'destroy', 'guaranteed', '100%'];
    const hasAggressive = aggressiveWords.filter((w) => lower.includes(w));

    if (exclamationCount > 3 || allCapsWords > 2 || hasAggressive.length >= 2) {
      return {
        detectedTone: 'Sensationalist / Overly Aggressive Hype',
        expectedTone,
        isCompliant: false,
        explanation: `Content exhibits excessive hype, multiple exclamations (${exclamationCount}), and sensationalist keywords (${hasAggressive.join(', ')}). This conflicts with the expected tone: ${expectedTone}.`,
        toneScore: 60,
        suggestedToneAdjustment: 'Tone down aggressive superlatives and replace sensationalist promises with confident, evidence-backed statements.',
      };
    }

    return {
      detectedTone: 'Professional & Motivating',
      expectedTone,
      isCompliant: true,
      explanation: 'Tone is balanced, professional, and aligns well with the brand guidelines.',
      toneScore: 92,
    };
  }
}
