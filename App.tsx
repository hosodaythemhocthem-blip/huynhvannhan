import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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
      .select("id, role, full_name, approval_status")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setUser({
        id: data.id,
        role: data.role,
        full_name: data.full_name,
        approval_status: data.approval_status,
        email,
      });
    }
  };

  /* ================= PROTECTED ================= */

  const protect = (component: JSX.Element, allowed: UserRole[]) => {
    if (loading) return <div className="p-10">Đang tải...</div>;

    if (!user) return <Navigate to="/" replace />;

    if (!allowed.includes(user.role)) {
      return <Navigate to="/" replace />;
    }

    return component;
  };

  /* ================= ROUTES ================= */

  return (
    <Routes>
      <Route path="/" element={<LoginScreen />} />

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
