import React, { useState, useEffect, useCallback } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { User } from "./types";
import { authService } from "./services/authService";
import { ToastProvider } from "./components/Toast";

import Layout from "./components/Layout";
import LoginScreen from "./pages/LoginScreen";
import TeacherPortal from "./pages/TeacherPortal";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";

/* =========================================================
   VERSION CONTROL – tránh cache lỗi sau deploy
========================================================= */
const APP_VERSION = "7.0.0-SUPABASE-STABLE";

/* =========================================================
   Pending Approval Screen
========================================================= */
const PendingScreen = ({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-white text-center"
  >
    <div className="max-w-md bg-white/5 backdrop-blur-3xl p-12 rounded-[3rem] border border-white/10 shadow-2xl">
      <div className="w-20 h-20 bg-amber-500/20 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse">
        <svg
          className="w-10 h-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-black mb-4 uppercase italic tracking-wide">
        Đang chờ phê duyệt
      </h2>

      <p className="text-slate-400 mb-6 text-sm leading-relaxed">
        Chào <b>{user.fullName}</b> 👋 <br />
        Tài khoản của em đang chờ giáo viên phê duyệt.
      </p>

      <button
        onClick={onLogout}
        className="w-full py-4 bg-white text-slate-900 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all hover:bg-indigo-100"
      >
        ĐĂNG XUẤT
      </button>
    </div>
  </motion.div>
);

/* =========================================================
   MAIN APP
========================================================= */
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  /* =========================================================
     VERSION GUARD – tránh reload loop
  ========================================================= */
  useEffect(() => {
    const storedVersion = localStorage.getItem("app_version");

    if (storedVersion !== APP_VERSION) {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("app_version", APP_VERSION);
    }
  }, []);

  /* =========================================================
     INIT AUTH
  ========================================================= */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedUser = await authService.getCurrentUser();
        if (savedUser) {
          setUser(savedUser);
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /* =========================================================
     HANDLERS
  ========================================================= */
  const handleLogin = useCallback((u: User) => {
    setUser(u);
    setActiveTab("dashboard");
  }, []);

  const handleLogout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  if (loading) return null;

  const isAdmin =
    user?.email === "huynhvannhan@gmail.com" && user.role === "teacher";

  return (
    <ToastProvider>
      <Router>
        <AnimatePresence mode="wait">
          {!user ? (
            <Routes>
              <Route path="*" element={<LoginScreen onLogin={handleLogin} />} />
            </Routes>
          ) : user.role === "student" && !user.isApproved ? (
            <Routes>
              <Route
                path="*"
                element={<PendingScreen user={user} onLogout={handleLogout} />}
              />
            </Routes>
          ) : (
            <Layout
              user={user}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onLogout={handleLogout}
            >
              <Routes>
                {user.role === "teacher" ? (
                  <>
                    <Route
                      path="/admin"
                      element={
                        isAdmin ? (
                          <AdminDashboard />
                        ) : (
                          <Navigate to="/" />
                        )
                      }
                    />
                    <Route
                      path="*"
                      element={
                        <TeacherPortal user={user} activeTab={activeTab} />
                      }
                    />
                  </>
                ) : (
                  <Route
                    path="*"
                    element={
                      <StudentDashboard
                        user={user}
                        activeTab={activeTab}
                        onStartExam={(exam) => {
                          console.log("Start exam:", exam);
                        }}
                      />
                    }
                  />
                )}
              </Routes>
            </Layout>
          )}
        </AnimatePresence>
      </Router>
    </ToastProvider>
  );
};

export default App;
