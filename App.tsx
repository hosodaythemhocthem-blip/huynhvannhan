import React, { useCallback, useMemo, useState } from "react";
import Dashboard from "./components/Dashboard";
import { UserRole, DashboardStats } from "./types";

/* ================= TYPES ================= */

type Page = "dashboard" | "courses" | "exams" | "reports" | "classes";

/* ================= APP ================= */

const App: React.FC = () => {
  const [role] = useState<UserRole>("TEACHER");
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  /**
   * 📊 Stats – sau này thay bằng Firestore selector
   */
  const stats: DashboardStats = useMemo(
    () => ({
      courses: 14,
      exams: 52,
      students: 840,
    }),
    []
  );

  /**
   * 🚀 Điều hướng trung tâm
   */
  const handleNavigate = useCallback((page: Page) => {
    setCurrentPage(page);
  }, []);

  /**
   * 🧠 Tạo đề thi (hook sang module AI)
   */
  const handleCreateExam = useCallback(() => {
    // Sau này thay bằng: navigate("exams/create")
    alert("Chuyển hướng đến module tạo đề thi AI...");
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* ================= NAVBAR ================= */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="text-white font-black text-xl italic">L</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-800">
              Lumina{" "}
              <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4">
                LMS
              </span>
            </h1>
          </div>

          {/* Menu */}
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <button
              onClick={() => handleNavigate("dashboard")}
              className="text-indigo-600"
            >
              Tổng quan
            </button>
            <button
              onClick={() => handleNavigate("courses")}
              className="hover:text-indigo-600 transition-colors"
            >
              Khóa học
            </button>
            <button
              onClick={() => handleNavigate("exams")}
              className="hover:text-indigo-600 transition-colors"
            >
              Đề thi
            </button>
            <button
              onClick={() => handleNavigate("reports")}
              className="hover:text-indigo-600 transition-colors"
            >
              Báo cáo
            </button>
          </div>

          {/* User */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-black text-slate-800 leading-none">
                Huỳnh Văn Nhẫn
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Giảng viên cấp cao
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 border-2 border-white shadow-sm flex items-center justify-center text-indigo-600 font-bold">
              HVN
            </div>
          </div>
        </div>
      </nav>

      {/* ================= MAIN ================= */}
      <main>
        {currentPage === "dashboard" && (
          <Dashboard
            userRole={role}
            userName="Huỳnh Văn Nhẫn"
            stats={stats}
            onNavigate={handleNavigate}
            onCreateExam={handleCreateExam}
          />
        )}

        {/* 
          👉 Các page khác để sẵn:
          {currentPage === "courses" && <CoursesPage />}
          {currentPage === "exams" && <ExamsPage />}
          {currentPage === "reports" && <ReportsPage />}
        */}
      </main>
    </div>
  );
};

export default App;
