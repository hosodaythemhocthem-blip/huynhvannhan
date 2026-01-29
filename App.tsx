import { useEffect, useState } from "react";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./pages/Dashboard";
import { observeAuth, logout } from "./services/authService";
import { UserRole } from "./types";

type AppUser = {
  uid?: string;
  email?: string;
  role: UserRole;
};

function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // observeAuth nên trả về user đã gắn sẵn role từ Firestore
    const unsub = observeAuth((u: AppUser | null) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Loading đẹp hơn chút (UX tốt hơn)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="animate-pulse text-lg">Đang tải hệ thống...</div>
      </div>
    );
  }

  // Chưa đăng nhập → hiện Login
  if (!user) {
    return (
      <LoginScreen
        onSelectRole={(role: UserRole, data: any) => {
          // Cho phép login thủ công nếu bạn đang dùng bypass admin
          setUser({ role, ...data });
        }}
      />
    );
  }

  // Đã đăng nhập → vào Dashboard theo role
  return (
    <Dashboard
      userRole={user.role}
      userName={user.email || "Admin"}
      onLogout={async () => {
        await logout();
        setUser(null);
      }}
    />
  );
}

export default App;
