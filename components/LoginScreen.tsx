import React, { useState } from "react";
import { UserRole } from "../types";
import {
  login,
  registerTeacher,
  registerStudent,
} from "../services/authService";

interface Props {
  onSelectRole: (role: UserRole, data?: any) => void;
}

const LoginScreen: React.FC<Props> = ({ onSelectRole }) => {
  const [step, setStep] = useState<"role" | "auth">("role");
  const [role, setRole] = useState<UserRole | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  /* =========================
     CHỌN VAI TRÒ
  ========================= */
  const selectRole = (r: UserRole) => {
    setRole(r);
    setStep("auth");
    setError("");
    setEmail("");
    setPassword("");
    setIsLogin(true);
  };

  /* =========================
     SUBMIT LOGIN / REGISTER
  ========================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const user = await login(email, password);
        onSelectRole(user.role, user);
        return;
      }

      // ===== REGISTER =====
      if (role === UserRole.TEACHER) {
        await registerTeacher(email, password);
        setError("🎉 Đăng ký thành công! Đang chờ Admin phê duyệt.");
        setIsLogin(true);
        return;
      }

      if (role === UserRole.STUDENT) {
        await registerStudent(email, password);
        const user = await login(email, password);
        onSelectRole(user.role, user);
        return;
      }
    } catch (err: any) {
      setError(err.message || "Lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     MÀN HÌNH CHỌN ROLE
  ========================= */
  if (step === "role") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="space-y-6 text-center">
          <h1 className="text-4xl font-bold">Lumina Math LMS</h1>
          <p className="text-slate-400">Chọn vai trò của bạn</p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => selectRole(UserRole.ADMIN)}
              className="px-6 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700"
            >
              Admin
            </button>

            <button
              onClick={() => selectRole(UserRole.TEACHER)}
              className="px-6 py-4 rounded-xl bg-violet-600 hover:bg-violet-700"
            >
              Giáo viên
            </button>

            <button
              onClick={() => selectRole(UserRole.STUDENT)}
              className="px-6 py-4 rounded-xl bg-pink-600 hover:bg-pink-700"
            >
              Học sinh
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     FORM LOGIN / REGISTER
  ========================= */
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 p-8 rounded-2xl w-full max-w-md space-y-5"
      >
        <button
          type="button"
          onClick={() => setStep("role")}
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Quay lại chọn vai trò
        </button>

        <h2 className="text-2xl font-bold">
          {isLogin ? "Đăng nhập" : "Đăng ký"}{" "}
          <span className="text-indigo-400">
            {role === UserRole.ADMIN
              ? "Admin"
              : role === UserRole.TEACHER
              ? "Giáo viên"
              : "Học sinh"}
          </span>
        </h2>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <input
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={
            role === UserRole.ADMIN
              ? "Username Admin (huynhvannhan)"
              : "Email"
          }
          className="w-full p-3 rounded-xl bg-slate-700 outline-none"
        />

        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mật khẩu"
          className="w-full p-3 rounded-xl bg-slate-700 outline-none"
        />

        <button
          disabled={loading}
          className="w-full py-3 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-700"
        >
          {loading
            ? "Đang xử lý..."
            : isLogin
            ? "Đăng nhập"
            : "Đăng ký"}
        </button>

        {role !== UserRole.ADMIN && (
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-slate-400 hover:text-indigo-400 w-full"
          >
            {isLogin
              ? "Chưa có tài khoản? Đăng ký"
              : "Đã có tài khoản? Đăng nhập"}
          </button>
        )}
      </form>
    </div>
  )
