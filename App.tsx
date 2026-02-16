import React, { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// FIX: Xóa đuôi .ts/.tsx để tránh lỗi TS5097
import { User } from "./types";
import { authService } from "./services/authService";
import { ToastProvider } from "./components/Toast";
import { AnimatePresence, motion } from "framer-motion";

// Layout & Pages
import Layout from "./components/Layout";
import LoginScreen from "./pages/LoginScreen";
import TeacherPortal from "./pages/TeacherPortal";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";

const APP_VERSION = "6.0.0-ELITE-FINAL";

const PendingScreen = ({ user, onLogout }: { user: User, onLogout: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-white text-center"
  >
    <div className="max-w-md bg-white/5 backdrop-blur-3xl p-12 rounded-[3.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
      <div className="w-20 h-20 bg-amber-500/20 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-pulse">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
      <h2 className="text-2xl font-black mb-4 uppercase italic">Đang chờ phê duyệt</h2>
      <p className="text-slate-400 mb-6 text-sm">
        Chào <b>{user.fullName}</b>! Thầy <b>Nhẫn</b> sẽ phê duyệt tài khoản của em sớm thôi.
      </p>
      <button onClick={onLogout} className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl">ĐĂNG XUẤT</button>
    </div>
  </motion.div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const lastVersion = localStorage.getItem('app_version');
    if (lastVersion !== APP_VERSION) {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('app_version', APP_VERSION);
      window.location.reload();
      return;
    }

    const initAuth = async () => {
      try {
        const saved = authService.getCurrentUser();
        if (saved) setUser(saved);
      } catch (e) {
        console.warn("Auth init failed");
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (loading) return null;

  return (
    <ToastProvider>
      <Router>
        <AnimatePresence mode="wait">
          {!user ? (
            <Routes>
              <Route path="*" element={<LoginScreen onLogin={handleLogin} />} />
            </Routes>
          ) : user.role === 'student' && !user.isApproved ? (
            <Routes>
              <Route path="*" element={<PendingScreen user={user} onLogout={handleLogout} />} />
            </Routes>
          ) : (
            <Layout user={user} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout}>
              <Routes>
                {user.role === 'teacher' ? (
                  <>
                    <Route path="/admin" element={user.email === 'huynhvannhan@gmail.com' ? <AdminDashboard /> : <Navigate to="/" />} />
                    <Route path="*" element={<TeacherPortal user={user} activeTab={activeTab} />} />
                  </>
                ) : (
                  // FIX LỖI TS2322: Truyền thêm onStartExam hoặc spread các props cần thiết
                  <Route path="*" element={
                    <StudentDashboard 
                      user={user} 
                      activeTab={activeTab} 
                      onStartExam={(exam: any) => console.log(exam)} 
                    />
                  } />
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
