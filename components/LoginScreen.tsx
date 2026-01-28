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

  const handleSelectRole = (r: Role) => {
    setRole(r);
    setView("login");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (role) onLoginSuccess(role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 px-6">
      {/* ================= SELECT ROLE ================= */}
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
            {/* TEACHER */}
            <div
              onClick={() => handleSelectRole("TEACHER")}
              className="cursor-pointer rounded-2xl p-8 bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl hover:scale-[1.03] transition"
            >
              <Briefcase size={44} className="mb-6" />
              <h2 className="text-2xl font-extrabold mb-2">Giáo viên</h2>
              <p className="text-sm opacity-90">
                Quản lý lớp, tạo đề thi, chấm điểm
              </p>
            </div>

            {/* STUDENT */}
            <div
              onClick={() => handleSelectRole("STUDENT")}
              className="cursor-pointer rounded-2xl p-8 bg-white border border-slate-200 shadow hover:shadow-xl hover:scale-[1.03] transition"
            >
              <GraduationCap size={44} className="text-orange-500 mb-6" />
              <h2 className="text-2xl font-extrabold mb-2 text-slate-800">
                Học sinh
              </h2>
              <p className="text-sm text-slate-500">
                Làm bài, xem điểm, theo dõi tiến độ
              </p>
            </div>

            {/* ADMIN */}
            <div
              onClick={() => handleSelectRole("ADMIN")}
              className="cursor-pointer rounded-2xl p-8 bg-slate-900 text-white shadow-xl hover:scale-[1.03] transition"
            >
              <ShieldCheck size={44} className="mb-6 text-emerald-400" />
              <h2 className="text-2xl font-extrabold mb-2">Quản trị</h2>
              <p className="text-sm opacity-80">
                Quản lý hệ thống, duyệt tài khoản
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= LOGIN FORM ================= */}
      {view === "login" && (
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10">
          <button
            onClick={() => setView("select")}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6"
          >
            <ArrowLeft size={18} /> Quay lại chọn vai trò
          </button>

          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
            Đăng nhập
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            Vai trò:{" "}
            <span className="font-semibold text-indigo-600">
              {role === "TEACHER"
                ? "Giáo viên"
                : role === "STUDENT"
                ? "Học sinh"
                : "Quản trị"}
            </span>
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <input
              type="text"
              placeholder="Tên đăng nhập"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
            <input
              type="password"
              placeholder="Mật khẩu"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition"
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
