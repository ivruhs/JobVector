"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  Briefcase,
  Check,
  X,
  Edit3,
  Save,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useUploadResumeMutation } from "../redux/api/resumeApiSlice";
import { useCompleteAnalysisMutation } from "../redux/api/completeApiSlice";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const ResumeAnalyzer = () => {
  const { userInfo } = useSelector((state) => state.auth);
  if (!userInfo) {
    toast.error("Please log in to access the Resume Analyzer");
  }

  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState(null);
  const [parsedText, setParsedText] = useState("");
  const [editedText, setEditedText] = useState("");
  const [isEditingResume, setIsEditingResume] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // API mutations
  const [uploadResume, { isLoading: isUploading, error: uploadError }] =
    useUploadResumeMutation();
  const [completeAnalysis, { isLoading: isAnalyzing, error: analysisError }] =
    useCompleteAnalysisMutation();

  // Combined loading state
  const isSubmitting = isUploading || isAnalyzing;

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setErrors({ resume: "Please upload a PDF file only" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ resume: "File size must be less than 5MB" });
        return;
      }

      setResumeFile(file);
      setErrors({});

      // Upload and parse the resume
      try {
        const formData = new FormData();
        formData.append("resume", file);

        const result = await uploadResume(formData).unwrap();

        // FIXED: Access parsedText directly from result, not result.data
        if (result && result.parsedText) {
          setParsedText(result.parsedText);
          setEditedText(result.parsedText);
          // console.log("Parsed text set successfully!");
        } else {
          console.error("No parsedText found in result");
          setErrors({ resume: "PDF uploaded but no text could be extracted." });
        }
      } catch (error) {
        console.error("Resume upload failed:", error);
        setErrors({
          resume: "Failed to upload and parse resume. Please try again.",
        });
        setResumeFile(null);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const event = { target: { files: [file] } };
      handleFileUpload(event);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!resumeFile) {
      newErrors.resume = "Please upload your resume";
    }

    if (!parsedText || !parsedText.trim()) {
      newErrors.resume = "Resume text is required. Please upload a valid PDF.";
    }

    if (!jobDescription.trim()) {
      newErrors.jobDescription = "Please paste the job description";
    } else if (jobDescription.trim().length < 50) {
      newErrors.jobDescription =
        "Job description seems too short (minimum 50 characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Use edited text if user has made changes, otherwise use parsed text
      const finalResumeText = isEditingResume ? editedText : parsedText;

      const result = await completeAnalysis({
        resumeText: finalResumeText,
        jobDescriptionText: jobDescription,
      }).unwrap();

      // Navigate to results page with the analysis data
      if (result.success && result.data) {
        // console.log(result.data);
        // Navigate to results page and pass the data via state
        navigate("/analysis-results", {
          state: { analysisResults: result.data },
        });
      } else {
        setErrors({ submit: "Analysis failed. Please try again." });
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      setErrors({
        submit: error?.data?.message || "Analysis failed. Please try again.",
      });
    }
  };

  const handleSaveEdit = () => {
    setParsedText(editedText);
    setIsEditingResume(false);
  };

  const handleCancelEdit = () => {
    setEditedText(parsedText);
    setIsEditingResume(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
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
          className="text-center mb-12 pt-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Resume Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upload your resume and paste the job description to get a
            comprehensive analysis with actionable insights
          </p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Resume Upload & Parsing */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="space-y-6"
            >
              {/* Resume Upload Section */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center mb-6">
                  <FileText className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Upload Resume (PDF)
                  </h2>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 ${
                    resumeFile
                      ? "border-green-400 bg-green-50/50"
                      : "border-gray-300"
                  } ${errors.resume ? "border-red-400 bg-red-50/50" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />

                  {resumeFile ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4"
                    >
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {resumeFile.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setResumeFile(null);
                          setParsedText("");
                          setEditedText("");
                        }}
                        className="text-red-600 hover:text-red-700 font-medium"
                        disabled={isUploading}
                      >
                        Remove File
                      </button>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      {isUploading ? (
                        <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
                      ) : (
                        <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      )}
                      <div>
                        <p className="text-lg font-semibold text-gray-700">
                          {isUploading
                            ? "Uploading and parsing..."
                            : "Drop your PDF here or click to browse"}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Maximum file size: 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {errors.resume && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm mt-3 flex items-center"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {errors.resume}
                  </motion.p>
                )}
              </div>

              {/* Parsed Text Section */}
              {parsedText && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-xl p-8"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      Parsed Resume Text
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditingResume(!isEditingResume)}
                      className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      disabled={isSubmitting}
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>{isEditingResume ? "Cancel" : "Edit"}</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {isEditingResume ? (
                      <div className="space-y-4">
                        <textarea
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          className="w-full h-80 p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none font-mono text-sm"
                          placeholder="Edit your parsed resume text..."
                          disabled={isSubmitting}
                        />
                        <div className="flex space-x-3">
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
                            disabled={isSubmitting}
                          >
                            <Save className="w-4 h-4" />
                            <span>Save Changes</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all disabled:opacity-50"
                            disabled={isSubmitting}
                          >
                            <X className="w-4 h-4" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-6 max-h-80 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                          {parsedText}
                        </pre>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Right Side - Job Description */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-xl p-8 h-full">
                <div className="flex items-center mb-6">
                  <Briefcase className="w-6 h-6 text-indigo-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Paste Job Description
                  </h2>
                </div>

                <div className="space-y-4">
                  <textarea
                    value={jobDescription}
                    onChange={(e) => {
                      setJobDescription(e.target.value);
                      if (errors.jobDescription) {
                        setErrors((prev) => ({ ...prev, jobDescription: "" }));
                      }
                    }}
                    className={`w-full h-96 p-6 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-lg ${
                      errors.jobDescription
                        ? "border-red-500"
                        : "border-gray-200 hover:border-indigo-300"
                    }`}
                    placeholder="Paste the complete job description here...

Example:
We are looking for a Senior Software Engineer to join our team...

Requirements:
• 5+ years of experience in software development
• Proficiency in React, Node.js, and modern web technologies
• Experience with cloud platforms (AWS, GCP, Azure)
• Strong problem-solving skills
• Bachelor's degree in Computer Science or related field

Responsibilities:
• Design and develop scalable web applications
• Collaborate with cross-functional teams
• Mentor junior developers
• Participate in code reviews and technical discussions"
                    disabled={isSubmitting}
                  />

                  {errors.jobDescription && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm flex items-center"
                    >
                      <X className="w-4 h-4 mr-1" />
                      {errors.jobDescription}
                    </motion.p>
                  )}

                  <div className="text-sm text-gray-500">
                    Characters: {jobDescription.length}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-12 text-center"
          >
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-12 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 mx-auto shadow-2xl hover:shadow-3xl transform hover:scale-105"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>
                    {isUploading ? "Processing Resume..." : "Analyzing..."}
                  </span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-6 h-6" />
                  <span>Analyze Resume</span>
                </>
              )}
            </button>

            {errors.submit && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm mt-4 flex items-center justify-center"
              >
                <X className="w-4 h-4 mr-1" />
                {errors.submit}
              </motion.p>
            )}

            <p className="text-gray-600 mt-4">
              Get comprehensive insights including similarity score, skill
              analysis, and personalized recommendations
            </p>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default ResumeAnalyzer;
