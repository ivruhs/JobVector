// server/controllers/skillController.js
import ResumeJDAnalyzer from "../services/skillExtractor.js";
import SkillAnalysis from "../models/skillAnalysisModel.js";
import Similarity from "../models/similarityModel.js";
import dotenv from "dotenv";
dotenv.config();

const analyzer = new ResumeJDAnalyzer(process.env.GEMINI_API_KEY);

export async function analyzeSkillMatch(req, res) {
  try {
    const { resumeId, resumeText, jdId, jobDescriptionText, userId } = req.body;

    // Validate input
    if (!resumeText || !jobDescriptionText) {
      return res.status(400).json({
        error: "Both resumeText and jobDescriptionText are required",
        success: false,
      });
    }

    if (!userId || !resumeId || !jdId) {
      return res.status(400).json({
        error: "userId, resumeId, and jdId are required",
        success: false,
      });
    }

    // Validate input lengths
    if (resumeText.trim().length < 10) {
      return res.status(400).json({
        error: "Resume text is too short (minimum 10 characters)",
        success: false,
      });
    }

    if (jobDescriptionText.trim().length < 10) {
      return res.status(400).json({
        error: "Job description text is too short (minimum 10 characters)",
        success: false,
      });
    }

    // Check for maximum lengths (optional - helps with token limits)
    if (resumeText.length > 10000) {
      return res.status(400).json({
        error: "Resume text is too long (maximum 10,000 characters)",
        success: false,
      });
    }

    if (jobDescriptionText.length > 8000) {
      return res.status(400).json({
        error: "Job description is too long (maximum 8,000 characters)",
        success: false,
      });
    }

    // Check if analysis already exists
    const existingAnalysis = await SkillAnalysis.findOne({
      userId,
      jdId,
      resumeId,
    });

    if (existingAnalysis) {
      console.log("📋 Found existing skill analysis");
      return res.json({
        success: true,
        data: existingAnalysis,
        message: "Skill analysis retrieved from database",
        isExisting: true,
      });
    }

    console.log(
      "📝 Analyzing skills for resume length:",
      resumeText.length,
      "and job description length:",
      jobDescriptionText.length
    );

    // Perform skill analysis
    const result = await analyzer.analyzeResumeMatch(
      jobDescriptionText,
      resumeText
    );

    console.log("✅ Skill analysis completed successfully");
    console.log(
      "🔍 Analysis result structure:",
      JSON.stringify(result, null, 2)
    );

    // Extract the actual analysis data from the wrapper
    const analysisResult = result.success ? result.data : result;

    // Get semantic score from existing similarity record
    let semanticScore = null;
    try {
      const existingSimilarity = await Similarity.findOne({
        userId,
        jdId,
        resumeId,
      });

      if (existingSimilarity) {
        semanticScore = existingSimilarity.semanticScore;
        console.log("📋 Retrieved semantic score from DB:", semanticScore);
      } else {
        console.log("⚠️ No semantic score found in database");
      }
    } catch (semanticError) {
      console.error("⚠️ Error retrieving semantic score:", semanticError);
      // Continue without semantic score
    }

    const analysisData = {
      userId,
      jdId,
      resumeId,
      overallSimilarityScore: analysisResult.overall_similarity_score || 0,
      matchingStrengths: combineMatchingStrengths(analysisResult),
      missingSkills: combineMissingSkills(analysisResult),
      // ✅ FIXED: Get the exact recommendations arrays from the original data
      candidateRecommendations:
        analysisResult.recommendations?.for_candidate || [],
      recruiterRecommendations:
        analysisResult.recommendations?.for_recruiter || [],
      semanticScore: semanticScore,
      rawAnalysisData: analysisResult, // Store complete original data
    };

    console.log("📊 Analysis data prepared:", {
      overallSimilarityScore: analysisData.overallSimilarityScore,
      matchingStrengthsCount: analysisData.matchingStrengths.length,
      missingSkillsCount: analysisData.missingSkills.length,
      candidateRecommendationsCount:
        analysisData.candidateRecommendations.length,
      recruiterRecommendationsCount:
        analysisData.recruiterRecommendations.length,
    });

    // Save to database
    const skillAnalysis = new SkillAnalysis(analysisData);
    await skillAnalysis.save();

    console.log(
      "💾 Skill analysis saved to database with ID:",
      skillAnalysis._id
    );

    res.json({
      success: true,
      data: skillAnalysis,
      message: "Skills analyzed and saved successfully",
      isExisting: false,
    });
  } catch (error) {
    console.error("❌ Skill analysis error:", error);

    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      try {
        const existingAnalysis = await SkillAnalysis.findOne({
          userId: req.body.userId,
          jdId: req.body.jdId,
          resumeId: req.body.resumeId,
        });

        if (existingAnalysis) {
          return res.json({
            success: true,
            data: existingAnalysis,
            message: "Skill analysis retrieved from database",
            isExisting: true,
          });
        }
      } catch (findError) {
        console.error("❌ Error retrieving existing analysis:", findError);
      }
    }

    // Determine error type for better response
    let statusCode = 500;
    let errorMessage = "Failed to analyze skills";

    if (
      error.message.includes("JSON") ||
      error.message.includes("No JSON found")
    ) {
      errorMessage = "Failed to parse AI response - please try again";
      statusCode = 422;
    } else if (error.message.includes("timeout")) {
      errorMessage = "Request timed out - please try again";
      statusCode = 408;
    } else if (
      error.message.includes("network") ||
      error.message.includes("connection")
    ) {
      errorMessage = "AI service unavailable - please try again later";
      statusCode = 503;
    } else if (
      error.message.includes("API failed") ||
      error.message.includes("401")
    ) {
      errorMessage = "AI service authentication failed";
      statusCode = 502;
    } else if (
      error.message.includes("rate limit") ||
      error.message.includes("429")
    ) {
      errorMessage = "Too many requests - please wait and try again";
      statusCode = 429;
    } else if (error.message.includes("Analysis failed after")) {
      errorMessage =
        "Analysis failed after multiple attempts - please try again";
      statusCode = 422;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      code: error.code || "SKILL_ANALYSIS_ERROR",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
      timestamp: new Date().toISOString(),
    });
  }
}

// ... other controller functions remain the same ...

// Helper functions to combine skills
function combineMatchingStrengths(result) {
  const strengths = [];

  try {
    console.log(
      "🔍 Combining matching strengths from:",
      result.matching_strengths
    );

    // Combine hard skills
    if (
      result.matching_strengths?.hard_skills &&
      Array.isArray(result.matching_strengths.hard_skills)
    ) {
      strengths.push(...result.matching_strengths.hard_skills);
    }

    // Combine soft skills
    if (
      result.matching_strengths?.soft_skills &&
      Array.isArray(result.matching_strengths.soft_skills)
    ) {
      strengths.push(...result.matching_strengths.soft_skills);
    }

    // Combine experience areas
    if (
      result.matching_strengths?.experience_areas &&
      Array.isArray(result.matching_strengths.experience_areas)
    ) {
      strengths.push(...result.matching_strengths.experience_areas);
    }

    // NOTE: Excluding qualifications and achievements as requested
    // If you want to include them later, uncomment these sections:

    // // Combine qualifications
    // if (
    //   result.matching_strengths?.qualifications &&
    //   Array.isArray(result.matching_strengths.qualifications)
    // ) {
    //   strengths.push(...result.matching_strengths.qualifications);
    // }

    // // Combine achievements
    // if (
    //   result.matching_strengths?.achievements &&
    //   Array.isArray(result.matching_strengths.achievements)
    // ) {
    //   strengths.push(...result.matching_strengths.achievements);
    // }

    // Remove duplicates and return
    const uniqueStrengths = [...new Set(strengths)];
    console.log("✅ Combined matching strengths:", uniqueStrengths);
    console.log("📊 Total unique strengths count:", uniqueStrengths.length);
    return uniqueStrengths;
  } catch (error) {
    console.error("⚠️ Error combining matching strengths:", error);
    return [];
  }
}

function combineMissingSkills(result) {
  const missing = [];

  try {
    console.log(
      "🔍 Combining missing skills from:",
      result.missing_critical_elements
    );

    // Combine missing hard skills
    if (
      result.missing_critical_elements?.hard_skills &&
      Array.isArray(result.missing_critical_elements.hard_skills)
    ) {
      missing.push(...result.missing_critical_elements.hard_skills);
    }

    // Combine missing soft skills
    if (
      result.missing_critical_elements?.soft_skills &&
      Array.isArray(result.missing_critical_elements.soft_skills)
    ) {
      missing.push(...result.missing_critical_elements.soft_skills);
    }

    // Combine experience gaps
    if (
      result.missing_critical_elements?.experience_gaps &&
      Array.isArray(result.missing_critical_elements.experience_gaps)
    ) {
      missing.push(...result.missing_critical_elements.experience_gaps);
    }

    // Combine missing qualifications
    if (
      result.missing_critical_elements?.qualifications &&
      Array.isArray(result.missing_critical_elements.qualifications)
    ) {
      missing.push(...result.missing_critical_elements.qualifications);
    }

    // Combine other requirements
    if (
      result.missing_critical_elements?.domain_knowledge &&
      Array.isArray(result.missing_critical_elements.domain_knowledge)
    ) {
      missing.push(...result.missing_critical_elements.domain_knowledge);
    }

    // Remove duplicates and return
    const uniqueMissing = [...new Set(missing)];
    console.log("✅ Combined missing skills:", uniqueMissing);
    console.log("📊 Total unique missing skills count:", uniqueMissing.length);
    return uniqueMissing;
  } catch (error) {
    console.error("⚠️ Error combining missing skills:", error);
    return [];
  }
}
