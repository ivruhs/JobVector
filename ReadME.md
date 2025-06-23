# 💼 JobVector – AI-Powered Resume-JD Matching Web App

> 🎯 **Revolutionize your hiring process with AI-powered resume analysis and semantic matching!**
> 📱 **Fully Responsive!**

## 🌟 Overview

**JobVector** is a full-stack AI Career Co-Pilot built with the MERN stack that helps users analyze their **resume** against a **job description (JD)** to determine how well they match. Powered by **Google Gemini AI** and **semantic search using vector embeddings**, it offers deep insight into **skills match**, **gaps**, and provides personalized recommendations for both **candidates** and **recruiters**.

## 🚀 Live Demo

👉 [Try the App](https://job-vector.vercel.app)  
📡 Backend hosted on Render  
🌐 Frontend hosted on Vercel

## ✨ Key Features

### 🔐 **Secure Authentication**

- JWT-based authentication system
- Secure user registration and login
- Protected routes and user sessions

### 👤 **User Profile Management**

- Complete profile customization
- Easy profile updates
- Personalized dashboard experience

### 📄 **Smart Document Processing**

- **PDF Resume Upload**: Seamless PDF parsing and text extraction
- **Job Description Input**: Text-based JD input for analysis
- **Real-time Processing**: Instant document analysis

### 🧠 **AI-Powered Analysis Engine**

#### 🔍 **Vector Embeddings & Semantic Search**

- **Text Chunking**: Intelligent segmentation of resume and JD content
- **Gemini Text-Embedding-004**: 768-dimensional vector embeddings
- **Supabase Vector Storage**: Efficient embedding storage and retrieval
- **Cosine Similarity**: Advanced mathematical similarity calculation
- **Semantic Search**: Context-aware matching beyond keyword matching

#### 📊 **Intelligent Insights**

- **Similarity Score**: Precise percentage-based matching score
- **Skill Matching**: Detailed breakdown of matching competencies
- **Skill Gap Analysis**: Identification of missing skills
- **Recruiter Recommendations**: AI-generated hiring insights
- **Candidate Guidance**: Personalized improvement suggestions

## 🛠️ Tech Stack

### Frontend 🎨

- **React.js**: Modern UI development
- **Framer Motion**: Smooth animations and transitions
- **Redux Toolkit**: State management
- **RTK Query**: Efficient data fetching
- **Tailwind CSS**: Utility-first styling

### Backend ⚙️

- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **JWT**: JSON Web Token authentication

### AI & ML 🤖

- **Google Gemini 1.5 Flash**: Advanced language model
- **Gemini Text-Embedding-004**: 768-dimensional embeddings
- **Vector Similarity Search**: Cosine similarity calculations
- **Semantic Analysis**: Context-aware text understanding

### Database & Storage 📚

- **MongoDB**: Primary database
- **Supabase**: Vector embedding storage
- **PDF Processing**: Document parsing capabilities

### Deployment 🚀

- **Vercel**: Frontend deployment
- **Render**: Backend deployment
- **Cloud Storage**: Scalable file management

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   AI Services   │
│   (React)       │◄──►│   (Node.js)      │◄──►│   (Gemini AI)   │
│                 │    │                  │    │                 │
│ • User Interface│    │ • API Endpoints  │    │ • Text Embedding│
│ • State Mgmt    │    │ • Authentication │    │ • Similarity    │
│ • Animations    │    │ • File Processing│    │ • Insights Gen  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Databases     │
                       │                 │
                       │ • MongoDB       │
                       │ • Supabase      │
                       │ • Vector Store  │
                       └─────────────────┘
```

## 🚀 Getting Started

### Prerequisites 📋

```bash
Node.js >= 16.0.0
npm >= 8.0.0
MongoDB
Supabase Account
Google AI API Key
```

### Installation 💻

1. **Clone the repository**

```bash
git clone https://github.com/ivruhs/JobVector.git
cd JobVector
```

2. **Install dependencies**

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. **Environment Configuration**

Create `.env` file in root directory:

**Backend `.env`:**

```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GOOGLE_AI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

4. **Start the application**

```bash
# Start backend server
cd server
npm run dev

# Start frontend development server
cd ../client
npm run dev
```

## 🔬 How It Works

### 1. 📤 **Document Upload**

Users upload their resume (PDF format) and paste the job description text.

### 2. 🔄 **Text Processing**

- PDF is parsed and converted to plain text
- Both resume and JD texts are cleaned and preprocessed
- Content is intelligently chunked for optimal analysis

### 3. 🧮 **Vector Embedding Generation**

- Text chunks are converted to 768-dimensional vectors using **Gemini Text-Embedding-004**
- Embeddings capture semantic meaning beyond simple keywords
- Vectors are stored in Supabase for efficient retrieval

### 4. 🔍 **Semantic Similarity Analysis**

- **Cosine similarity** calculation between resume and JD vectors
- Advanced mathematical approach: `similarity = (A · B) / (||A|| × ||B||)`
- Context-aware matching that understands synonyms and related concepts

### 5. 📊 **AI-Powered Insights**

- **Gemini 1.5 Flash** analyzes the matching results
- Generates comprehensive reports including:
  - Skill alignment analysis
  - Gap identification
  - Improvement recommendations
  - Hiring insights

### 6. 📈 **Results Presentation**

- Interactive dashboard with similarity scores
- Detailed breakdowns and visualizations
- Actionable recommendations for both parties

## 📱 Features Showcase

### 🎨 **Beautiful UI/UX**

- Responsive design for all devices
- Smooth animations with Framer Motion
- Intuitive user interface
- Real-time feedback and loading states

### 📊 **Advanced Analytics**

- Comprehensive similarity scoring
- Skill gap visualization
- Recommendation engine
- Historical analysis tracking

### 🔒 **Security Features**

- JWT-based authentication
- Secure file upload handling
- Data encryption
- Privacy-focused design

## 🚀 Deployment

The application is deployed on **Vercel** (frontend) & **Render** (backend) for optimal performance and scalability.

### Deploy Your Own

1. Fork this repository
2. Connect to Vercel
3. Setup backend on Render
4. Configure environment variables
5. Deploy with one click!

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- **Google Gemini AI** & **Groq AI**for powerful language models
- **Supabase** for vector database capabilities
- **Vercel** & **Render** for seamless deployment
- **Open source community** for amazing libraries

## 📞 Contact

**Shubham Prasad** - radhakrishn0181@gmail.com

Project Link: [https://github.com/ivruhs/JobVector](https://github.com/yourusername/resume-analyzer)

---

### 🌟 Star this repository if you found it helpful! 🌟

**Made with ❤️ and cutting-edge AI technology**

**IvRuHs**
