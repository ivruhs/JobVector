import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

import Navbar from "./components/Navbar";
import UpdateProfile from "./pages/UpdateProfile";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import AnalysisResults from "./components/AnalysisResults";

function App() {
  const { userInfo } = useSelector((state) => state.auth);
  const isAuthenticated = Boolean(userInfo);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <ToastContainer />
        <AnimatePresence mode="wait">
          {isAuthenticated ? (
            <>
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />

                <Route path="/profile" element={<UpdateProfile />} />
                <Route path="/job-ai" element={<ResumeAnalyzer />} />
                <Route path="/analysis-results" element={<AnalysisResults />} />
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="/register" element={<Navigate to="/" replace />} />
              </Routes>
            </>
          ) : (
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default App;
