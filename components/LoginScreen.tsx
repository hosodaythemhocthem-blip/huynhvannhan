import React, { useState } from "react";
import {
  GraduationCap,
  User,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { supabase } from "../supabase";

interface Props {
  onLoginSuccess: () => void;
}

type Role = "teacher" | "student" | null;

const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [role, setRole] = useState<Role>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      setError("Sai email hoặc mật khẩu");
      setLoading(false);
      return;
    }

    setLoading(false);
    onLoginSuccess();
  };

  const handleRegisterStudent = async () => {
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError("Đăng ký thất bại");
      setLoading(false);
      return;
    }

    setLoading(false);
    alert("Đăng ký thành công! Chờ giáo viên duyệt.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg mb-3">
            <GraduationCap size={26} />
          </div>
          <h1 className="text-2xl font-black text-slate-800">
            NexusLMS
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Đăng nhập hệ thống
          </p>
        </div>

        {/* ROLE SELECT */}
        {!role && (
          <div className="space-y-4">
            <button
              onClick={() => setRole("teacher")}
              className="w-full flex items-center gap-3 px-5 py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              <GraduationCap size={20} />
              Tôi là Giáo viên
            </button>

            <button
              onClick={() => setRole("student")}
              className="w-full flex items-center gap-3 px-5 py-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
            >
              <User size={20} />
              Tôi là Học sinh
            </button>
          </div>
        )}

        {/* LOGIN FORM */}
        {role && (
          <form onSubmit={handleLogin} className="space-y-5">

            <div className="text-center font-bold text-indigo-600">
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
              <div className="text-sm text-red-500 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-xl hover:scale-[1.02] transition flex justify-center items-center gap-2"
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
