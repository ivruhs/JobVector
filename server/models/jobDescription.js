import mongoose from "mongoose";

const jobDescriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: { type: String, required: true },
  },
  {
    timestamps: true, // ⬅️ Adds createdAt and updatedAt
  }
);

const JobDescription = mongoose.model("JobDescription", jobDescriptionSchema);

export default JobDescription;
