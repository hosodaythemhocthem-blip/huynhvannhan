import React, { useCallback, useMemo, useState } from "react";
import Dashboard from "./pages/Dashboard"; // ✅ QUAN TRỌNG: pages
import { UserRole, DashboardStats } from "./types";

type Page = "dashboard" | "courses" | "exams" | "reports" | "classes";

const App: React.FC = () => {
  const [role] = useState<UserRole>("TEACHER");
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  const stats: DashboardStats = useMemo(
    () => ({
      courses: 14,
      exams: 52,
      students: 840,
    }),
    []
  );

  const handleNavigate = useCallback((page: Page) => {
    setCurrentPage(page);
  }, []);

  const handleCreateExam = useCallback(() => {
    alert("Chuyển hướng đến module tạo đề thi AI...");
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-indigo-600">
            Lumina LMS
          </h1>

          <div className="hidden md:flex gap-6 text-sm font-semibold text-slate-600">
            <button onClick={() => handleNavigate("dashboard")}>Tổng quan</button>
            <button onClick={() => handleNavigate("courses")}>Khóa học</button>
            <button onClick={() => handleNavigate("exams")}>Đề thi</button>
            <button onClick={() => handleNavigate("reports")}>Báo cáo</button>
          </div>

          <div className="font-bold text-slate-700">Huỳnh Văn Nhẫn</div>
        </div>
      </nav>

      {/* ===== MAIN ===== */}
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
      </main>
    </div>
  );
};

export default App;
