import { GoogleGenerativeAI } from "@google/generative-ai";

class ResumeJDAnalyzer {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 8192, // Increased to handle longer responses
        responseMimeType: "application/json",
      },
    });
  }

  /**
   * Analyzes resume against job description
   * @param {string} jobDescription - The job description text
   * @param {string} resume - The resume text
   * @returns {Promise<Object>} Analysis results with similarity score and skills breakdown
   */
  async analyzeResumeMatch(jobDescription, resume) {
    const prompt = this.createAnalysisPrompt(jobDescription, resume);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();

      // Clean and parse JSON response with multiple attempts
      const analysis = this.parseJsonResponse(analysisText);

      // Validate and enhance the response
      return this.validateAndEnhanceResponse(analysis);
    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Robust JSON parsing with multiple fallback strategies
   * @param {string} responseText - Raw response from AI
   * @returns {Object} Parsed JSON object
   */
  parseJsonResponse(responseText) {
    console.log("Response length:", responseText.length);
    console.log("Response starts with:", responseText.substring(0, 100));
    console.log(
      "Response ends with:",
      responseText.substring(responseText.length - 100)
    );

    // Strategy 1: Direct JSON parsing
    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.log("Direct JSON parse failed:", e.message);
    }

    // Strategy 2: Extract JSON from markdown code blocks
    try {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (jsonMatch) {
        console.log("Found JSON in markdown, parsing...");
        return JSON.parse(jsonMatch[1]);
      }
    } catch (e) {
      console.log("Markdown JSON extraction failed:", e.message);
    }

    // Strategy 3: Find JSON object boundaries with proper brace counting
    try {
      const startIndex = responseText.indexOf("{");
      if (startIndex === -1) {
        throw new Error("No opening brace found");
      }

      // Count braces to find the complete JSON object
      let braceCount = 0;
      let endIndex = -1;
      let inString = false;
      let escapeNext = false;

      for (let i = startIndex; i < responseText.length; i++) {
        const char = responseText[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === "\\") {
          escapeNext = true;
          continue;
        }

        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === "{") {
            braceCount++;
          } else if (char === "}") {
            braceCount--;
            if (braceCount === 0) {
              endIndex = i;
              break;
            }
          }
        }
      }

      if (endIndex !== -1) {
        const jsonStr = responseText.substring(startIndex, endIndex + 1);
        console.log(
          "Extracted JSON with brace counting, length:",
          jsonStr.length
        );
        return JSON.parse(jsonStr);
      }
    } catch (e) {
      console.log(
        "JSON boundary extraction with brace counting failed:",
        e.message
      );
    }

    // Strategy 4: Clean common JSON issues and retry
    try {
      let cleaned = responseText
        .replace(/```json\s*/g, "") // Remove markdown
        .replace(/```\s*$/g, "") // Remove closing markdown
        .replace(/,\s*}/g, "}") // Remove trailing commas in objects
        .replace(/,\s*]/g, "]") // Remove trailing commas in arrays
        .trim();

      // Find the main JSON object
      const startIndex = cleaned.indexOf("{");
      const lastIndex = cleaned.lastIndexOf("}");
      if (startIndex !== -1 && lastIndex !== -1) {
        cleaned = cleaned.substring(startIndex, lastIndex + 1);
        console.log("Trying cleaned JSON, length:", cleaned.length);
        return JSON.parse(cleaned);
      }
    } catch (e) {
      console.log("JSON cleaning failed:", e.message);
    }

    // Strategy 5: Try to reconstruct truncated JSON
    try {
      if (responseText.startsWith("{") && !responseText.endsWith("}")) {
        console.log("Detected truncated JSON, attempting reconstruction...");

        // Find the last complete field
        let reconstructed = responseText;

        // Remove any incomplete field at the end
        const lastCommaIndex = reconstructed.lastIndexOf(",");
        const lastColonIndex = reconstructed.lastIndexOf(":");

        if (lastColonIndex > lastCommaIndex) {
          // We have an incomplete field, remove it
          reconstructed = reconstructed.substring(0, lastCommaIndex);
        }

        // Add closing brace
        reconstructed += "}";

        console.log("Reconstructed JSON, length:", reconstructed.length);
        return JSON.parse(reconstructed);
      }
    } catch (e) {
      console.log("JSON reconstruction failed:", e.message);
    }

    // If all strategies fail, log more details and throw error
    console.error("All JSON parsing strategies failed.");
    console.error("Full response length:", responseText.length);
    console.error("First 1000 chars:", responseText.substring(0, 1000));
    console.error(
      "Last 1000 chars:",
      responseText.substring(Math.max(0, responseText.length - 1000))
    );

    throw new Error(
      "Failed to parse AI response as JSON. The response may be truncated or malformed."
    );
  }

  /**
   * Creates a comprehensive analysis prompt for domain-independent evaluation
   */
  createAnalysisPrompt(jobDescription, resume) {
    return `You are an expert HR analyst and talent acquisition specialist. Analyze the following job description and resume to provide a comprehensive similarity assessment.

**IMPORTANT INSTRUCTIONS:**
1. Be domain-independent - work with ANY field (tech, healthcare, finance, marketing, education, etc.)
2. Focus on transferable skills, core competencies, and role-specific requirements
3. Consider both hard skills (technical/domain-specific) and soft skills (leadership, communication, etc.)
4. Evaluate experience relevance, not just direct matches
5. Provide actionable insights for the candidate

**JOB DESCRIPTION:**
${jobDescription}

**RESUME:**
${resume}

**ANALYSIS REQUIREMENTS:**
You MUST respond with ONLY valid JSON. No markdown, no explanations, no code blocks. Start with { and end with }.
Provide a detailed JSON response with the following structure:

{
  "overall_similarity_score": [0-100 integer score],
  "matching_strengths": {
    "hard_skills": ["List of technical/domain-specific skills that match"],
    "soft_skills": ["List of interpersonal/leadership skills that match"],
    "experience_areas": ["List of relevant experience areas that align"],
    "qualifications": ["Educational/certification matches"],
    "achievements": ["Notable accomplishments that align with role requirements"]
  },
  "missing_critical_elements": {
    "hard_skills": ["Essential technical skills not demonstrated"],
    "soft_skills": ["Important interpersonal skills not evident"],
    "experience_gaps": ["Required experience areas not covered"],
    "qualifications": ["Missing educational/certification requirements"],
    "other_requirements": ["Any other critical job requirements not met"]
  },
  "areas_for_improvement": [
    {
      "category": "skill_category",
      "priority": "high/medium/low",
      "description": "Specific actionable advice for improvement",
      "suggested_actions": ["Concrete steps to address this gap"]
    }
  ],
  "role_fit_assessment": {
    "immediate_readiness": "high/medium/low",
    "growth_potential": "high/medium/low",
    "culture_fit_indicators": ["Aspects suggesting good cultural alignment"],
    "red_flags": ["Potential concerns or misalignments"]
  },
  "keyword_analysis": {
    "matched_keywords": ["Important keywords from JD found in resume"],
    "missing_keywords": ["Critical keywords from JD not in resume"],
    "keyword_density_score": [0-100 score for keyword coverage]
  },
  "recommendations": {
    "for_candidate": ["Specific advice to improve their candidacy"],
    "for_recruiter": ["Insights on candidate's potential and fit"],
    "interview_focus_areas": ["Key areas to explore during interviews"]
  }
}

**EVALUATION CRITERIA:**
- Skills relevance and depth (30%)
- Experience alignment and progression (25%)
- Educational/qualification match (15%)
- Achievements and impact demonstration (15%)
- Soft skills and cultural fit indicators (10%)
- Keyword optimization and presentation (5%)

Be thorough, fair, and constructive in your analysis. Focus on potential and transferable skills, not just exact matches.

CRITICAL: Respond with ONLY the JSON object. No additional text, explanations, or formatting.`;
  }

  /**
   * Validates and enhances the AI response
   */
  validateAndEnhanceResponse(analysis) {
    // Ensure all required fields are present
    const requiredFields = [
      "overall_similarity_score",
      "matching_strengths",
      "missing_critical_elements",
      "areas_for_improvement",
      "role_fit_assessment",
      "keyword_analysis",
      "recommendations",
    ];

    for (const field of requiredFields) {
      if (!analysis[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Ensure similarity score is within valid range
    if (
      analysis.overall_similarity_score < 0 ||
      analysis.overall_similarity_score > 100
    ) {
      throw new Error("Similarity score must be between 0 and 100");
    }

    // Add metadata
    analysis.analysis_metadata = {
      timestamp: new Date().toISOString(),
      model_used: "gemini-1.5-flash",
      analysis_version: "1.0",
    };

    return analysis;
  }

  /**
   * Batch analyze multiple resumes against a single job description
   * @param {string} jobDescription - The job description
   * @param {Array<{id: string, resume: string}>} resumes - Array of resume objects
   * @param {number} delayMs - Delay between requests to respect rate limits
   * @returns {Promise<Array>} Array of analysis results
   */
  async batchAnalyze(jobDescription, resumes, delayMs = 4000) {
    const results = [];

    for (let i = 0; i < resumes.length; i++) {
      const { id, resume } = resumes[i];

      try {
        console.log(`Analyzing resume ${i + 1}/${resumes.length} (ID: ${id})`);

        const analysis = await this.analyzeResumeMatch(jobDescription, resume);
        results.push({
          resume_id: id,
          analysis: analysis,
          status: "success",
        });

        // Rate limiting delay (except for last item)
        if (i < resumes.length - 1) {
          await this.delay(delayMs);
        }
      } catch (error) {
        console.error(`Failed to analyze resume ${id}:`, error.message);
        results.push({
          resume_id: id,
          analysis: null,
          status: "error",
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Utility function for delays
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate a summary report for batch analysis
   */
  generateBatchSummary(batchResults) {
    const successful = batchResults.filter((r) => r.status === "success");
    const failed = batchResults.filter((r) => r.status === "error");

    if (successful.length === 0) {
      return { error: "No successful analyses to summarize" };
    }

    const scores = successful.map((r) => r.analysis.overall_similarity_score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    return {
      total_resumes: batchResults.length,
      successful_analyses: successful.length,
      failed_analyses: failed.length,
      average_similarity_score: Math.round(avgScore * 100) / 100,
      highest_score: Math.max(...scores),
      lowest_score: Math.min(...scores),
      top_candidates: successful
        .sort(
          (a, b) =>
            b.analysis.overall_similarity_score -
            a.analysis.overall_similarity_score
        )
        .slice(0, 5)
        .map((r) => ({
          resume_id: r.resume_id,
          score: r.analysis.overall_similarity_score,
          immediate_readiness:
            r.analysis.role_fit_assessment.immediate_readiness,
        })),
    };
  }
}

// Usage Example
async function example() {
  // Initialize analyzer with your Gemini API key
  const analyzer = new ResumeJDAnalyzer("YOUR_GEMINI_API_KEY");

  const jobDescription = `
    Senior Software Engineer
    We are looking for a Senior Software Engineer to join our team...
    Requirements: 5+ years experience, JavaScript, React, Node.js, AWS...
  `;

  const resume = `
    John Doe
    Software Engineer with 6 years of experience...
    Skills: JavaScript, React, Python, Docker...
  `;

  try {
    // Single analysis
    const analysis = await analyzer.analyzeResumeMatch(jobDescription, resume);
    console.log("Analysis Result:", JSON.stringify(analysis, null, 2));

    // Batch analysis example
    const resumes = [
      { id: "candidate_1", resume: resume },
      { id: "candidate_2", resume: "Another resume..." },
    ];

    const batchResults = await analyzer.batchAnalyze(jobDescription, resumes);
    const summary = analyzer.generateBatchSummary(batchResults);

    console.log("Batch Summary:", summary);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Export the class for use in other modules
export default ResumeJDAnalyzer;
export { ResumeJDAnalyzer };
