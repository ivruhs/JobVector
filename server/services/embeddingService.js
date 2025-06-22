// EmbeddingService.js
import { env } from "@xenova/transformers";

// ⚙️ Configure Xenova ONNX WebAssembly backend
env.backends.onnx.wasm.numThreads = 1;

import { pipeline } from "@xenova/transformers";

class EmbeddingService {
  constructor() {
    this.model = null;
    this.modelName = "Xenova/all-MiniLM-L6-v2";
    this.maxTokens = 512;
    this.minChunkLength = 27; // Increased from 20
  }

  /**
   * Initialize the embedding model
   */
  async initialize() {
    if (!this.model) {
      console.log("Loading embedding model...");
      this.model = await pipeline("feature-extraction", this.modelName);
      console.log("Embedding model loaded successfully");
    }
  }

  /**
   * Smart text splitting that preserves semantic meaning
   * @param {string} text - Text to split
   * @param {number} maxWords - Maximum words per chunk
   * @returns {Array} - Array of text chunks
   */
  smartTextSplit(text, maxWords) {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const chunks = [];
    let currentChunk = "";
    let currentWordCount = 0;

    for (const sentence of sentences) {
      const sentenceWords = sentence.trim().split(/\s+/);
      const sentenceWordCount = sentenceWords.length;

      // If adding this sentence would exceed maxWords, start new chunk
      if (
        currentWordCount + sentenceWordCount > maxWords &&
        currentChunk.trim()
      ) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence.trim();
        currentWordCount = sentenceWordCount;
      } else {
        currentChunk += (currentChunk ? ". " : "") + sentence.trim();
        currentWordCount += sentenceWordCount;
      }
    }

    // Add the last chunk if it exists
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    // If no sentence splits worked (no punctuation), fall back to word splitting
    if (chunks.length === 0) {
      const words = text.split(/\s+/);
      for (let i = 0; i < words.length; i += maxWords) {
        const chunk = words.slice(i, i + maxWords).join(" ");
        if (chunk.trim()) {
          chunks.push(chunk.trim());
        }
      }
    }

    return chunks;
  }

  /**
   * Enhanced chunk preprocessing with semantic-aware splitting
   * @param {Array} chunks - Array of chunk objects
   * @returns {Array} - Processed chunks within token limits
   */
  preprocessChunks(chunks) {
    const processedChunks = [];

    for (const chunk of chunks) {
      const text = chunk.text.trim();

      // Skip very short chunks as they provide poor embeddings
      if (text.length < this.minChunkLength) {
        console.log(
          `⚠️ Skipping very short chunk (${text.length} chars): ${chunk.type}`
        );
        continue;
      }

      const words = text.split(/\s+/);
      const estimatedTokens = Math.ceil(words.length / 0.75);

      if (estimatedTokens <= this.maxTokens) {
        processedChunks.push(chunk);
      } else {
        console.log(
          `📝 Splitting large chunk: ${chunk.type} (${words.length} words)`
        );

        const maxWords = Math.floor(this.maxTokens * 0.75);
        const subChunkTexts = this.smartTextSplit(text, maxWords);

        for (let i = 0; i < subChunkTexts.length; i++) {
          const subChunkText = subChunkTexts[i];

          // Only include sub-chunks that meet minimum length
          if (subChunkText.length >= this.minChunkLength) {
            processedChunks.push({
              ...chunk,
              id: `${chunk.id}_${i}`,
              text: subChunkText,
              wordCount: subChunkText.split(/\s+/).length,
              length: subChunkText.length,
              isSubChunk: true,
              parentId: chunk.id,
              subChunkIndex: i,
            });
          }
        }
      }
    }

    console.log(
      `📊 Preprocessing: ${chunks.length} → ${processedChunks.length} chunks`
    );
    return processedChunks;
  }

  /**
   * Enhanced embedding generation with better error handling
   * @param {Array} texts - Array of text strings
   * @returns {Array} - Array of embedding vectors
   */
  async generateEmbeddings(texts) {
    await this.initialize();

    if (!texts || texts.length === 0) {
      throw new Error("No texts provided for embedding generation");
    }

    const embeddings = [];
    const batchSize = 5;
    let processedCount = 0;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(texts.length / batchSize);

      console.log(
        `🔄 Processing batch ${batchNum}/${totalBatches} (${batch.length} texts)`
      );

      try {
        const batchEmbeddings = await this.model(batch, {
          pooling: "mean",
          normalize: true,
        });

        if (batchEmbeddings?.data && batchEmbeddings?.dims) {
          const data = batchEmbeddings.data;
          const dims = batchEmbeddings.dims;

          if (dims.length === 2) {
            // Batch of embeddings: [batch_size, dim]
            const [batchSize, dim] = dims;
            for (let j = 0; j < batchSize; j++) {
              const start = j * dim;
              const end = start + dim;
              const vector = Array.from(data.slice(start, end));
              embeddings.push(this.normalizeVector(vector));
              processedCount++;
            }
          } else if (dims.length === 1) {
            // Single embedding: [dim]
            const vector = Array.from(data);
            embeddings.push(this.normalizeVector(vector));
            processedCount++;
          } else {
            throw new Error(
              `Unexpected embedding dimensions: ${JSON.stringify(dims)}`
            );
          }
        } else {
          throw new Error("Embedding output missing `.data` or `.dims`");
        }

        console.log(
          `✅ Batch ${batchNum} completed (${processedCount}/${texts.length} total)`
        );
      } catch (error) {
        console.error(
          `❌ Batch ${batchNum} failed, processing individually:`,
          error.message
        );

        // Fallback to individual processing
        for (let j = 0; j < batch.length; j++) {
          const text = batch[j];
          try {
            if (!text || text.trim().length === 0) {
              console.warn("⚠️ Skipping empty text in batch fallback");
              continue;
            }

            const single = await this.model(text, {
              pooling: "mean",
              normalize: true,
            });

            if (single?.data && single?.dims) {
              const vector = Array.from(single.data);
              embeddings.push(this.normalizeVector(vector));
              processedCount++;
            } else {
              throw new Error("Invalid embedding format for single text");
            }
          } catch (singleError) {
            console.error(
              `❌ Failed to embed text ${i + j}:`,
              singleError.message
            );
            console.error(`   Text preview: "${text.substring(0, 100)}..."`);

            // Create a zero vector as fallback (will have zero similarity)
            const zeroVector = new Array(384).fill(0); // all-MiniLM-L6-v2 has 384 dimensions
            embeddings.push(zeroVector);
            processedCount++;
          }
        }
      }
    }

    console.log(
      `✅ Generated ${embeddings.length} embeddings (${processedCount} processed)`
    );

    // Validate all embeddings
    const validEmbeddings = embeddings.filter((emb) => {
      return (
        Array.isArray(emb) && emb.length > 0 && emb.some((val) => val !== 0)
      );
    });

    if (validEmbeddings.length < embeddings.length * 0.5) {
      console.warn(
        `⚠️ Many embeddings failed: ${validEmbeddings.length}/${embeddings.length} valid`
      );
    }

    return embeddings;
  }

  /**
   * Enhanced L2 normalization with validation
   * @param {Array} vector - Input vector
   * @returns {Array} - Normalized vector
   */
  normalizeVector(vector) {
    if (!Array.isArray(vector) || vector.length === 0) {
      console.warn("⚠️ Invalid vector for normalization:", vector);
      return new Array(384).fill(0);
    }

    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );

    if (magnitude === 0) {
      console.warn("⚠️ Zero magnitude vector encountered");
      return vector;
    }

    const normalized = vector.map((val) => val / magnitude);

    // Validate normalization
    const newMagnitude = Math.sqrt(
      normalized.reduce((sum, val) => sum + val * val, 0)
    );
    if (Math.abs(newMagnitude - 1.0) > 0.001) {
      console.warn(`⚠️ Normalization failed: magnitude = ${newMagnitude}`);
    }

    return normalized;
  }

  /**
   * Enhanced chunk processing with quality checks
   * @param {Array} chunks - Array of chunk objects with { id, type, text }
   * @returns {Array} - Chunks augmented with vector property
   */
  async processChunks(chunks) {
    console.log(
      `🚀 Processing ${chunks.length} chunks for embedding generation...`
    );

    if (!chunks || chunks.length === 0) {
      throw new Error("No chunks provided for processing");
    }

    // Validate chunk structure
    const validChunks = chunks.filter((chunk) => {
      if (
        !chunk.text ||
        typeof chunk.text !== "string" ||
        chunk.text.trim().length === 0
      ) {
        console.warn(`⚠️ Skipping invalid chunk:`, chunk.id || "unknown");
        return false;
      }
      return true;
    });

    if (validChunks.length === 0) {
      throw new Error("No valid chunks found after validation");
    }

    console.log(`📋 Valid chunks: ${validChunks.length}/${chunks.length}`);

    // Preprocess chunks to handle token limits and quality
    const processedChunks = this.preprocessChunks(validChunks);

    if (processedChunks.length === 0) {
      throw new Error("No chunks remain after preprocessing");
    }

    console.log(`🔧 After preprocessing: ${processedChunks.length} chunks`);

    // Extract and validate texts
    const texts = processedChunks.map((chunk) => chunk.text.trim());
    const validTexts = texts.filter(
      (text) => text.length >= this.minChunkLength
    );

    if (validTexts.length !== texts.length) {
      console.warn(
        `⚠️ Some texts too short: ${validTexts.length}/${texts.length} valid`
      );
    }

    // Generate embeddings
    const embeddings = await this.generateEmbeddings(validTexts);

    // Validate embedding count
    if (embeddings.length !== validTexts.length) {
      console.error(
        `❌ Embedding count mismatch: ${validTexts.length} texts, ${embeddings.length} embeddings`
      );
      throw new Error("Embedding generation failed: count mismatch");
    }

    // Create mapping for chunks that had valid texts
    const chunksWithEmbeddings = [];
    let embeddingIndex = 0;

    for (const chunk of processedChunks) {
      if (chunk.text.trim().length >= this.minChunkLength) {
        chunksWithEmbeddings.push({
          ...chunk,
          vector: embeddings[embeddingIndex],
          embeddingQuality: this.assessEmbeddingQuality(
            embeddings[embeddingIndex]
          ),
        });
        embeddingIndex++;
      }
    }

    console.log(
      `✅ Embedding generation completed: ${chunksWithEmbeddings.length} chunks with embeddings`
    );
    console.log(
      `📊 Sample embedding stats: length=${embeddings[0]?.length}, quality=${chunksWithEmbeddings[0]?.embeddingQuality}`
    );

    return chunksWithEmbeddings;
  }

  /**
   * Assess the quality of an embedding vector
   * @param {Array} vector - Embedding vector
   * @returns {string} - Quality assessment
   */
  assessEmbeddingQuality(vector) {
    if (!Array.isArray(vector) || vector.length === 0) return "invalid";

    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );
    const variance =
      vector.reduce((sum, val) => sum + val * val, 0) / vector.length;
    const zeroCount = vector.filter((val) => val === 0).length;

    if (zeroCount > vector.length * 0.9) return "poor";
    if (magnitude < 0.1) return "weak";
    if (variance < 0.01) return "low_variance";

    return "good";
  }

  /**
   * Calculate cosine similarity between two vectors with validation
   * @param {Array} vectorA - First vector
   * @param {Array} vectorB - Second vector
   * @returns {number} - Cosine similarity score
   */
  calculateCosineSimilarity(vectorA, vectorB) {
    if (!Array.isArray(vectorA) || !Array.isArray(vectorB)) {
      console.warn("⚠️ Invalid vectors for similarity calculation");
      return 0;
    }

    if (vectorA.length !== vectorB.length) {
      console.warn(
        `⚠️ Vector length mismatch: ${vectorA.length} vs ${vectorB.length}`
      );
      return 0;
    }

    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
      console.warn("⚠️ Zero magnitude vector in similarity calculation");
      return 0;
    }

    const similarity = dotProduct / (magnitudeA * magnitudeB);

    // Clamp to valid range
    return Math.max(-1, Math.min(1, similarity));
  }
}

export default new EmbeddingService();
