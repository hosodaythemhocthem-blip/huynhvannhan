import React, { useCallback, useMemo, useState } from "react";
import Dashboard from "./pages/Dashboard";
import LoginScreen from "./components/LoginScreen";
import { UserRole, DashboardStats } from "./types";

type Page = "dashboard" | "courses" | "exams" | "reports" | "classes";

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  const stats: DashboardStats = useMemo(
    () => ({
      courses: 14,
      exams: 52,
      students: 840,
    }),
    []
  );

  const handleLogin = useCallback((role: UserRole, data?: any) => {
    setRole(role);
    setUserData(data || null);
  }, []);

  const handleLogout = useCallback(() => {
    setRole(null);
    setUserData(null);
  }, []);

  const handleNavigate = useCallback((page: Page) => {
    setCurrentPage(page);
  }, []);

  const handleCreateExam = useCallback(() => {
    alert("Chuyển sang module tạo đề thi AI");
  }, []);

  /* ================= CHƯA ĐĂNG NHẬP ================= */
  if (!role) {
    return <LoginScreen onSelectRole={handleLogin} />;
  }

  /* ================= ĐÃ ĐĂNG NHẬP ================= */
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <main>
        <Dashboard
          userRole={role}
          userName={userData?.name || "Huỳnh Văn Nhẫn"}
          stats={stats}
          onNavigate={handleNavigate}
          onCreateExam={handleCreateExam}
          onLogout={handleLogout}
        />
      </main>
    </div>
  );
};

export default App;
