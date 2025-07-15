import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js"; // adjust path as needed
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Import your existing functions - adjust paths as needed
import {
  saveVerifiedResume,
  generateResumeEmbeddings,
} from "../controllers/resumeController.js";
import {
  saveVerifiedJobDescription,
  generateJdEmbeddings,
} from "../controllers/jdController.js";
import SimilarityController from "../controllers/analysisController.js";
import { analyzeSkillMatch } from "../controllers/skillController.js";
import { dot } from "@xenova/transformers";

router.post("/complete", authenticate, async (req, res) => {
  try {
    const { resumeText, jobDescriptionText } = req.body;
    const userId = req.user._id;

    // Step 1: Save resume and get resumeId and chunks
    const mockRes1 = {
      status: () => ({ json: (data) => data }),
      json: (data) => data,
    };
    await saveVerifiedResume(
      { body: { resumeText }, user: { _id: userId } },
      mockRes1
    );

    // Get the actual saved data from database
    const ResumeChunk = (await import("../models/resumeChunk.js")).default;
    const latestResume = await ResumeChunk.findOne({ userId }).sort({
      createdAt: -1,
    });
    const resumeId = latestResume.resumeId;
    const resumeChunks = latestResume.chunks;

    // Step 2: Generate resume embeddings
    const mockRes2 = {
      status: () => ({ json: (data) => data }),
      json: (data) => data,
    };
    await generateResumeEmbeddings(
      {
        body: { resumeId, userId, chunks: resumeChunks },
        user: { _id: userId },
      },
      mockRes2
    );

    // Step 3: Save JD and get jdId and chunks
    const mockRes3 = {
      status: () => ({ json: (data) => data }),
      json: (data) => data,
    };
    await saveVerifiedJobDescription(
      {
        body: { jobDescriptionText },
        user: { _id: userId },
      },
      mockRes3
    );

    // Get the actual saved JD data
    const JobDescriptionChunks = (
      await import("../models/jobDescriptionChunks.js")
    ).default;
    const latestJD = await JobDescriptionChunks.findOne({ userId }).sort({
      createdAt: -1,
    });
    const jdId = latestJD.jdId;
    const jdChunks = latestJD.chunks;

    // Step 4: Generate JD embeddings
    const mockRes4 = {
      status: () => ({ json: (data) => data }),
      json: (data) => data,
    };
    await generateJdEmbeddings(
      {
        body: { jdId, userId, chunks: jdChunks },
        user: { _id: userId },
      },
      mockRes4
    );

    // Step 5: Calculate similarity
    const mockRes5 = {
      status: () => ({ json: (data) => data }),
      json: (data) => data,
    };
    await SimilarityController.calculateSimilarity(
      {
        body: { jdId, resumeId },
        user: { _id: userId },
      },
      mockRes5
    );

    // Step 6: Analyze skills and get final result
    const mockRes6 = {
      status: () => ({ json: (data) => data }),
      json: (data) => data,
    };
    await analyzeSkillMatch(
      {
        body: { resumeId, resumeText, jdId, jobDescriptionText, userId },
      },
      mockRes6
    );

    // Get the final analysis from database
    const SkillAnalysisModel = (await import("../models/skillAnalysisModel.js"))
      .default;
    const analysis = await SkillAnalysisModel.findOne({
      resumeId,
      jdId,
      userId,
    }).sort({ createdAt: -1 });

    // Cleanup - Delete all documents from MongoDB
    const Resume = (await import("../models/resumeModel.js")).default;
    const JobDescription = (await import("../models/jobDescription.js"))
      .default;

    await JobDescriptionChunks.deleteMany({ userId });
    await JobDescription.deleteMany({ userId });
    await ResumeChunk.deleteMany({ userId });
    await Resume.deleteMany({ userId });

    // Clear Supabase tables
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    await supabase.from("jd_embeddings").delete().eq("user_id", userId);
    await supabase.from("resume_embeddings").delete().eq("user_id", userId);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("Complete analysis error:", error);
    res.status(500).json({
      success: false,
      message: "Analysis failed",
      error: error.message,
    });
  }
});

export default router;
