// server/models/skillAnalysisModel.js
import mongoose from "mongoose";

const skillAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobDescription",
      required: true,
      index: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
      index: true,
    },
    overallSimilarityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    matchingStrengths: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    candidateRecommendations: {
      type: [String],
      default: [],
    },
    recruiterRecommendations: {
      type: [String],
      default: [],
    },
    semanticScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness
skillAnalysisSchema.index(
  { userId: 1, jdId: 1, resumeId: 1 },
  { unique: true }
);

const SkillAnalysis = mongoose.model("SkillAnalysis", skillAnalysisSchema);

export default SkillAnalysis;
