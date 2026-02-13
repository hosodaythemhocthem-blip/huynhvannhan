import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import type { AppUser, UserRole } from "./types";

import LoginScreen from "./components/LoginScreen";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherPortal from "./pages/TeacherPortal";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= AUTH INIT ================= */

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
    }
  };

  /* ================= PROTECTED ================= */

  const protect = (component: JSX.Element, allowed: UserRole[]) => {
    if (loading) return <FullScreenLoader />;

    if (!user) return <Navigate to="/" replace />;

    if (!allowed.includes(user.role)) {
      return <Navigate to="/" replace />;
    }

    return component;
  };

  /* ================= REDIRECT ROOT ================= */

  const RootRedirect = () => {
    if (loading) return <FullScreenLoader />;

    if (!user) {
      return <LoginScreen onLoginSuccess={() => {}} />;
    }

    if (user.role === "teacher") {
      return <Navigate to="/teacher" replace />;
    }

    if (user.role === "student") {
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

/* ================= LOADING UI ================= */

function FullScreenLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 text-white text-xl font-semibold">
      <div className="animate-pulse">Đang tải hệ thống...</div>
    </div>
  );
}
