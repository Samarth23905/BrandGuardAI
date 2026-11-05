import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDocumentChunk extends Document {
  organisationId: Types.ObjectId;
  documentId: Types.ObjectId;
  chunkIndex: number;
  chunkText: string;
  embedding: number[];
  metadata: {
    sourceDocument: string;
    pageNumber?: number;
    category?: string;
    tokenCount?: number;
    version?: string;
  };
  createdAt: Date;
}

const DocumentChunkSchema = new Schema<IDocumentChunk>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    documentId: { type: Schema.Types.ObjectId, ref: 'BrandDocument', required: true, index: true },
    chunkIndex: { type: Number, required: true },
    chunkText: { type: String, required: true },
    embedding: { type: [Number], required: true },
    metadata: {
      sourceDocument: { type: String, required: true },
      pageNumber: { type: Number },
      category: { type: String },
      tokenCount: { type: Number },
      version: { type: String, default: '1.0' },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

DocumentChunkSchema.index({ organisationId: 1, documentId: 1 });
DocumentChunkSchema.index({ organisationId: 1, chunkIndex: 1 });

export const DocumentChunk = mongoose.model<IDocumentChunk>('DocumentChunk', DocumentChunkSchema);
