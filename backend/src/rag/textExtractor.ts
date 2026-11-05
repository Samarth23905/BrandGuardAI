import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export interface ExtractedDocumentContent {
  rawText: string;
  cleanedText: string;
  pageCount?: number;
  wordCount: number;
}

export class TextExtractor {
  public static async extract(filePath: string, mimeType?: string): Promise<ExtractedDocumentContent> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const ext = path.extname(filePath).toLowerCase();
    let rawText = '';
    let pageCount: number | undefined;

    if (ext === '.pdf' || mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      rawText = pdfData.text;
      pageCount = pdfData.numpages;
    } else if (
      ext === '.docx' ||
      ext === '.doc' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      rawText = result.value;
    } else if (ext === '.txt' || mimeType === 'text/plain') {
      rawText = fs.readFileSync(filePath, 'utf-8');
    } else {
      throw new Error(`Unsupported document extension for text extraction: ${ext}`);
    }

    const cleanedText = this.cleanText(rawText);
    const wordCount = cleanedText.trim().split(/\s+/).filter(Boolean).length;

    return {
      rawText,
      cleanedText,
      pageCount,
      wordCount,
    };
  }

  public static cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\t\f\v]/g, ' ')
      .replace(/[ ]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
