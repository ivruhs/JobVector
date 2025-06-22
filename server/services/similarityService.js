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
    RequiredSkills: 0.35, // Increased from 0.3
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

    console.log("🔝 Top-k Similarities:", topK);
    return topK;
  }

  static calculateChunkMatchScore(topKSimilarities) {
    if (topKSimilarities.length === 0) return 0;
    const sum = topKSimilarities.reduce((acc, sim) => acc + sim, 0);
    return sum / topKSimilarities.length;
  }

  // Enhanced skill matching with better keyword extraction
  static extractSkills(text) {
    const commonSkills = [
      "javascript",
      "js",
      "react",
      "reactjs",
      "react.js",
      "node",
      "nodejs",
      "node.js",
      "express",
      "expressjs",
      "express.js",
      "mongodb",
      "postgresql",
      "postgres",
      "mysql",
      "html",
      "html5",
      "css",
      "css3",
      "typescript",
      "ts",
      "python",
      "java",
      "docker",
      "git",
      "github",
      "gitlab",
      "aws",
      "azure",
      "gcp",
      "firebase",
      "jwt",
      "oauth",
      "rest",
      "api",
      "graphql",
      "redux",
      "nextjs",
      "next.js",
      "vue",
      "angular",
      "nestjs",
      "django",
      "flask",
      "redis",
      "elasticsearch",
      "kubernetes",
      "jenkins",
      "ci/cd",
      "devops",
      "linux",
      "nginx",
      "apache",
      "microservices",
      "tailwind",
      "bootstrap",
      "sass",
      "less",
      "webpack",
      "babel",
      "jest",
      "mocha",
      "cypress",
      "selenium",
      "postman",
      "figma",
      "sketch",
      "photoshop",
    ];

    const normalizedText = text
      .toLowerCase()
      .replace(/[^\w\s+#.-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const foundSkills = commonSkills.filter((skill) => {
      const skillPattern = new RegExp(
        `\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`
      );
      return skillPattern.test(normalizedText);
    });

    return [...new Set(foundSkills)]; // Remove duplicates
  }

  // Enhanced experience matching
  static analyzeExperience(jdText, resumeChunks) {
    const jdExpMatch = jdText.match(/(\d+)\+?\s*years?/i);
    if (!jdExpMatch) return { match: true, score: 1.0 };

    const requiredYears = parseInt(jdExpMatch[1]);

    // Extract experience from resume
    const experienceChunks = resumeChunks.filter(
      (chunk) =>
        chunk.chunk_type === "Experience" || chunk.chunk_type === "Summary"
    );

    let candidateYears = 0;
    for (const chunk of experienceChunks) {
      const expMatches = chunk.chunk_text.match(/(\d+)\+?\s*years?/gi);
      if (expMatches) {
        candidateYears = Math.max(
          candidateYears,
          ...expMatches.map((m) => parseInt(m))
        );
      }

      // Try to extract from date ranges (e.g., "Jan 2021 – Present")
      const dateRanges = chunk.chunk_text.match(
        /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*[–-]\s*(Present|\w+\s+\d{4})/gi
      );
      if (dateRanges) {
        for (const range of dateRanges) {
          const startYear = parseInt(range.match(/\d{4}/)[0]);
          const currentYear = new Date().getFullYear();
          const yearsExp = currentYear - startYear;
          candidateYears = Math.max(candidateYears, yearsExp);
        }
      }
    }

    const match = candidateYears >= requiredYears;
    const score = match
      ? Math.min(1.2, candidateYears / requiredYears)
      : candidateYears / requiredYears;

    console.log(
      `📊 Experience: Required ${requiredYears}+ years, Candidate has ${candidateYears} years, Score: ${score.toFixed(
        2
      )}`
    );
    return { match, score };
  }

  /**
   * Enhanced semantic similarity calculation with better skill matching
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
      let perfectMatches = 0;
      let totalChunks = 0;

      for (const jdChunk of jdChunks) {
        if (!jdChunk.embedding) {
          console.log(
            `⚠️ Skipping JD chunk ${jdChunk.chunk_id} due to missing embedding`
          );
          continue;
        }

        if (jdChunk.chunk_text.length < 30) {
          // Reduced from 50
          console.log(`⚠️ Skipping short chunk: ${jdChunk.chunk_type}`);
          continue;
        }

        console.log(
          `📦 JD Chunk ${jdChunk.chunk_id} | Type: ${jdChunk.chunk_type}`
        );

        const topKSimilarities = this.findTopKSimilarities(
          jdChunk.embedding,
          resumeChunks.filter((rc) => rc.embedding)
        );

        // Base similarity score (more generous weighting)
        let chunkMatchScore =
          0.7 * Math.max(...topKSimilarities) +
          0.3 *
            (topKSimilarities.reduce((a, b) => a + b, 0) /
              topKSimilarities.length);

        let weight = this.CHUNK_WEIGHTS[jdChunk.chunk_type] || 0.01;

        // Enhanced skill matching for RequiredSkills
        if (jdChunk.chunk_type === "RequiredSkills") {
          const jdSkills = this.extractSkills(jdChunk.chunk_text);
          const resumeSkillsChunks = resumeChunks.filter(
            (rc) =>
              rc.chunk_type === "Skills" ||
              rc.chunk_type === "Experience" ||
              rc.chunk_type === "Summary"
          );

          const resumeSkillsText = resumeSkillsChunks
            .map((rc) => rc.chunk_text)
            .join(" ");
          const resumeSkills = this.extractSkills(resumeSkillsText);

          const matchedSkills = jdSkills.filter((skill) =>
            resumeSkills.includes(skill)
          );
          const skillMatchRatio =
            jdSkills.length > 0 ? matchedSkills.length / jdSkills.length : 0;

          console.log(`🔍 Skills Analysis:`);
          console.log(`   JD Skills (${jdSkills.length}):`, jdSkills);
          console.log(
            `   Resume Skills (${resumeSkills.length}):`,
            resumeSkills
          );
          console.log(
            `   Matched Skills (${matchedSkills.length}):`,
            matchedSkills
          );
          console.log(`   Match Ratio: ${(skillMatchRatio * 100).toFixed(1)}%`);

          // Significant boost for high skill overlap
          if (skillMatchRatio >= 0.8) {
            console.log("🚀 Excellent skill match! Major boost applied.");
            chunkMatchScore = Math.min(0.95, chunkMatchScore + 0.25);
            perfectMatches++;
          } else if (skillMatchRatio >= 0.6) {
            console.log("✨ Good skill match! Boost applied.");
            chunkMatchScore = Math.min(0.9, chunkMatchScore + 0.15);
          } else if (skillMatchRatio >= 0.4) {
            console.log("👍 Decent skill match! Small boost applied.");
            chunkMatchScore = Math.min(0.85, chunkMatchScore + 0.08);
          }
        }

        // Enhanced experience matching
        if (jdChunk.chunk_type === "ExperienceRequirement") {
          const expAnalysis = this.analyzeExperience(
            jdChunk.chunk_text,
            resumeChunks
          );
          if (expAnalysis.match) {
            console.log("✅ Experience requirement met! Boost applied.");
            chunkMatchScore = Math.min(
              0.95,
              chunkMatchScore * Math.min(1.3, expAnalysis.score)
            );
            if (expAnalysis.score >= 1.2) perfectMatches++;
          } else {
            console.log("⚠️ Experience below requirement. Penalty applied.");
            chunkMatchScore *= 0.7;
          }
        }

        // Role/Position matching boost
        if (
          jdChunk.chunk_type === "RoleOverview" ||
          jdChunk.chunk_type === "Responsibilities"
        ) {
          const resumeSummary = resumeChunks.find(
            (rc) => rc.chunk_type === "Summary" || rc.chunk_type === "Header"
          );
          if (resumeSummary) {
            const jdRole = jdChunk.chunk_text.toLowerCase();
            const resumeRole = resumeSummary.chunk_text.toLowerCase();

            if (
              (jdRole.includes("full stack") &&
                resumeRole.includes("full stack")) ||
              (jdRole.includes("frontend") &&
                resumeRole.includes("frontend")) ||
              (jdRole.includes("backend") && resumeRole.includes("backend")) ||
              (jdRole.includes("developer") && resumeRole.includes("developer"))
            ) {
              console.log("🎯 Role alignment detected! Boost applied.");
              chunkMatchScore = Math.min(0.92, chunkMatchScore + 0.1);
            }
          }
        }

        // Track perfect matches
        if (chunkMatchScore >= 0.85) {
          perfectMatches++;
        }
        totalChunks++;

        weightedScoreSum += chunkMatchScore * weight;
        totalWeight += weight;

        console.log(
          `   Chunk Score: ${chunkMatchScore.toFixed(3)}, Weight: ${weight}`
        );
      }

      // Calculate base score
      let semanticScore =
        totalWeight > 0 ? (weightedScoreSum / totalWeight) * 100 : 0;

      // Apply global bonuses for exceptional matches
      const perfectMatchRatio =
        totalChunks > 0 ? perfectMatches / totalChunks : 0;
      if (perfectMatchRatio >= 0.6) {
        console.log(
          `🏆 Exceptional match! ${(perfectMatchRatio * 100).toFixed(
            1
          )}% perfect chunks. Global bonus applied.`
        );
        semanticScore = Math.min(95, semanticScore + 8);
      } else if (perfectMatchRatio >= 0.4) {
        console.log(
          `⭐ Great match! ${(perfectMatchRatio * 100).toFixed(
            1
          )}% perfect chunks. Bonus applied.`
        );
        semanticScore = Math.min(90, semanticScore + 5);
      }

      // Final score clamping and rounding
      semanticScore = Math.round(Math.min(Math.max(semanticScore, 0), 100));

      if (DEBUG) {
        console.log("\n📊 SCORING SUMMARY:");
        console.log("✅ Total Weighted Score:", weightedScoreSum.toFixed(4));
        console.log("✅ Total Weight:", totalWeight.toFixed(4));
        console.log(
          "🎯 Perfect Matches:",
          `${perfectMatches}/${totalChunks} (${(
            perfectMatchRatio * 100
          ).toFixed(1)}%)`
        );
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
