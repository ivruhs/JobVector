import { GoogleGenerativeAI } from "@google/generative-ai";

class EmbeddingService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.modelName = "text-embedding-004";
    this.maxTokens = 2048; // Gemini text-embedding-004 supports up to 2048 tokens
    this.minChunkLength = 27; // Increased from 20
    this.embeddingDimension = 768; // Gemini text-embedding-004 produces 768-dimensional vectors
  }

  /**
   * Initialize the Gemini embedding model
   */
  async initialize() {
    if (!this.model) {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error(
          "GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required"
        );
      }

      console.log("Initializing Gemini embedding model...");
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: this.modelName });
      console.log("Gemini embedding model initialized successfully");
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
      const estimatedTokens = Math.ceil(words.length / 0.75); // Rough estimation

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
   * Improved vector validation function
   * @param {*} vector - Vector to validate
   * @returns {boolean} - Whether the vector is valid
   */
  isValidVector(vector) {
    // Check if it's an array
    if (!Array.isArray(vector)) {
      console.warn("⚠️ Vector is not an array:", typeof vector);
      return false;
    }

    // Check dimensions
    if (vector.length !== this.embeddingDimension) {
      console.warn(
        `⚠️ Vector has wrong dimensions: ${vector.length}, expected: ${this.embeddingDimension}`
      );
      return false;
    }

    // Check for invalid values - use more precise validation
    for (let i = 0; i < vector.length; i++) {
      const value = vector[i];

      // Check for null, undefined
      if (value === null || value === undefined) {
        console.warn(`⚠️ Vector contains null/undefined at index ${i}`);
        return false;
      }

      // Check for NaN
      if (Number.isNaN(value)) {
        console.warn(`⚠️ Vector contains NaN at index ${i}`);
        return false;
      }

      // Check if it's a valid number
      if (typeof value !== "number") {
        console.warn(
          `⚠️ Vector contains non-number at index ${i}: ${typeof value}`
        );
        return false;
      }

      // Check for infinity
      if (!Number.isFinite(value)) {
        console.warn(`⚠️ Vector contains infinite value at index ${i}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Generate embeddings using Gemini text-embedding-004
   * @param {Array} texts - Array of text strings
   * @returns {Array} - Array of embedding vectors
   */
  async generateEmbeddings(texts) {
    await this.initialize();

    if (!texts || texts.length === 0) {
      throw new Error("No texts provided for embedding generation");
    }

    const embeddings = [];
    const batchSize = 10; // Gemini can handle larger batches efficiently
    let processedCount = 0;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(texts.length / batchSize);

      console.log(
        `🔄 Processing batch ${batchNum}/${totalBatches} (${batch.length} texts)`
      );

      try {
        // Process batch - Gemini embedding API handles multiple texts
        const batchEmbeddings = await Promise.all(
          batch.map(async (text) => {
            if (!text || text.trim().length === 0) {
              console.warn("⚠️ Skipping empty text");
              return new Array(this.embeddingDimension).fill(0);
            }

            try {
              const result = await this.model.embedContent(text.trim());

              // Extract embedding values
              const embeddingValues = result.embedding.values;

              // Validate embedding values
              if (
                !Array.isArray(embeddingValues) ||
                embeddingValues.length !== this.embeddingDimension
              ) {
                console.warn(
                  `⚠️ Invalid embedding dimensions: expected ${this.embeddingDimension}, got ${embeddingValues?.length}`
                );
                console.warn(`   Text preview: "${text.substring(0, 50)}..."`);
                return new Array(this.embeddingDimension).fill(0);
              }

              // Convert to proper numbers and validate
              const cleanValues = embeddingValues.map((val, index) => {
                if (val === null || val === undefined) {
                  console.warn(`⚠️ Found null/undefined at index ${index}`);
                  return 0;
                }

                const numVal = Number(val);
                if (Number.isNaN(numVal)) {
                  console.warn(
                    `⚠️ Found NaN at index ${index}, original value: ${val}`
                  );
                  return 0;
                }

                if (!Number.isFinite(numVal)) {
                  console.warn(
                    `⚠️ Found infinite value at index ${index}: ${val}`
                  );
                  return 0;
                }

                return numVal;
              });

              // Normalize the vector
              const normalizedVector = this.normalizeVector(cleanValues);

              // Final validation
              if (!this.isValidVector(normalizedVector)) {
                console.warn(
                  "⚠️ Vector failed final validation, returning zero vector"
                );
                return new Array(this.embeddingDimension).fill(0);
              }

              return normalizedVector;
            } catch (error) {
              console.error(
                `❌ Failed to embed individual text:`,
                error.message
              );
              console.error(`   Text preview: "${text.substring(0, 100)}..."`);
              return new Array(this.embeddingDimension).fill(0);
            }
          })
        );

        embeddings.push(...batchEmbeddings);
        processedCount += batch.length;

        console.log(
          `✅ Batch ${batchNum} completed (${processedCount}/${texts.length} total)`
        );

        // Add a small delay to respect rate limits
        if (batchNum < totalBatches) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`❌ Batch ${batchNum} failed:`, error.message);

        // Fallback to individual processing
        for (let j = 0; j < batch.length; j++) {
          const text = batch[j];
          try {
            if (!text || text.trim().length === 0) {
              console.warn("⚠️ Skipping empty text in batch fallback");
              embeddings.push(new Array(this.embeddingDimension).fill(0));
              continue;
            }

            const result = await this.model.embedContent(text.trim());
            const embeddingValues = result.embedding.values;

            // Validate and clean embedding values
            if (
              !Array.isArray(embeddingValues) ||
              embeddingValues.length !== this.embeddingDimension
            ) {
              console.warn(
                `⚠️ Invalid embedding in fallback for text: "${text.substring(
                  0,
                  50
                )}..."`
              );
              embeddings.push(new Array(this.embeddingDimension).fill(0));
            } else {
              // Convert to array and clean values
              const cleanValues = embeddingValues.map((val) => {
                if (val === null || val === undefined) return 0;
                const numVal = Number(val);
                return Number.isNaN(numVal) || !Number.isFinite(numVal)
                  ? 0
                  : numVal;
              });

              const normalizedVector = this.normalizeVector(cleanValues);
              embeddings.push(
                this.isValidVector(normalizedVector)
                  ? normalizedVector
                  : new Array(this.embeddingDimension).fill(0)
              );
            }

            processedCount++;
          } catch (singleError) {
            console.error(
              `❌ Failed to embed text ${i + j} in fallback:`,
              singleError.message
            );
            console.error(`   Text preview: "${text.substring(0, 100)}..."`);

            // Create a zero vector as fallback
            embeddings.push(new Array(this.embeddingDimension).fill(0));
            processedCount++;
          }
        }
      }
    }

    // Final validation of all embeddings
    const validatedEmbeddings = embeddings.map((embedding, index) => {
      if (!this.isValidVector(embedding)) {
        console.error(
          `❌ Invalid embedding at index ${index}, replacing with zero vector`
        );
        return new Array(this.embeddingDimension).fill(0);
      }
      return embedding;
    });

    console.log(
      `✅ Generated ${validatedEmbeddings.length} embeddings (${processedCount} processed)`
    );

    return validatedEmbeddings;
  }

  /**
   * Enhanced L2 normalization with validation
   * @param {Array} vector - Input vector
   * @returns {Array} - Normalized vector
   */
  normalizeVector(vector) {
    if (!Array.isArray(vector) || vector.length !== this.embeddingDimension) {
      console.warn(
        "⚠️ Invalid vector for normalization:",
        vector?.length || "undefined"
      );
      return new Array(this.embeddingDimension).fill(0);
    }

    // Ensure all values are valid numbers
    const cleanVector = vector.map((val) => {
      if (val === null || val === undefined) return 0;
      const numVal = Number(val);
      return Number.isNaN(numVal) || !Number.isFinite(numVal) ? 0 : numVal;
    });

    const magnitude = Math.sqrt(
      cleanVector.reduce((sum, val) => sum + val * val, 0)
    );

    if (magnitude === 0) {
      console.warn("⚠️ Zero magnitude vector encountered");
      return cleanVector; // Return the clean vector even if magnitude is 0
    }

    const normalized = cleanVector.map((val) => val / magnitude);

    // Validate normalization result
    if (!this.isValidVector(normalized)) {
      console.error("❌ Normalization produced invalid values");
      return new Array(this.embeddingDimension).fill(0);
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
        const embedding = embeddings[embeddingIndex];

        // Validate each embedding before adding to chunk
        if (!this.isValidVector(embedding)) {
          console.error(`❌ Invalid embedding for chunk ${chunk.id}, skipping`);
          embeddingIndex++;
          continue;
        }

        chunksWithEmbeddings.push({
          ...chunk,
          vector: embedding,
          embeddingQuality: this.assessEmbeddingQuality(embedding),
        });
        embeddingIndex++;
      }
    }

    console.log(
      `✅ Embedding generation completed: ${chunksWithEmbeddings.length} chunks with valid embeddings`
    );

    if (chunksWithEmbeddings.length > 0) {
      console.log(
        `📊 Sample embedding stats: length=${chunksWithEmbeddings[0].vector.length}, quality=${chunksWithEmbeddings[0].embeddingQuality}`
      );
    }

    return chunksWithEmbeddings;
  }

  /**
   * Assess the quality of an embedding vector
   * @param {Array} vector - Embedding vector
   * @returns {string} - Quality assessment
   */
  assessEmbeddingQuality(vector) {
    if (!this.isValidVector(vector)) return "invalid";

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
    if (!this.isValidVector(vectorA) || !this.isValidVector(vectorB)) {
      console.warn("⚠️ Invalid vectors for similarity calculation");
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

  /**
   * Generate embedding for a single query (useful for search)
   * @param {string} query - Query text
   * @returns {Array} - Embedding vector
   */
  async generateQueryEmbedding(query) {
    const embeddings = await this.generateEmbeddings([query]);
    return embeddings[0];
  }
}

export default new EmbeddingService();
