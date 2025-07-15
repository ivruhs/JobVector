import express from "express";
import {
  saveVerifiedJobDescription,
  generateJdEmbeddings,
} from "../controllers/jdController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/save", authenticate, saveVerifiedJobDescription);
router.post("/vector", authenticate, generateJdEmbeddings); // Assuming this is for generating embeddings

export default router;
