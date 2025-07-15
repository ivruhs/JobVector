import SimilarityService from "../services/similarityService.js";
import Similarity from "../models/similarityModel.js"; // Adjust path as needed

const DEBUG = true; // Set to false to disable logs

class SimilarityController {
  /**
   * Calculate semantic similarity score between JD and Resume
   */
  static async calculateSimilarity(req, res) {
    try {
      const { jdId, resumeId } = req.body;
      const userId = req.user._id;

      // Input validation
      if (!jdId || !resumeId) {
        return res.status(400).json({
          success: false,
          message: "Both jdId and resumeId are required",
        });
      }

      if (DEBUG)
        console.log(
          `🧠 Calculating similarity between JD: ${jdId} and Resume: ${resumeId}`
        );

      // Check if similarity already exists
      const existingSimilarity = await Similarity.findOne({
        userId,
        jdId,
        resumeId,
      });

      if (existingSimilarity) {
        if (DEBUG)
          console.log(
            `📋 Found existing similarity: ${existingSimilarity.semanticScore}`
          );

        return res.status(200).json({
          success: true,
          data: {
            jdId,
            resumeId,
            semanticScore: existingSimilarity.semanticScore,
            isExisting: true,
            calculatedAt: existingSimilarity.createdAt,
          },
          message: "Similarity score retrieved from database",
        });
      }

      // Calculate semantic score
      const semanticScore = await SimilarityService.calculateSemanticScore(
        jdId,
        resumeId
      );

      if (DEBUG) console.log(`✅ Semantic Score: ${semanticScore}`);

      // Save similarity to database
      const similarity = new Similarity({
        userId,
        jdId,
        resumeId,
        semanticScore,
      });

      await similarity.save();

      if (DEBUG)
        console.log(
          `💾 Similarity saved to database with ID: ${similarity._id}`
        );

      return res.status(200).json({
        success: true,
        data: {
          jdId,
          resumeId,
          semanticScore,
          isExisting: false,
          calculatedAt: similarity.createdAt,
        },
        message: "Semantic score calculated and saved successfully",
      });
    } catch (error) {
      console.error("❌ Error in calculateSimilarity:", error);

      // Handle duplicate key error (race condition)
      if (error.code === 11000) {
        try {
          const existingSimilarity = await Similarity.findOne({
            userId: req.user._id,
            jdId: req.body.jdId,
            resumeId: req.body.resumeId,
          });

          if (existingSimilarity) {
            return res.status(200).json({
              success: true,
              data: {
                jdId: req.body.jdId,
                resumeId: req.body.resumeId,
                semanticScore: existingSimilarity.semanticScore,
                isExisting: true,
                calculatedAt: existingSimilarity.createdAt,
              },
              message: "Similarity score retrieved from database",
            });
          }
        } catch (findError) {
          console.error("❌ Error retrieving existing similarity:", findError);
        }
      }

      return res.status(500).json({
        success: false,
        message: "Internal server error while calculating similarity",
        error: error.message || "Unknown error",
      });
    }
  }

  /**
   * Delete a similarity record
   */
  static async deleteSimilarity(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const similarity = await Similarity.findOneAndDelete({
        _id: id,
        userId,
      });

      if (!similarity) {
        return res.status(404).json({
          success: false,
          message: "Similarity record not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Similarity record deleted successfully",
      });
    } catch (error) {
      console.error("❌ Error in deleteSimilarity:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error while deleting similarity",
        error: error.message || "Unknown error",
      });
    }
  }
}

export default SimilarityController;
