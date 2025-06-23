import pdfParse from "pdf-parse";
import Resume from "../models/resumeModel.js";
import { cleanParsedText } from "../utils/cleanParsedText.js";
import { normalizeTextSimple } from "../utils/normalizeText.js";
import { chunkResume, mergeChunksByType } from "../services/chunkingService.js";
import ResumeChunks from "../models/resumeChunk.js";
import embeddingService from "../services/embeddingService.js";
import supabaseClient from "../config/supabaseClient.js";

import dotenv from "dotenv";
dotenv.config();

/**
 * Enhanced Resume Controller with Vector Storage Integration
 * Maintains all existing functionality while adding Supabase vector storage
 */

// ========== EXISTING FUNCTIONS (VECTOR-ENABLED) ==========

export const uploadAndParseResume = async (req, res) => {
  try {
    const userId = req.user._id;
    // ✅ Check if the file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No resume file uploaded" });
    }
    const pdfBuffer = req.file.buffer;

    const data = await pdfParse(pdfBuffer);
    const parsedText = data.text;

    // Clean the parsed text
    const cleanedText = cleanParsedText(parsedText);
    const normalizedText = normalizeTextSimple(cleanedText);

    res.status(200).json({ parsedText: normalizedText });
  } catch (err) {
    console.error("Resume Parse Error:", err);
    res.status(500).json({ message: "Failed to parse resume" });
  }
};

export const saveVerifiedResume = async (req, res) => {
  try {
    const { resumeText } = req.body;
    const userId = req.user._id;

    if (!resumeText || typeof resumeText !== "string") {
      return res.status(400).json({ error: "resumeText must be a string" });
    }

    const cleanedText = normalizeTextSimple(resumeText); // optional normalization

    // ✅ Save resume in DB safely
    let savedResume;
    try {
      savedResume = await Resume.create({
        userId,
        text: cleanedText,
      });
    } catch (err) {
      console.error("❌ Error saving resume to DB:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to save resume text to database",
      });
    }

    const chunks = await chunkResume(cleanedText, {
      provider: "groq",
      model: "llama-70b",
      apiKey: process.env.GROQ_API_KEY,
    });

    const mergedChunks = mergeChunksByType(chunks);

    // Flatten for storing
    const flatChunks = [];
    for (const section of mergedChunks) {
      for (const chunk of section.chunks) {
        flatChunks.push({
          type: chunk.type,
          text: chunk.text,
          order: chunk.order,
          length: chunk.length,
          wordCount: chunk.wordCount,
          timestamp: chunk.timestamp,
        });
      }
    }

    const resumeId = savedResume._id.toString();

    await ResumeChunks.create({
      resumeId,
      userId,
      chunks: flatChunks,
    });

    return res.status(200).json({
      success: true,
      message: "Resume chunks stored successfully",
      resumeId,
    });
  } catch (err) {
    console.error("Error saving resume chunks:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const generateResumeEmbeddings = async (req, res) => {
  try {
    const { resumeId, userId, chunks } = req.body;

    if (!resumeId || !userId || !chunks || !Array.isArray(chunks)) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: resumeId, userId, chunks",
      });
    }

    console.log(
      `Generating embeddings for resume: ${resumeId}, user: ${userId}, chunks: ${chunks.length}`
    );

    const transformedChunks = chunks.map((chunk, index) => ({
      id: chunk._id?.$oid || chunk.id || `chunk_${index}`,
      type: chunk.type || "Unknown",
      text: chunk.text || "",
      order: chunk.order || index + 1,
      length: chunk.length || chunk.text?.length || 0,
      wordCount: chunk.wordCount || 0,
      _id: chunk._id,
      timestamp: chunk.timestamp,
    }));

    console.log("Processing chunks with embedding service...");
    const chunksWithEmbeddings = await embeddingService.processChunks(
      transformedChunks
    );

    // Get the expected dimension from the embedding service
    const expectedDimension = embeddingService.embeddingDimension; // 768 for Gemini

    console.log(`Expected embedding dimension: ${expectedDimension}`);

    // Final safety check: sanitize vectors
    for (let i = 0; i < chunksWithEmbeddings.length; i++) {
      let vector = chunksWithEmbeddings[i].vector;

      // Convert to plain array if needed
      if (!Array.isArray(vector)) {
        vector = Array.from(vector);
        chunksWithEmbeddings[i].vector = vector;
      }

      // Validate vector with correct dimension
      if (
        !vector ||
        vector.length !== expectedDimension ||
        vector.some((v) => typeof v !== "number" || !isFinite(v))
      ) {
        console.error(`❌ Chunk at index ${i} validation details:`, {
          hasVector: !!vector,
          vectorLength: vector?.length,
          expectedLength: expectedDimension,
          chunkId: chunksWithEmbeddings[i].id,
          chunkType: chunksWithEmbeddings[i].type,
          vectorSample: vector?.slice(0, 5),
          invalidValues:
            vector?.filter((v) => typeof v !== "number" || !isFinite(v))
              .length || 0,
        });

        throw new Error(
          `Chunk at index ${i} (ID: ${chunksWithEmbeddings[i].id}) has invalid vector: ` +
            `Expected ${expectedDimension} dimensions, got ${
              vector?.length || "undefined"
            }. ` +
            `Invalid values: ${
              vector?.filter((v) => typeof v !== "number" || !isFinite(v))
                .length || 0
            }`
        );
      }
    }

    console.log(
      `✅ All ${chunksWithEmbeddings.length} vectors validated successfully`
    );
    console.log(
      `📊 Vector dimensions: ${expectedDimension}, Sample values:`,
      chunksWithEmbeddings[0]?.vector?.slice(0, 3)
    );

    const result = await supabaseClient.storeResumeEmbeddings(
      chunksWithEmbeddings,
      resumeId,
      userId
    );

    res.status(201).json({
      success: true,
      message: "Resume embeddings generated and stored successfully",
      data: {
        resumeId,
        chunksProcessed: chunksWithEmbeddings.length,
        embeddingDimensions: chunksWithEmbeddings[0].vector.length,
        expectedDimensions: expectedDimension,
        embeddings: chunksWithEmbeddings.map((chunk) => ({
          id: chunk.id,
          type: chunk.type,
          textPreview: chunk.text.substring(0, 50) + "...",
          vectorLength: chunk.vector.length,
          order: chunk.order,
          embeddingQuality: chunk.embeddingQuality,
        })),
      },
    });
  } catch (error) {
    console.error("Error generating resume embeddings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate resume embeddings",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
