import mongoose from "mongoose";

const similaritySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobDescription", // Adjust ref name based on your JD model
      required: true,
      index: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume", // Adjust ref name based on your Resume model
      required: true,
      index: true,
    },
    semanticScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100, // Assuming semantic score is between 0 and 1
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Compound index to prevent duplicate similarity records and optimize queries
similaritySchema.index({ userId: 1, jdId: 1, resumeId: 1 }, { unique: true });

// Index for efficient querying by user and jd
similaritySchema.index({ userId: 1, jdId: 1 });

// Index for efficient querying by user and resume
similaritySchema.index({ userId: 1, resumeId: 1 });

const Similarity = mongoose.model("Similarity", similaritySchema);

export default Similarity;
