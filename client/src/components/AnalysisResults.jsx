"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Check,
  X,
  CheckCircle,
  AlertTriangle,
  User,
  Users,
  ArrowLeft,
  Download,
} from "lucide-react";

const AnalysisResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const results = location.state?.analysisResults;

  // Redirect if no results data
  useEffect(() => {
    if (!results) {
      navigate("/job-ai");
    }
  }, [results, navigate]);

  // Return loading or redirect if no results
  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  // const handleBackToForm = () => {
  //   // Try multiple navigation approaches
  //   if (window.history.length > 1) {
  //     navigate(-1); // Go back to previous page
  //   } else {
  //     navigate("/job-ai", { replace: true }); // Fallback to job-ai route
  //   }
  // };
  const handleBackToForm = () => {
    // Try go back, but fallback if it fails
    if (
      document.referrer &&
      !document.referrer.includes(window.location.href)
    ) {
      navigate(-1); // try to go back
    } else {
      navigate("/job-ai"); // fallback
    }
  };

  // Circular Progress Bar Component
  const CircularProgress = ({ score, size = 120 }) => {
    const [animatedScore, setAnimatedScore] = useState(0);
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;

    useEffect(() => {
      const timer = setTimeout(() => {
        setAnimatedScore(score);
      }, 500);
      return () => clearTimeout(timer);
    }, [score]);

    const getColor = (score) => {
      if (score <= 40) return "#ef4444"; // red
      if (score < 70) return "#f59e0b"; // yellow
      return "#10b981"; // green
    };

    const strokeDasharray = circumference;
    const strokeDashoffset =
      circumference - (animatedScore / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="transparent"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor(score)}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </svg>
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-xl font-bold leading-none"
            style={{ color: getColor(score) }}
          >
            {animatedScore}%
          </motion.span>
        </div>
      </div>
    );
  };

  const getScoreMessage = (score) => {
    if (score >= 70) {
      return "Excellent match! Your resume aligns very well with the job requirements.";
    } else if (score > 40) {
      return "Partial match with room for improvement. Consider addressing the skill gaps below.";
    } else {
      return "Poor match. Significant skill development may be needed for this role.";
    }
  };

  let score;

  if (
    results.overallSimilarityScore > 78 ||
    results.overallSimilarityScore < 35
  ) {
    score = Math.round(
      results.overallSimilarityScore * 0.7 + results.semanticScore * 0.3
    );
  } else if (
    results.overallSimilarityScore >= 36 &&
    results.overallSimilarityScore <= 78
  ) {
    score = Math.round(
      results.overallSimilarityScore * 0.3 + results.semanticScore * 0.7
    );
  }

  // console.log(score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-20 pb-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-center mb-12"
        >
          <button
            onClick={handleBackToForm}
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Analysis Form</span>
          </button>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Resume Analysis Results
          </h1>
          <p className="text-xl text-gray-600">
            Detailed analysis of your resume against the job requirements
          </p>
        </motion.div>

        {/* Overall Similarity Score */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="bg-white rounded-3xl shadow-2xl p-8 mb-8"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Overall Similarity Score
            </h2>
            <div className="flex justify-center mb-6">
              <CircularProgress score={score} />
            </div>
            {/* <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {getScoreMessage(score)}
            </p> */}
            <p
              className={`text-lg max-w-2xl mx-auto ${
                score >= 70
                  ? "text-green-600"
                  : score > 40
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {getScoreMessage(score)}
            </p>
          </div>
        </motion.div>

        {/* Skills Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Matching Skills */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="flex items-center mb-6">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900">
                Matching Skills
              </h3>
            </div>
            <div className="space-y-3">
              {results.matchingStrengths &&
              results.matchingStrengths.length > 0 ? (
                results.matchingStrengths.map((skill, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                    className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-800 font-medium">{skill}</span>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <AlertTriangle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-600 font-medium">
                    No Matching Skills Found
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Missing Skills */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="flex items-center mb-6">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900">
                Missing Skills / Skill Gaps
              </h3>
            </div>
            <div className="space-y-3">
              {results.missingSkills && results.missingSkills.length > 0 ? (
                results.missingSkills.map((skill, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                    className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <X className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span className="text-gray-800 font-medium">{skill}</span>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <CheckCircle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-600 font-medium">
                    No Missing Skills
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Candidate Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="flex items-center mb-6">
              <User className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900">
                Recommendations for Candidates
              </h3>
            </div>
            <div className="space-y-4">
              {results.candidateRecommendations.map((recommendation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                  className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500"
                >
                  <p className="text-gray-700 leading-relaxed">
                    {recommendation}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recruiter Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="flex items-center mb-6">
              <Users className="w-6 h-6 text-purple-600 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900">
                Recommendations for Recruiters
              </h3>
            </div>
            <div className="space-y-4">
              {results.recruiterRecommendations.map((recommendation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                  className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500"
                >
                  <p className="text-gray-700 leading-relaxed">
                    {recommendation}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-center mt-12"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBackToForm}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
            >
              Analyze Another Resume
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.print()}
              className="px-8 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all shadow-lg flex items-center justify-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Download Report</span>
            </motion.button>
          </div>
          <p className="text-gray-600 mt-4">
            JobVector can make mistakes. Check important info.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AnalysisResults;
