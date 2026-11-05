import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { BrandDocument } from '../models/BrandDocument';
import { DocumentChunk } from '../models/DocumentChunk';
import { TextExtractor } from '../rag/textExtractor';
import { TextChunker } from '../rag/chunker';
import { embeddingService } from '../rag/embeddingService';
import { AuditService } from '../services/auditService';
import { AuthenticatedRequest } from '../types';

export class DocumentController {
  public static async uploadDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'No document file uploaded.' });
      return;
    }

    const { title, category, version } = req.body;
    const docTitle = title || path.basename(file.originalname, path.extname(file.originalname));

    // Create BrandDocument record in PENDING status
    const brandDoc = await BrandDocument.create({
      organisationId: req.organisationId,
      title: docTitle,
      originalFileName: file.originalname,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      filePath: file.path,
      category: category || 'General Brand Guidelines',
      version: version || '1.0',
      processingStatus: 'PROCESSING',
      uploadedBy: req.user!.userId,
    });

    try {
      // Step 2 & 3: Extract and clean text
      const extracted = await TextExtractor.extract(file.path, file.mimetype);

      if (!extracted.cleanedText || extracted.cleanedText.length === 0) {
        throw new Error('Extracted document content was empty.');
      }

      // Step 4: Chunk text
      const chunker = new TextChunker(550, 100);
      const chunks = chunker.chunk(extracted.cleanedText);

      // Step 5 & 6: Generate embeddings and save chunks
      const chunkDocs = [];
      for (const c of chunks) {
        const embedding = await embeddingService.generateEmbedding(c.text);
        chunkDocs.push({
          organisationId: req.organisationId,
          documentId: brandDoc._id,
          chunkIndex: c.chunkIndex,
          chunkText: c.text,
          embedding,
          metadata: {
            sourceDocument: brandDoc.title,
            pageNumber: extracted.pageCount ? Math.ceil((c.chunkIndex + 1) / Math.max(1, chunks.length / extracted.pageCount)) : 1,
            category: brandDoc.category,
            tokenCount: c.tokenCount,
            version: brandDoc.version,
          },
        });
      }

      if (chunkDocs.length > 0) {
        await DocumentChunk.insertMany(chunkDocs);
      }

      // Step 7: Mark completed
      brandDoc.processingStatus = 'COMPLETED';
      brandDoc.chunkCount = chunkDocs.length;
      await brandDoc.save();

      await AuditService.log(
        req.organisationId!,
        req.user!.userId,
        req.user!.role,
        'DOCUMENT_PROCESSED',
        'BrandDocument',
        brandDoc._id.toString(),
        {
          title: brandDoc.title,
          fileName: brandDoc.originalFileName,
          chunkCount: chunkDocs.length,
          wordCount: extracted.wordCount,
        }
      );

      res.status(201).json({
        success: true,
        message: 'Document uploaded, text extracted, and embeddings indexed successfully.',
        data: brandDoc,
      });
    } catch (err: any) {
      console.error('[DocumentController] Processing failed:', err);
      brandDoc.processingStatus = 'FAILED';
      brandDoc.errorMessage = err.message;
      await brandDoc.save();

      res.status(500).json({
        success: false,
        message: `Failed to process document: ${err.message}`,
        data: brandDoc,
      });
    }
  }

  public static async listDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
    const documents = await BrandDocument.find({ organisationId: req.organisationId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Brand documents retrieved.',
      data: documents,
    });
  }

  public static async getDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const document = await BrandDocument.findOne({ _id: id, organisationId: req.organisationId })
      .populate('uploadedBy', 'name email');

    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return;
    }

    const chunks = await DocumentChunk.find({ documentId: document._id }).select('-embedding').sort({ chunkIndex: 1 });

    res.status(200).json({
      success: true,
      message: 'Document details retrieved.',
      data: {
        document,
        chunks,
      },
    });
  }

  public static async deleteDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const document = await BrandDocument.findOne({ _id: id, organisationId: req.organisationId });
    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return;
    }

    // Cascade delete chunks
    await DocumentChunk.deleteMany({ documentId: document._id });

    // Clean up physical file if it exists
    if (fs.existsSync(document.filePath)) {
      try {
        fs.unlinkSync(document.filePath);
      } catch (e) {
        console.warn('[DocumentController] Could not delete disk file:', document.filePath);
      }
    }

    await BrandDocument.deleteOne({ _id: document._id });

    await AuditService.log(
      req.organisationId!,
      req.user!.userId,
      req.user!.role,
      'DOCUMENT_DELETED',
      'BrandDocument',
      document._id.toString(),
      { title: document.title }
    );

    res.status(200).json({
      success: true,
      message: 'Document and semantic chunks deleted successfully.',
    });
  }
}
