import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Toggle debug mode
const DEBUG = true;

class SimilarityService {
  static CHUNK_WEIGHTS = {
    AboutCompany: 0.02,
    RoleOverview: 0.05,
    Responsibilities: 0.25,
    ExperienceRequirement: 0.15,
    RequiredSkills: 0.35,
    PreferredSkills: 0.1,
    EducationRequirement: 0.05,
    Benefits: 0.0,
    Location: 0.0,
    Other: 0.0,
  };

  static TOP_K = 3;

  static cosineSimilarity(vecA, vecB) {
    if (!Array.isArray(vecA) || !Array.isArray(vecB)) {
      throw new Error("Vectors must be arrays");
    }

    if (vecA.length !== vecB.length) {
      throw new Error("Vectors must have the same length");
    }

    let dotProduct = 0,
      normA = 0,
      normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  static async getJDChunks(jdId) {
    const { data, error } = await supabase
      .from("jd_embeddings")
      .select("chunk_id, chunk_type, chunk_text, embedding")
      .eq("jd_id", jdId)
      .order("chunk_order");

    if (error) {
      throw new Error(`Failed to fetch JD chunks: ${error.message}`);
    }

    return data.map((chunk) => ({
      ...chunk,
      embedding:
        typeof chunk.embedding === "string"
          ? JSON.parse(chunk.embedding)
          : chunk.embedding,
    }));
  }

  static async getResumeChunks(resumeId) {
    const { data, error } = await supabase
      .from("resume_embeddings")
      .select("chunk_id, chunk_type, chunk_text, embedding")
      .eq("resume_id", resumeId)
      .order("chunk_order");

    if (error) {
      throw new Error(`Failed to fetch resume chunks: ${error.message}`);
    }

    return data.map((chunk) => ({
      ...chunk,
      embedding:
        typeof chunk.embedding === "string"
          ? JSON.parse(chunk.embedding)
          : chunk.embedding,
    }));
  }

  static findTopKSimilarities(jdEmbedding, resumeChunks, k = this.TOP_K) {
    if (!Array.isArray(jdEmbedding) || typeof jdEmbedding[0] !== "number") {
      console.log("❌ JD embedding is not a valid number array:", jdEmbedding);
      return [];
    }

    const similarities = resumeChunks.map((resumeChunk) => {
      if (
        !Array.isArray(resumeChunk.embedding) ||
        typeof resumeChunk.embedding[0] !== "number"
      ) {
        console.log("❌ Resume chunk invalid embedding:", resumeChunk.chunk_id);
        return { similarity: 0, chunk: resumeChunk };
      }

      return {
        similarity: this.cosineSimilarity(jdEmbedding, resumeChunk.embedding),
        chunk: resumeChunk,
      };
    });

    const topK = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k)
      .map((item) => item.similarity);

    if (DEBUG) {
      console.log("🔝 Top-k Similarities:", topK);
    }

    return topK;
  }

  static calculateChunkMatchScore(topKSimilarities) {
    if (topKSimilarities.length === 0) return 0;
    const sum = topKSimilarities.reduce((acc, sim) => acc + sim, 0);
    return sum / topKSimilarities.length;
  }

  /**
   * Calculate semantic similarity score between JD and Resume
   */
  static async calculateSemanticScore(jdId, resumeId) {
    try {
      const [jdChunks, resumeChunks] = await Promise.all([
        this.getJDChunks(jdId),
        this.getResumeChunks(resumeId),
      ]);

      if (!jdChunks.length || !resumeChunks.length) {
        throw new Error("No JD or Resume chunks found.");
      }

      let weightedScoreSum = 0;
      let totalWeight = 0;

      for (const jdChunk of jdChunks) {
        if (!jdChunk.embedding) {
          console.log(
            `⚠️ Skipping JD chunk ${jdChunk.chunk_id} due to missing embedding`
          );
          continue;
        }

        if (jdChunk.chunk_text.length < 30) {
          console.log(`⚠️ Skipping short chunk: ${jdChunk.chunk_type}`);
          continue;
        }

        if (DEBUG) {
          console.log(
            `📦 JD Chunk ${jdChunk.chunk_id} | Type: ${jdChunk.chunk_type}`
          );
        }

        const topKSimilarities = this.findTopKSimilarities(
          jdChunk.embedding,
          resumeChunks.filter((rc) => rc.embedding)
        );

        // Pure cosine similarity score without artificial boosting
        const chunkMatchScore = this.calculateChunkMatchScore(topKSimilarities);
        const weight = this.CHUNK_WEIGHTS[jdChunk.chunk_type] || 0.01;

        weightedScoreSum += chunkMatchScore * weight;
        totalWeight += weight;

        if (DEBUG) {
          console.log(
            `   Chunk Score: ${chunkMatchScore.toFixed(3)}, Weight: ${weight}`
          );
        }
      }

      // Calculate final score as a percentage
      let semanticScore =
        totalWeight > 0 ? (weightedScoreSum / totalWeight) * 100 : 0;

      // Clamp score between 0 and 100
      semanticScore = Math.round(Math.min(Math.max(semanticScore, 0), 100));

      if (DEBUG) {
        console.log("\n📊 SCORING SUMMARY:");
        console.log("✅ Total Weighted Score:", weightedScoreSum.toFixed(4));
        console.log("✅ Total Weight:", totalWeight.toFixed(4));
        console.log("🎯 Final Semantic Score:", semanticScore);
      }

      return semanticScore;
    } catch (err) {
      console.error("🚨 Error in calculateSemanticScore:", err);
      throw err;
    }
  }
}

export default SimilarityService;
