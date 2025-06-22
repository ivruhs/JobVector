import express from "express";
import multer from "multer";
import {
  uploadAndParseResume,
  saveVerifiedResume,
  generateResumeEmbeddings,
} from "../controllers/resumeController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

// Routes
router.post(
  "/upload",
  authenticate,
  upload.single("resume"),
  uploadAndParseResume
);
router.post("/save", authenticate, saveVerifiedResume);
router.post("/vector", authenticate, generateResumeEmbeddings);

export default router;
