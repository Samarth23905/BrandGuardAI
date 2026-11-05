import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';

export class EmbeddingService {
  private genAI: GoogleGenerativeAI | null = null;
  private embeddingModelName: string;

  constructor() {
    this.embeddingModelName = env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '') {
      this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      return new Array(768).fill(0);
    }

    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: this.embeddingModelName });
        const result = await model.embedContent(text);
        if (result.embedding && result.embedding.values) {
          return result.embedding.values;
        }
      } catch (error: any) {
        console.warn(
          `[EmbeddingService] Live Gemini embedding call failed (${error.message}). Falling back to deterministic local embedding.`
        );
      }
    }

    // Local deterministic embedding generator (768 dimensions) for offline/test environments
    return this.generateDeterministicLocalVector(text, 768);
  }

  public static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
      return 0;
    }
    const len = Math.min(vecA.length, vecB.length);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < len; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Deterministic n-gram pseudo-semantic embedding vector used as local fallback.
   * This ensures vectors preserve term overlap and lexical similarity when offline.
   */
  private generateDeterministicLocalVector(text: string, dimensions = 768): number[] {
    const vector = new Array(dimensions).fill(0);
    const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const tokens = normalized.split(/\s+/).filter(Boolean);

    if (tokens.length === 0) return vector;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      let hash = 0;
      for (let c = 0; c < token.length; c++) {
        hash = (hash << 5) - hash + token.charCodeAt(c);
        hash |= 0;
      }
      const primaryIdx = Math.abs(hash) % dimensions;
      const secondaryIdx = Math.abs((hash * 31) + 17) % dimensions;
      vector[primaryIdx] += 1.0;
      vector[secondaryIdx] += 0.5;

      // Bigram feature
      if (i > 0) {
        const bigram = `${tokens[i - 1]}_${token}`;
        let bHash = 0;
        for (let bc = 0; bc < bigram.length; bc++) {
          bHash = (bHash << 5) - bHash + bigram.charCodeAt(bc);
          bHash |= 0;
        }
        const bigramIdx = Math.abs(bHash) % dimensions;
        vector[bigramIdx] += 1.5;
      }
    }

    // L2 Normalize
    let norm = 0;
    for (let i = 0; i < dimensions; i++) {
      norm += vector[i] * vector[i];
    }
    const sqrtNorm = Math.sqrt(norm);
    if (sqrtNorm > 0) {
      for (let i = 0; i < dimensions; i++) {
        vector[i] /= sqrtNorm;
      }
    }

    return vector;
  }
}

export const embeddingService = new EmbeddingService();
