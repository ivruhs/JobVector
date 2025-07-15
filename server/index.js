// packages
// import path from "path";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

// Utiles
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import jdRoutes from "./routes/jdRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import analysisRoutes from "./routes/analysisRoutes.js";

// server/app.js (or main server file) - Add this route
import skillRoutes from "./routes/skillRoutes.js";

import completeAnalysisRoutes from "./routes/completeRoutes.js"; // adjust path

dotenv.config();
const port = process.env.PORT || 5000;

console.clear();

connectDB();

const app = express();

app.use(express.json({ limit: "10mb" })); // Increase limit for large documents
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173", // ✅ Your frontend URL
    credentials: true, // ✅ If you're sending cookies
  })
);

app.use("/api/users", userRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/jd", jdRoutes);
app.use("/api/analysis", analysisRoutes); // Assuming analysis routes are handled in resumeRoutes
app.use("/api/skills", skillRoutes);

app.use("/api/ai", completeAnalysisRoutes);
app.use(errorHandler);

// ✅ EXPORT the app
export default app;
