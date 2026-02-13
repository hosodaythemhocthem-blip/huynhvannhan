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

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) await loadProfile(session.user.id);
      setLoading(false);
    };

    init();

    const { data } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) await loadProfile(session.user.id);
        else setUser(null);
      }
    );

    return () => data.subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) setUser(data);
  };

  const protect = (component: JSX.Element, allowed: UserRole[]) => {
    if (loading) return <FullScreenLoader />;
    if (!user) return <Navigate to="/" replace />;
    if (!allowed.includes(user.role))
      return <Navigate to="/" replace />;

    if (
      user.role === "student" &&
      user.approval_status !== "approved"
    ) {
      return <PendingApproval />;
    }

    return component;
  };

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
    </Routes>
  );
}

function FullScreenLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
      Đang tải...
    </div>
  );
}

function PendingApproval() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-yellow-500 text-white">
      Tài khoản đang chờ duyệt
    </div>
  );
}
