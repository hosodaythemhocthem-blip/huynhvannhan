import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabase";
import type { AppUser, UserRole } from "./types";

import LoginScreen from "./components/LoginScreen";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherPortal from "./pages/TeacherPortal";
import AdminDashboard from "./pages/AdminDashboard";

/* ================= APP ================= */

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= INIT AUTH ================= */

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session && mounted) {
        await loadProfile(session.user.id, session.user.email || "");
      }

      if (mounted) setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session) {
        await loadProfile(session.user.id, session.user.email || "");
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* ================= LOAD PROFILE ================= */

  const loadProfile = async (userId: string, email: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, role, display_name, approved")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setUser({
        id: data.id,
        role: data.role,
        full_name: data.display_name,
        approval_status: data.approved,
        email,
      });
    } else {
      setUser(null);
    }
  };

  /* ================= PROTECTED ROUTE ================= */

  const protect = (component: JSX.Element, allowed: UserRole[]) => {
    if (loading) return <FullScreenLoader />;

    if (!user) return <Navigate to="/" replace />;

    if (!allowed.includes(user.role)) {
      return <Navigate to="/" replace />;
    }

    // 🔥 CHẶN STUDENT CHƯA DUYỆT
    if (user.role === "student" && !user.approval_status) {
      return <PendingApproval />;
    }

    return component;
  };

  /* ================= ROOT REDIRECT ================= */

  const RootRedirect = () => {
    if (loading) return <FullScreenLoader />;

    if (!user) return <LoginScreen />;

    if (user.role === "teacher") {
      return <Navigate to="/teacher" replace />;
    }

    if (user.role === "student") {
      if (!user.approval_status) {
        return <PendingApproval />;
      }
      return <Navigate to="/student" replace />;
    }

    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/" replace />;
  };

  /* ================= ROUTES ================= */

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route
        path="/student"
        element={protect(<StudentDashboard />, ["student"])}
      />

      <Route
        path="/teacher"
        element={protect(<TeacherPortal user={user} />, ["teacher"])}
      />

      <Route
        path="/admin"
        element={protect(<AdminDashboard />, ["admin"])}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* ================= LOADING ================= */

function FullScreenLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 text-white text-xl font-semibold">
      <div className="animate-pulse">Đang tải hệ thống...</div>
    </div>
  );
}

/* ================= PENDING UI ================= */

function PendingApproval() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-yellow-500 to-orange-600 text-white text-center p-10">
      <div>
        <h1 className="text-3xl font-bold mb-4">
          Tài khoản đang chờ duyệt
        </h1>
        <p className="opacity-90">
          Vui lòng chờ giáo viên phê duyệt để vào lớp học.
        </p>
      </div>
    </div>
  );
}
