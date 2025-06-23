import mongoose from "mongoose";

const resumeChunksSchema = new mongoose.Schema({
  resumeId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  chunks: [
    {
      type: { type: String },
      text: String,
      order: Number,
      length: Number,
      wordCount: Number,
      timestamp: Date,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ResumeChunks = mongoose.model("ResumeChunks", resumeChunksSchema);
export default ResumeChunks;
