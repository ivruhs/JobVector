import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // ⬅️ Adds createdAt and updatedAt
  }
);

const Resume = mongoose.model("Resume", resumeSchema);

export default Resume;
