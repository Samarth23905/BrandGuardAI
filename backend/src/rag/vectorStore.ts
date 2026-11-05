import { Types } from 'mongoose';
import { DocumentChunk, IDocumentChunk } from '../models/DocumentChunk';
import { EmbeddingService, embeddingService } from './embeddingService';
import { env } from '../config/env';

export interface RetrievedEvidence {
  chunkId: string;
  documentId: string;
  sourceDocument: string;
  category?: string;
  text: string;
  similarityScore: number;
  retrievalMode: 'ATLAS_VECTOR_SEARCH' | 'APPLICATION_COSINE_SIMILARITY';
}

export class VectorStore {
  /**
   * Search relevant chunks within an organisation's approved knowledge base.
   * Strictly enforces organisationId isolation.
   */
  public static async searchSimilarChunks(
    organisationId: string | Types.ObjectId,
    queryText: string,
    topK = 5,
    minSimilarity = 0.25
  ): Promise<RetrievedEvidence[]> {
    const orgId = typeof organisationId === 'string' ? new Types.ObjectId(organisationId) : organisationId;
    const queryEmbedding = await embeddingService.generateEmbedding(queryText);

    // If Atlas Vector Search is enabled, attempt the aggregation pipeline
    if (env.USE_ATLAS_VECTOR_SEARCH) {
      try {
        const atlasResults = await this.searchViaAtlas(orgId, queryEmbedding, topK);
        if (atlasResults && atlasResults.length > 0) {
          return atlasResults;
        }
      } catch (err: any) {
        console.warn(
          `[VectorStore] Atlas Vector Search failed or index not found (${err.message}). Falling back to application-side cosine similarity.`
        );
      }
    }

    // High-precision Application-Side Cosine Similarity fallback (guarantees local dev / standard MongoDB works)
    return this.searchViaApplicationCosine(orgId, queryEmbedding, topK, minSimilarity);
  }

  /**
   * Atlas Vector Search pipeline execution
   */
  private static async searchViaAtlas(
    organisationId: Types.ObjectId,
    queryEmbedding: number[],
    topK: number
  ): Promise<RetrievedEvidence[]> {
    const pipeline = [
      {
        $vectorSearch: {
          index: env.ATLAS_VECTOR_INDEX_NAME,
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: topK * 10,
          limit: topK,
          filter: {
            organisationId: organisationId,
          },
        },
      },
      {
        $project: {
          _id: 1,
          documentId: 1,
          chunkText: 1,
          metadata: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ];

    const rawResults = await DocumentChunk.aggregate(pipeline as any);
    return rawResults.map((item: any) => ({
      chunkId: item._id.toString(),
      documentId: item.documentId.toString(),
      sourceDocument: item.metadata?.sourceDocument || 'Brand Document',
      category: item.metadata?.category,
      text: item.chunkText,
      similarityScore: item.score || 0,
      retrievalMode: 'ATLAS_VECTOR_SEARCH',
    }));
  }

  /**
   * Application-side Cosine Similarity fallback.
   * Strictly filters DocumentChunks by organisationId, calculates cosine similarity,
   * sorts descending, and returns Top-K results above minSimilarity threshold.
   */
  private static async searchViaApplicationCosine(
    organisationId: Types.ObjectId,
    queryEmbedding: number[],
    topK: number,
    minSimilarity: number
  ): Promise<RetrievedEvidence[]> {
    // Only fetch chunks belonging to this specific organisation
    const chunks = await DocumentChunk.find({ organisationId }).lean();
    if (!chunks || chunks.length === 0) {
      return [];
    }

    const scored = chunks.map((chunk) => {
      const sim = EmbeddingService.cosineSimilarity(queryEmbedding, chunk.embedding);
      return {
        chunkId: chunk._id.toString(),
        documentId: chunk.documentId.toString(),
        sourceDocument: chunk.metadata?.sourceDocument || 'Brand Knowledge Document',
        category: chunk.metadata?.category,
        text: chunk.chunkText,
        similarityScore: Number(sim.toFixed(4)),
        retrievalMode: 'APPLICATION_COSINE_SIMILARITY' as const,
      };
    });

    return scored
      .filter((item) => item.similarityScore >= minSimilarity)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, topK);
  }
}
