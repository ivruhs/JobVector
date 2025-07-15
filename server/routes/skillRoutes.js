import express from "express";
import { analyzeSkillMatch } from "../controllers/skillController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// POST /api/skills/analyze
router.post("/analyze", analyzeSkillMatch);

export default router;
