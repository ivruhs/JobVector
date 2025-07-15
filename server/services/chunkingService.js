/**
 * LLM-Powered Chunking Service
 *
 * Purpose: Break raw text into semantically meaningful chunks using AI to handle
 * varied formats, inconsistent headers, and unstructured content better than
 * rule-based approaches.
 *
 * Features:
 * - Intelligent semantic chunking via LLM
 * - Handles poorly formatted resumes and JDs
 * - Token-aware text processing
 * - Structured output with labeled sections
 * - Support for multiple LLM providers (Groq, OpenAI, etc.)
 */

import { jsonrepair } from "jsonrepair";

const LLM_PROVIDERS = {
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    models: {
      llama: "llama3-8b-8192",
      "llama-70b": "llama3-70b-8192",
      mixtral: "mixtral-8x7b-32768",
    },
    defaultModel: "llama-70b",
    tokenLimit: 8000,
  },
  openai: {
    baseURL: "https://api.openai.com/v1",
    models: {
      "gpt-3.5": "gpt-3.5-turbo",
      "gpt-4": "gpt-4-turbo-preview",
    },
    defaultModel: "gpt-3.5",
    tokenLimit: 4000,
  },
};

const CHUNK_TYPES = {
  RESUME: {
    HEADER: "Header",
    SUMMARY: "Summary",
    EXPERIENCE: "Experience",
    EDUCATION: "Education",
    SKILLS: "Skills",
    CERTIFICATIONS: "Certifications",
    PROJECTS: "Projects",
    ACHIEVEMENTS: "Achievements",
    CONTACT: "Contact",
    OTHER: "Other",
  },
  JOB_DESCRIPTION: {
    COMPANY_INFO: "AboutCompany",
    ROLE_OVERVIEW: "RoleOverview",
    RESPONSIBILITIES: "Responsibilities",
    REQUIRED_SKILLS: "RequiredSkills",
    PREFERRED_SKILLS: "PreferredSkills",
    EXPERIENCE_REQUIREMENT: "ExperienceRequirement",
    EDUCATION_REQUIREMENT: "EducationRequirement",
    BENEFITS: "Benefits",
    LOCATION: "Location",
    OTHER: "Other",
  },
};

export class ChunkingService {
  constructor(options = {}) {
    this.provider = options.provider || "groq";
    this.apiKey =
      options.apiKey || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    this.model = options.model || LLM_PROVIDERS[this.provider].defaultModel;
    this.maxTokens = options.maxTokens || 2000;
    this.temperature = options.temperature || 0.1;
    this.maxRetries = options.maxRetries || 3;

    if (!this.apiKey) {
      throw new Error(
        `API key required for ${this.provider}. Set GROQ_API_KEY or OPENAI_API_KEY environment variable.`
      );
    }
  }

  async chunk(text, type = "resume") {
    if (!text || typeof text !== "string") {
      throw new Error("Text input is required and must be a string");
    }

    const trimmedText = this.trimTextForTokens(text);

    if (type.toLowerCase() === "resume") {
      return await this.chunkResume(trimmedText);
    } else if (type.toLowerCase() === "job" || type.toLowerCase() === "jd") {
      return await this.chunkJobDescription(trimmedText);
    } else {
      throw new Error(
        `Unsupported chunking type: ${type}. Use 'resume' or 'job'.`
      );
    }
  }

  async chunkResume(resumeText) {
    const prompt = this.generateResumePrompt(resumeText);
    return await this.performChunkingWithRetry(prompt, "resume", resumeText);
  }

  async chunkJobDescription(jobText) {
    const prompt = this.generateJobDescriptionPrompt(jobText);
    return await this.performChunkingWithRetry(prompt, "job", jobText);
  }

  /**
   * Perform chunking with retry logic for robustness
   */
  async performChunkingWithRetry(prompt, type, originalText) {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(
          `Attempt ${attempt}/${this.maxRetries} for ${type} chunking`
        );

        const response = await this.callLLM(prompt);
        console.log("Raw LLM Response:", response);

        const chunks = this.parseAndValidateChunks(response, type);
        return this.postProcessChunks(chunks, originalText);
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed:`, error.message);

        if (attempt < this.maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));

          // Modify prompt slightly for retry to encourage better formatting
          if (attempt === 2) {
            prompt = this.addStricterJSONInstructions(prompt);
          }
        }
      }
    }

    throw new Error(
      `${type} chunking failed after ${this.maxRetries} attempts: ${lastError.message}`
    );
  }

  /**
   * Add stricter JSON formatting instructions for retry attempts
   */
  addStricterJSONInstructions(originalPrompt) {
    return (
      originalPrompt +
      `\n\nIMPORTANT: Your response must be ONLY a valid JSON array. No explanations, no markdown formatting, no code blocks. Start with [ and end with ]. Example format:
[
  {
    "type": "Header",
    "text": "John Doe\\nSoftware Engineer",
    "order": 1
  },
  {
    "type": "Experience",
    "text": "Senior Developer at TechCorp (2020-2023)\\n- Led team of 5 developers",
    "order": 2
  }
]`
    );
  }

  generateResumePrompt(resumeText) {
    return `You are an expert resume analyzer. Break the following resume into logical, semantically meaningful sections.

CRITICAL JSON FORMAT REQUIREMENTS:
1. Return ONLY a valid JSON array - no markdown, no explanations, no code blocks
2. Start your response with [ and end with ]
3. Each object must have exactly these fields with double quotes:
   - "type": must be one of: ${Object.values(CHUNK_TYPES.RESUME)
     .map((t) => `"${t}"`)
     .join(", ")}
   - "text": the complete, unmodified content of that section (use \\n for line breaks)
   - "order": numerical order as a number (1, 2, 3...)

4. Rules for chunking:
   - Keep related content together
   - If multiple jobs exist, create separate Experience chunks
   - Group skills logically
   - Extract complete sentences and paragraphs
   - Preserve original formatting with \\n for line breaks

Resume Text:
${resumeText}

JSON Response:`;
  }

  generateJobDescriptionPrompt(jobText) {
    return `You are an expert job description analyzer. Break the following job description into logical, semantically meaningful sections.

CRITICAL JSON FORMAT REQUIREMENTS:
1. Return ONLY a valid JSON array - no markdown, no explanations, no code blocks
2. Start your response with [ and end with ]
3. Each object must have exactly these fields with double quotes:
   - "type": must be one of: ${Object.values(CHUNK_TYPES.JOB_DESCRIPTION)
     .map((t) => `"${t}"`)
     .join(", ")}
   - "text": the complete, unmodified content of that section (use \\n for line breaks)
   - "order": numerical order as a number (1, 2, 3...)

4. Rules for chunking:
   - Separate required vs preferred qualifications
   - Group responsibilities logically
   - Extract complete requirement statements
   - Keep company info and benefits separate

Job Description Text:
${jobText}

JSON Response:`;
  }

  async callLLM(prompt) {
    const config = LLM_PROVIDERS[this.provider];
    const url = `${config.baseURL}/chat/completions`;

    const requestBody = {
      model: config.models[this.model] || this.model,
      messages: [
        {
          role: "system",
          content:
            "You are a document analysis expert. Return only valid JSON arrays as requested. Never use markdown formatting or code blocks.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    };

    // Only add response_format for OpenAI
    if (this.provider === "openai") {
      requestBody.response_format = { type: "json_object" };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `LLM API error: ${response.status} - ${
          errorData.error?.message || "Unknown error"
        }`
      );
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response format from LLM");
    }

    return data.choices[0].message.content.trim();
  }

  /**
   * Enhanced JSON parsing with multiple fallback strategies
   */
  parseAndValidateChunks(response, type) {
    let chunks;
    let parseError;

    // Strategy 1: Direct JSON parsing
    try {
      const parsed = JSON.parse(response);
      chunks = Array.isArray(parsed) ? parsed : [parsed];
      console.log("✅ Direct JSON parse successful");
    } catch (error) {
      parseError = error;
      console.log("❌ Direct JSON parse failed:", error.message);
    }

    // Strategy 2: Clean and extract JSON from response
    if (!chunks) {
      try {
        const cleaned = this.cleanJSONResponse(response);
        const parsed = JSON.parse(cleaned);
        chunks = Array.isArray(parsed) ? parsed : [parsed];
        console.log("✅ Cleaned JSON parse successful");
      } catch (error) {
        console.log("❌ Cleaned JSON parse failed:", error.message);
      }
    }

    // Strategy 3: Use jsonrepair library
    if (!chunks) {
      try {
        const repaired = jsonrepair(response);
        const parsed = JSON.parse(repaired);
        chunks = Array.isArray(parsed) ? parsed : [parsed];
        console.log("✅ JSON repair successful");
      } catch (error) {
        console.log("❌ JSON repair failed:", error.message);
      }
    }

    // Strategy 4: Extract JSON array from mixed content
    if (!chunks) {
      try {
        const extracted = this.extractJSONArray(response);
        if (extracted) {
          const parsed = JSON.parse(extracted);
          chunks = Array.isArray(parsed) ? parsed : [parsed];
          console.log("✅ JSON extraction successful");
        }
      } catch (error) {
        console.log("❌ JSON extraction failed:", error.message);
      }
    }

    // Strategy 5: Fallback - create minimal structure
    if (!chunks) {
      console.warn(
        "🔄 All JSON parsing strategies failed, creating fallback structure"
      );
      chunks = this.createFallbackChunks(response, type);
    }

    // Validate and fix chunk structure
    return this.validateAndFixChunks(chunks, type);
  }

  /**
   * Clean JSON response by removing common formatting issues
   */
  cleanJSONResponse(response) {
    let cleaned = response.trim();

    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\s*/g, "");
    cleaned = cleaned.replace(/```\s*/g, "");

    // Remove leading/trailing text that's not JSON
    const jsonStart = cleaned.indexOf("[");
    const jsonEnd = cleaned.lastIndexOf("]");

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }

    return cleaned;
  }

  /**
   * Extract JSON array from mixed content using regex
   */
  extractJSONArray(response) {
    // Look for JSON array pattern
    const patterns = [
      /\[[\s\S]*?\]/g, // Basic array pattern
      /\[[\s\S]*?(?:\}[\s\S]*?)*\]/g, // Array with objects
    ];

    for (const pattern of patterns) {
      const matches = response.match(pattern);
      if (matches) {
        // Return the longest match (most likely to be complete)
        return matches.reduce(
          (longest, current) =>
            current.length > longest.length ? current : longest,
          ""
        );
      }
    }

    return null;
  }

  /**
   * Create fallback chunks when JSON parsing completely fails
   */
  createFallbackChunks(response, type) {
    console.warn("Creating fallback chunks from raw response");

    const fallbackType = type === "resume" ? "Other" : "Other";

    // Split response into reasonable chunks
    const paragraphs = response
      .split(/\n\s*\n/)
      .filter((p) => p.trim().length > 0);

    return paragraphs.map((text, index) => ({
      type: fallbackType,
      text: text.trim(),
      order: index + 1,
    }));
  }

  /**
   * Validate and fix chunk structure
   */
  validateAndFixChunks(chunks, type) {
    const validTypes = Object.values(
      type === "resume" ? CHUNK_TYPES.RESUME : CHUNK_TYPES.JOB_DESCRIPTION
    );

    return chunks.map((chunk, index) => {
      // Ensure chunk has required fields
      if (typeof chunk !== "object" || chunk === null) {
        console.warn(`Invalid chunk at index ${index}, converting to object`);
        chunk = { text: String(chunk) };
      }

      // Fix missing or invalid type
      if (!chunk.type || !validTypes.includes(chunk.type)) {
        console.warn(`Invalid chunk type: ${chunk.type}, using 'Other'`);
        chunk.type = "Other";
      }

      // Fix missing or invalid text
      if (!chunk.text || typeof chunk.text !== "string") {
        console.warn(`Invalid chunk text at index ${index}, using placeholder`);
        chunk.text = String(chunk.text || "").trim() || `Chunk ${index + 1}`;
      }

      // Fix missing or invalid order
      if (!chunk.order || typeof chunk.order !== "number") {
        chunk.order = index + 1;
      }

      return {
        type: chunk.type,
        text: chunk.text.trim(),
        order: chunk.order,
        length: chunk.text.length,
        wordCount: chunk.text.split(/\s+/).filter((w) => w.length > 0).length,
      };
    });
  }

  postProcessChunks(chunks, originalText) {
    // Sort by order
    chunks.sort((a, b) => a.order - b.order);

    // Remove empty chunks
    chunks = chunks.filter((chunk) => chunk.text.length > 0);

    // Add metadata
    chunks.forEach((chunk, index) => {
      chunk.id = `chunk_${index + 1}`;
      chunk.timestamp = new Date().toISOString();
    });

    console.log(`✅ Successfully processed ${chunks.length} chunks`);
    return chunks;
  }

  calculateTextSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set(
      [...words1].filter((word) => words2.has(word))
    );
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  trimTextForTokens(text) {
    const config = LLM_PROVIDERS[this.provider];
    const estimatedTokens = text.length / 4;

    if (estimatedTokens <= config.tokenLimit) {
      return text;
    }

    const targetLength = config.tokenLimit * 3;

    if (text.length <= targetLength) {
      return text;
    }

    let trimPoint = targetLength;

    let paragraphBreak = text.lastIndexOf("\n\n", targetLength);
    if (paragraphBreak > targetLength * 0.8) {
      trimPoint = paragraphBreak;
    } else {
      let sentenceBreak = text.lastIndexOf(".", targetLength);
      if (sentenceBreak > targetLength * 0.8) {
        trimPoint = sentenceBreak + 1;
      }
    }

    return text.substring(0, trimPoint).trim();
  }
}

// Convenience functions
export async function chunkResume(resumeText, options = {}) {
  const service = new ChunkingService(options);
  return await service.chunk(resumeText, "resume");
}

export async function chunkJobDescription(jobText, options = {}) {
  const service = new ChunkingService(options);
  return await service.chunk(jobText, "job");
}

export async function chunkBatch(texts, type = "resume", options = {}) {
  const service = new ChunkingService(options);
  const results = [];

  for (const text of texts) {
    try {
      const chunks = await service.chunk(text, type);
      results.push({ success: true, chunks });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }

  return results;
}

export function mergeChunksByType(chunks) {
  const merged = {};

  chunks.forEach((chunk, index) => {
    const safeOrder = typeof chunk.order === "number" ? chunk.order : index + 1;

    if (!merged[chunk.type]) {
      merged[chunk.type] = {
        type: chunk.type,
        text: chunk.text,
        order: safeOrder,
        length: chunk.length,
        wordCount: chunk.wordCount,
        chunks: [{ ...chunk, order: safeOrder }],
      };
    } else {
      merged[chunk.type].text += "\n\n" + chunk.text;
      merged[chunk.type].length += chunk.length;
      merged[chunk.type].wordCount += chunk.wordCount;
      merged[chunk.type].chunks.push({ ...chunk, order: safeOrder });

      if (safeOrder < merged[chunk.type].order) {
        merged[chunk.type].order = safeOrder;
      }
    }
  });

  return Object.values(merged).sort((a, b) => a.order - b.order);
}

export function getChunkStats(chunks) {
  const stats = {
    totalChunks: chunks.length,
    totalLength: chunks.reduce((sum, chunk) => sum + chunk.length, 0),
    totalWords: chunks.reduce((sum, chunk) => sum + chunk.wordCount, 0),
    avgChunkLength: 0,
    avgWordsPerChunk: 0,
    typeDistribution: {},
  };

  if (chunks.length > 0) {
    stats.avgChunkLength = Math.round(stats.totalLength / chunks.length);
    stats.avgWordsPerChunk = Math.round(stats.totalWords / chunks.length);

    chunks.forEach((chunk) => {
      stats.typeDistribution[chunk.type] =
        (stats.typeDistribution[chunk.type] || 0) + 1;
    });
  }

  return stats;
}

export function createChunkingService(provider = "groq", options = {}) {
  return new ChunkingService({ provider, ...options });
}

export { CHUNK_TYPES, LLM_PROVIDERS };

export default {
  ChunkingService,
  chunkResume,
  chunkJobDescription,
  chunkBatch,
  mergeChunksByType,
  getChunkStats,
  createChunkingService,
  CHUNK_TYPES,
  LLM_PROVIDERS,
};
