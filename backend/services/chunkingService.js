class ChunkingService {
  constructor() {
    this.minChunkSize = 800;
    this.maxChunkSize = 1500;
    this.targetChunkSize = 1200;
  }

  chunkText(text) {
    if (!text) return [];

    const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
    if (paragraphs.length === 0) return [];

    const chunks = [];
    let currentChunk = '';
    let currentWordCount = 0;
    let chunkId = 1;

    for (const paragraph of paragraphs) {
      const paragraphWordCount = this.countWords(paragraph);

      if (currentWordCount + paragraphWordCount > this.maxChunkSize && currentWordCount >= this.minChunkSize) {
        chunks.push({
          chunkId: chunkId++,
          text: currentChunk.trim(),
          wordCount: currentWordCount
        });
        currentChunk = '';
        currentWordCount = 0;
      }

      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      currentWordCount += paragraphWordCount;

      if (currentWordCount >= this.targetChunkSize) {
        chunks.push({
          chunkId: chunkId++,
          text: currentChunk.trim(),
          wordCount: currentWordCount
        });
        currentChunk = '';
        currentWordCount = 0;
      }
    }

    if (currentChunk.trim().length > 0 && currentWordCount >= this.minChunkSize / 2) {
      chunks.push({
        chunkId: chunkId++,
        text: currentChunk.trim(),
        wordCount: currentWordCount
      });
    }

    return chunks;
  }

  chunkMultipleDocuments(documents) {
    const allChunks = [];
    let globalChunkId = 1;

    for (const doc of documents) {
      const chunks = this.chunkText(doc.text);
      for (const chunk of chunks) {
        allChunks.push({
          chunkId: globalChunkId++,
          source: doc.source || doc.fileName || 'unknown',
          text: chunk.text,
          wordCount: chunk.wordCount
        });
      }
    }

    return allChunks;
  }

  countWords(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
}

module.exports = new ChunkingService();
