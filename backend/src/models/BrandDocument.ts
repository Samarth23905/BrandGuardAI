import mongoose, { Schema, Document, Types } from 'mongoose';
import { DocumentProcessingStatus } from '../types';

export interface IBrandDocument extends Document {
  organisationId: Types.ObjectId;
  title: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  filePath: string;
  fileHash?: string;
  category: string;
  processingStatus: DocumentProcessingStatus;
  errorMessage?: string;
  chunkCount: number;
  version: string;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BrandDocumentSchema = new Schema<IBrandDocument>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
    title: { type: String, required: true, trim: true },
    originalFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },
    filePath: { type: String, required: true },
    fileHash: { type: String },
    category: { type: String, default: 'General Brand Guidelines' },
    processingStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    errorMessage: { type: String },
    chunkCount: { type: Number, default: 0 },
    version: { type: String, default: '1.0' },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

BrandDocumentSchema.index({ organisationId: 1, processingStatus: 1 });

export const BrandDocument = mongoose.model<IBrandDocument>('BrandDocument', BrandDocumentSchema);
