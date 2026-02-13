import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabase";

import LoginScreen from "./components/LoginScreen";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherPortal from "./pages/TeacherPortal";
import AdminDashboard from "./pages/AdminDashboard";

type UserRole = "student" | "teacher" | "admin";

interface AppUser {
  id: string;
  role: UserRole;
}

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= AUTH INIT ================= */

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session && mounted) {
        await loadProfile(data.session.user.id);
      }

      if (mounted) setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session) {
        await loadProfile(session.user.id);
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

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setUser({
        id: data.id,
        role: data.role,
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
        element={protect(<TeacherPortal />, ["teacher"])}
      />

      <Route
        path="/admin"
        element={protect(<AdminDashboard />, ["admin"])}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
