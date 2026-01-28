import React, { useState } from "react";
import {
  GraduationCap,
  Briefcase,
  ShieldCheck,
  ArrowLeft,
  LogIn,
} from "lucide-react";

type Role = "TEACHER" | "STUDENT" | "ADMIN";
type View = "select" | "login";

interface Props {
  onLoginSuccess: (role: Role) => void;
}

const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<View>("select");
  const [role, setRole] = useState<Role | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSelectRole = (r: Role) => {
    setRole(r);
    setView("login");
    setError("");
    setUsername("");
    setPassword("");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // ✅ CHỈ ADMIN HOẠT ĐỘNG
    if (role === "ADMIN") {
      if (
        username === "huynhvannhan" &&
        password === "huynhvanhan2020aA@"
      ) {
        onLoginSuccess("ADMIN");
      } else {
        setError("❌ Sai tài khoản hoặc mật khẩu Admin");
      }
      return;
    }

    // 🚧 ROLE KHÁC CHƯA MỞ
    setError("⚠️ Chức năng đăng nhập vai trò này chưa được kích hoạt");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 px-6">
      {/* ===== CHỌN VAI TRÒ ===== */}
      {view === "select" && (
        <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl p-12">
          <div className="text-center mb-14">
            <h1 className="text-5xl font-extrabold text-slate-800">
              LMS Toán học
            </h1>
            <p className="mt-3 text-slate-500 text-sm uppercase tracking-widest">
              Hệ thống quản lý học tập
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div
              onClick={() => handleSelectRole("TEACHER")}
              className="cursor-pointer rounded-2xl p-8 bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl hover:scale-[1.03] transition"
            >
              <Briefcase size={44} className="mb-6" />
              <h2 className="text-2xl font-extrabold">Giáo viên</h2>
            </div>

            <div
              onClick={() => handleSelectRole("STUDENT")}
              className="cursor-pointer rounded-2xl p-8 bg-white border border-slate-200 shadow hover:shadow-xl hover:scale-[1.03] transition"
            >
              <GraduationCap size={44} className="text-orange-500 mb-6" />
              <h2 className="text-2xl font-extrabold text-slate-800">
                Học sinh
              </h2>
            </div>

            <div
              onClick={() => handleSelectRole("ADMIN")}
              className="cursor-pointer rounded-2xl p-8 bg-slate-900 text-white shadow-xl hover:scale-[1.03] transition"
            >
              <ShieldCheck size={44} className="mb-6 text-emerald-400" />
              <h2 className="text-2xl font-extrabold">Quản trị</h2>
            </div>
          </div>
        </div>
      )}

      {/* ===== FORM ĐĂNG NHẬP ===== */}
      {view === "login" && (
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10">
          <button
            onClick={() => setView("select")}
            className="flex items-center gap-2 text-sm text-slate-500 mb-6"
          >
            <ArrowLeft size={18} /> Quay lại
          </button>

          <h2 className="text-3xl font-extrabold mb-6 text-slate-800">
            Đăng nhập {role === "ADMIN" && "Quản trị"}
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tên đăng nhập"
              className="w-full px-4 py-3 rounded-xl border"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              className="w-full px-4 py-3 rounded-xl border"
              required
            />

            {error && (
              <div className="text-sm text-red-600 font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700"
            >
              <LogIn size={18} /> Đăng nhập
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
