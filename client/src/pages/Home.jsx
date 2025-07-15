"use client";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import {
  Upload,
  Brain,
  Search,
  Lightbulb,
  FileText,
  Zap,
  Target,
  CheckCircle,
  XCircle,
  Github,
  Mail,
  Instagram,
  Linkedin,
  Heart,
  ArrowRight,
  Phone,
  Sparkles,
  MapPin,
} from "lucide-react";

const Home = () => {
  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      details: "radhakrishn0181@gmail.com",
      description: "Send us an email anytime!",
    },
    {
      icon: Phone,
      title: "Call Us",
      details: "+91 9998258453",
      description: "Give us a ring anytime",
    },
    {
      icon: MapPin,
      title: "Visit Us",
      details: "E-105, DAU",
      description: "Gandhinagar, Gujarat",
    },
  ];
  const navigate = useNavigate();
  const techStack = [
    {
      feature: "📄 Resume Parsing",
      tech: "PDF.js / custom parser",
      icon: FileText,
    },
    {
      feature: "🧠 Embedding Generation",
      tech: "Gemini Text-Embedding-04 Model",
      icon: Brain,
    },
    {
      feature: "🧭 Vector Database",
      tech: "Supabase Postgres + pgvector",
      icon: Search,
    },
    {
      feature: "🔍 Semantic Similarity",
      tech: "Cosine Similarity between 384D vectors",
      icon: Target,
    },
    {
      feature: "💬 LLM Insights",
      tech: "Gemini 1.5 Flash",
      icon: Lightbulb,
    },
    {
      feature: "🛠️ Full Stack",
      tech: "MERN Stack (MongoDB, Express, React, Node)",
      icon: Zap,
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Upload Resume PDF + Paste Job Description",
      description: "PDF parsed to text, JD taken directly",
      icon: Upload,
      color: "from-blue-500 to-cyan-500",
    },
    {
      number: "02",
      title: "AI Embedding Generation",
      description:
        "Uses 768-dimension sentence embeddings via Gemini text-embeddings-04 model. Stored in Supabase vector DB",
      icon: Brain,
      color: "from-purple-500 to-pink-500",
    },
    {
      number: "03",
      title: "Semantic Search (Cosine Similarity)",
      description:
        "Resume and JD chunks compared for deep match understanding. Unlike keyword matching, this captures meaning",
      icon: Search,
      color: "from-green-500 to-emerald-500",
    },
    {
      number: "04",
      title: "AI Insights with Gemini 1.5 Flash",
      description:
        "Matching skills, missing skills, role-fit suggestions for both candidate and recruiter",
      icon: Lightbulb,
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-white ">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-20 pb-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="flex justify-center mb-6"
            >
              <span className="text-4xl">🚀</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6"
            >
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Smarter Resume Matching,
              </span>
              <br />
              <span className="text-gray-800">
                Powered by AI & Semantic Search
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed"
            >
              Upload your resume, paste a job description, and get instant
              insights – match score, strengths, gaps, and personalized tips.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/job-ai")}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                Analyze My Resume
                <ArrowRight size={20} />
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Floating Elements */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 blur-xl"
        />
        <motion.div
          animate={{
            y: [0, 30, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 blur-xl"
        />
      </motion.section>

      {/* How It Works Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 px-4 bg-white"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
              <span>🧠</span>
              How It Works – The AI/ML Magic
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our advanced pipeline combines cutting-edge AI technologies to
              understand the true meaning behind resumes and job descriptions.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.8 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                    <div className="flex items-start gap-6">
                      <div
                        className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon className="text-white" size={28} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                            STEP {step.number}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                          {step.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Tech Stack Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 px-4 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              What Powers JobVector?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built with cutting-edge AI and machine learning technologies for
              developers and tech enthusiasts.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.8 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border border-gray-100"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="text-white" size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-2">
                        {item.feature}
                      </h3>
                      <p className="text-gray-600 text-sm">{item.tech}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          ></motion.div>
        </div>
      </motion.section>

      {/* Semantic vs Keyword Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 px-4 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Go Beyond Keywords: Why Semantic Matching Matters
            </h2>
          </motion.div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Resume says:</h3>
                  <p className="text-gray-700 italic">
                    "Developed scalable APIs"
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">JD says:</h3>
                  <p className="text-gray-700 italic">
                    "Looking for backend engineers experienced with REST
                    services"
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-red-500">
                  <div className="flex items-center gap-3 mb-3">
                    <XCircle className="text-red-500" size={24} />
                    <h3 className="font-bold text-gray-900">
                      Traditional tools:
                    </h3>
                  </div>
                  <p className="text-gray-700">
                    ❌ No direct keyword overlap (no mention of “REST” or
                    “backend engineer” in resume)
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="text-green-500" size={24} />
                    <h3 className="font-bold text-gray-900">Semantic AI:</h3>
                  </div>
                  <p className="text-gray-700">
                    ✅ Understands that “scalable APIs” implies backend
                    development and RESTful services → strong semantic match
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Results Snapshot Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 px-4 bg-gray-50"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Results Snapshot
            </h2>
            <p className="text-xl text-gray-600">
              See what insights you'll get from our AI analysis
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">85%</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    ✅ Match Score: 85%
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">🟢</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Strengths:
                      </h4>
                      <p className="text-gray-600">React, REST APIs, MongoDB</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-500 text-xl">🔴</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">Gaps:</h4>
                      <p className="text-gray-600">DevOps, AWS</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-500 text-xl">💡</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Candidate Tip:
                      </h4>
                      <p className="text-gray-600">
                        Learn basic cloud deployment
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-500 text-xl">💡</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Recruiter Tip:
                      </h4>
                      <p className="text-gray-600">
                        Good frontend skills, but backend limited
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Live Demo CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Try It Now – Live Demo
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            viewport={{ once: true }}
            className="text-xl text-blue-100 mb-8"
          >
            Experience the power of semantic matching in seconds. Upload your
            resume and see the magic happen.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/job-ai")}
              className="px-8 py-4 bg-white text-blue-600 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Upload size={20} />
              Upload Resume
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/job-ai")}
              className="px-8 py-4 border-2 border-white text-white rounded-full font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all"
            >
              Paste Job Description
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      {/* Contact Us Section */}

      {/* Contact Info Cards */}
      <div className="pt-16 min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="py-20 px-4"
        >
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-6"
            >
              Get In Touch
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl text-gray-600 mb-8"
            >
              We'd love to hear from you. Send us a message and we'll respond as
              soon as possible.
            </motion.p>
          </div>
        </motion.section>
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="py-12 px-4"
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.8 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -10 }}
                    className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all text-center"
                  >
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Icon className="text-white" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {info.title}
                    </h3>
                    <p className="text-lg font-semibold text-emerald-600 mb-2">
                      {info.details}
                    </p>
                    <p className="text-gray-600">{info.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="text-blue-400" />
                JobVector
              </h3>
              <p className="text-gray-400 mb-6 max-w-md">
                Smart. Fair. AI-Powered Hiring Fit Analysis. Resume Matching
                Reimagined with Vectors + Gemini AI.
              </p>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">Built with</span>
                <Heart className="text-red-500" size={16} />
                <span className="text-sm text-gray-400">
                  using MERN, Groq AI (llama), Supabase, Gemini AI
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">About</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <p className="hover:text-white transition-colors">
                    Shubham Prasad
                  </p>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="https://github.com/ivruhs"
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Github size={16} />
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.linkedin.com/in/shubham-prasad-67b104324/"
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Linkedin size={16} />
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:radhakrishn0181@gmail.com"
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Mail size={16} />
                    Email
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.instagram.com/ivruhs/"
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Instagram size={16} />
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025. IvRuHs. All Rights Reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
