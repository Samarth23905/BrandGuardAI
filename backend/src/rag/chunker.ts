export interface ChunkResult {
  chunkIndex: number;
  text: string;
  tokenCount: number;
  estimatedCharLength: number;
}

export class TextChunker {
  private maxChunkLength: number;
  private chunkOverlap: number;

  constructor(maxChunkLength = 600, chunkOverlap = 100) {
    this.maxChunkLength = maxChunkLength;
    this.chunkOverlap = chunkOverlap;
  }

  public chunk(text: string): ChunkResult[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const cleaned = text.trim();
    if (cleaned.length <= this.maxChunkLength) {
      return [
        {
          chunkIndex: 0,
          text: cleaned,
          tokenCount: Math.ceil(cleaned.length / 4),
          estimatedCharLength: cleaned.length,
        },
      ];
    }

    const paragraphs = cleaned.split(/\n\s*\n/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      const trimmedPara = paragraph.trim();
      if (!trimmedPara) continue;

      if ((currentChunk + '\n\n' + trimmedPara).trim().length <= this.maxChunkLength) {
        currentChunk = currentChunk ? `${currentChunk}\n\n${trimmedPara}` : trimmedPara;
      } else {
        // If the paragraph itself exceeds maxChunkLength, split by sentences
        if (trimmedPara.length > this.maxChunkLength) {
          const sentences = trimmedPara.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [trimmedPara];
          for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (!trimmedSentence) continue;

            if ((currentChunk + ' ' + trimmedSentence).trim().length <= this.maxChunkLength) {
              currentChunk = currentChunk ? `${currentChunk} ${trimmedSentence}` : trimmedSentence;
            } else {
              if (currentChunk) {
                chunks.push(currentChunk.trim());
                // apply overlap from end of currentChunk
                const overlapText = currentChunk.slice(-this.chunkOverlap);
                currentChunk = `${overlapText} ${trimmedSentence}`;
              } else {
                chunks.push(trimmedSentence);
              }
            }
          }
        } else {
          if (currentChunk) {
            chunks.push(currentChunk.trim());
            const overlapText = currentChunk.slice(-this.chunkOverlap);
            currentChunk = `${overlapText}\n\n${trimmedPara}`;
          } else {
            chunks.push(trimmedPara);
          }
        }
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks.map((chunkText, idx) => ({
      chunkIndex: idx,
      text: chunkText,
      tokenCount: Math.ceil(chunkText.length / 4),
      estimatedCharLength: chunkText.length,
    }));
  }
}
