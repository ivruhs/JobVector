import { v4 as uuidv4 } from "uuid";

import JobDescriptionChunks from "../models/jobDescriptionChunks.js";
import { normalizeTextSimple } from "../utils/normalizeText.js";
import {
  chunkJobDescription,
  mergeChunksByType,
} from "../services/chunkingService.js";
import embeddingService from "../services/embeddingService.js";
import supabaseClient from "../config/supabaseClient.js";
import JobDescription from "../models/jobDescription.js";

import dotenv from "dotenv";
dotenv.config();

/**
 * Enhanced Job Description Controller with Vector Storage Integration
 * Maintains all existing functionality while adding Supabase vector storage
 */

// ========== EXISTING FUNCTIONS (VECTOR-ENABLED) ==========

export const saveVerifiedJobDescription = async (req, res) => {
  try {
    const { jobDescriptionText } = req.body;
    const userId = req.user._id;

    if (!jobDescriptionText || typeof jobDescriptionText !== "string") {
      return res
        .status(400)
        .json({ error: "jobDescriptionText must be a string" });
    }

    const cleanedText = normalizeTextSimple(jobDescriptionText);

    // ✅ Save JD in MongoDB using JobDescription model
    let savedJD;
    try {
      savedJD = await JobDescription.create({
        userId,
        description: cleanedText,
      });
    } catch (err) {
      console.error("❌ Error saving job description to DB:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to save job description to database",
      });
    }

    const chunks = await chunkJobDescription(cleanedText, {
      provider: "groq",
      model: "llama-70b",
      apiKey: process.env.GROQ_API_KEY,
    });

    const mergedChunks = mergeChunksByType(chunks);

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

    const jdId = savedJD._id.toString(); // use saved _id for consistency

    await JobDescriptionChunks.create({
      jdId,
      userId,
      chunks: flatChunks,
    });

    return res.status(200).json({
      success: true,
      message: "Job Description chunks stored successfully",
      jdId,
    });
  } catch (err) {
    console.error("Error saving job description chunks:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const generateJdEmbeddings = async (req, res) => {
  try {
    const { jdId, userId, chunks } = req.body;

    // Validate input
    if (!jdId || !userId || !chunks || !Array.isArray(chunks)) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: jdId, userId, chunks",
      });
    }

    console.log(
      `Generating embeddings for JD: ${jdId}, user: ${userId}, chunks: ${chunks.length}`
    );

    // Transform chunks to match embedding service structure
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

    console.log("Processing JD chunks with embedding service...");
    const chunksWithEmbeddings = await embeddingService.processChunks(
      transformedChunks
    );

    console.log(
      `Generated embeddings for ${chunksWithEmbeddings.length} JD chunks`
    );
    console.log(
      `Sample JD embedding dimensions: ${chunksWithEmbeddings[0].vector?.length}`
    );

    // Store in Supabase
    console.log("Storing JD embeddings in Supabase...");
    const result = await supabaseClient.storeJdEmbeddings(
      chunksWithEmbeddings,
      jdId,
      userId
    );

    res.status(201).json({
      success: true,
      message: "JD embeddings generated and stored successfully",
      data: {
        jdId,
        chunksProcessed: chunksWithEmbeddings.length,
        embeddingDimensions: chunksWithEmbeddings[0].vector?.length,
        embeddings: chunksWithEmbeddings.map((chunk) => ({
          id: chunk.id,
          type: chunk.type,
          textPreview: chunk.text.substring(0, 50) + "...",
          vectorLength: chunk.vector.length,
          order: chunk.order,
        })),
      },
    });
  } catch (error) {
    console.error("Error generating JD embeddings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate JD embeddings",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
