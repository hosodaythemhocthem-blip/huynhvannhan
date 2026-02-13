import React, { useState } from "react";
import {
  GraduationCap,
  User,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { authService } from "../services/authService";

type Role = "teacher" | "student" | null;

const LoginScreen: React.FC = () => {
  const [role, setRole] = useState<Role>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* ================= LOGIN ================= */

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.login(email, password);
      // Không cần redirect ở đây
      // App.tsx sẽ tự redirect theo role
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại");
    }

    setLoading(false);
  };

  /* ================= REGISTER STUDENT ================= */

  const handleRegisterStudent = async () => {
    setError("");
    setLoading(true);

    try {
      await authService.register(email, password, "student");
      alert("Đăng ký thành công! Chờ giáo viên duyệt.");
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 px-4 relative overflow-hidden">

      {/* Glow */}
      <div className="absolute w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-3xl -top-20 -left-20 animate-pulse" />
      <div className="absolute w-[400px] h-[400px] bg-indigo-500/30 rounded-full blur-3xl bottom-0 right-0 animate-pulse" />

      <div className="relative w-full max-w-md backdrop-blur-xl bg-white/90 rounded-3xl shadow-2xl p-8 border border-white/40">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg mb-3">
            <GraduationCap size={28} />
          </div>
          <h1 className="text-3xl font-black text-slate-800">
            NexusLMS
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Hệ thống quản lý học tập thông minh
          </p>
        </div>

        {!role && (
          <div className="space-y-4">
            <button
              onClick={() => setRole("teacher")}
              className="w-full flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:scale-[1.03] transition shadow-lg"
            >
              <GraduationCap size={20} />
              Tôi là Giáo viên
            </button>

            <button
              onClick={() => setRole("student")}
              className="w-full flex items-center gap-3 px-5 py-4 bg-white border border-indigo-600 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition"
            >
              <User size={20} />
              Tôi là Học sinh
            </button>
          </div>
        )}

        {role && (
          <form onSubmit={handleLogin} className="space-y-5">

            <div className="text-center font-bold text-indigo-600 text-lg">
              {role === "teacher"
                ? "Đăng nhập Giáo viên"
                : "Đăng nhập Học sinh"}
            </div>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/40"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/40 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="text-sm text-red-500 text-center bg-red-50 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-xl hover:scale-[1.02] transition flex justify-center items-center gap-2 shadow-lg"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Đăng nhập
            </button>

            {role === "student" && (
              <button
                type="button"
                onClick={handleRegisterStudent}
                className="w-full border border-indigo-600 text-indigo-600 font-semibold py-2 rounded-xl hover:bg-indigo-50 transition"
              >
                Đăng ký tài khoản học sinh
              </button>
            )}

            <button
              type="button"
              onClick={() => setRole(null)}
              className="w-full text-sm text-slate-500 mt-2"
            >
              ← Quay lại chọn vai trò
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
