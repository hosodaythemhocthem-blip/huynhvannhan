import React, { useEffect, useState } from "react";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./pages/Dashboard";
import { UserRole } from "./types";
import { AppUser, observeAuth, logout } from "./services/authService";

const App: React.FC = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     LẮNG NGHE AUTH (CHUẨN FIREBASE)
  ========================= */
  useEffect(() => {
    const unsubscribe = observeAuth((appUser) => {
      setUser(appUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* =========================
     LOADING – TRÁNH GIẬT UI
  ========================= */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Đang khởi tạo hệ thống Lumina LMS...
      </div>
    );
  }

  /* =========================
     CHƯA ĐĂNG NHẬP
  ========================= */
  if (!user) {
    return <LoginScreen />;
  }

  /* =========================
     ĐÃ ĐĂNG NHẬP
  ========================= */
  return (
    <Dashboard
      userRole={user.role}          // ⚠️ giữ nguyên prop
      userName={
        user.role === UserRole.ADMIN
          ? "Huỳnh Văn Nhẫn"
          : user.email
      }
      onLogout={async () => {
        await logout();
        setUser(null);
      }}
    />
  );
};

export default App;
