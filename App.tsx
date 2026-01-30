import { useEffect, useState } from "react";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./pages/Dashboard";
import { observeAuth, logout } from "./services/authService";
import { UserRole } from "./types";

type AppUser = {
  uid?: string;
  email?: string;
  role?: UserRole;
};

function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = observeAuth((u: AppUser | null) => {
      setUser(u);
      setLoading(false);
    });

    // Cleanup tránh memory leak
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      alert("Đăng xuất thất bại, vui lòng thử lại.");
    }
  };

  /* =========================
     LOADING SCREEN (PRO UX)
  ========================= */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
        <div className="animate-pulse text-lg tracking-wide text-white/80">
          Đang khởi tạo hệ thống Lumina...
        </div>
      </div>
    );
  }

  /* =========================
     NOT LOGIN
  ========================= */
  if (!user) {
    return (
      <LoginScreen
        onSelectRole={(role: UserRole, data: any) => {
          // Dùng cho admin bypass hoặc login custom
          setUser({ role, ...data });
        }}
      />
    );
  }

  /* =========================
     LOGGED IN
  ========================= */
  return (
    <Dashboard
      userRole={user.role}
      userName={user.email || "Admin"}
      onLogout={handleLogout}
    />
  );
}

export default App;
