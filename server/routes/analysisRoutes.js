import express from "express";
import SimilarityController from "../controllers/analysisController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/calculate",
  authenticate,
  SimilarityController.calculateSimilarity
);

export default router;
