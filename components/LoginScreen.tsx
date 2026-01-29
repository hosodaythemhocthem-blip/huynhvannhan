import React, { useState } from "react";
import { UserRole } from "../types";
import { login, register } from "../services/authService";

interface Props {
  onLoginSuccess: (role: UserRole, userName: string) => void;
}

const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await login(role!, username, password);

      onLoginSuccess(result.role, result.userName);
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterTeacher = async () => {
    setError("");
    setLoading(true);

    try {
      await register("TEACHER", username, password);
      setError("✅ Đăng ký thành công. Tài khoản đang chờ Admin duyệt.");
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="space-y-6 text-center">
          <h1 className="text-3xl font-bold">LMS Toán học</h1>

          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => setRole("ADMIN")}
              className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700"
            >
              👑 Quản trị viên
            </button>

            <button
              onClick={() => setRole("TEACHER")}
              className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700"
            >
              📘 Giáo viên
            </button>

            <button
              onClick={() => setRole("STUDENT")}
              className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700"
            >
              🎓 Học sinh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-800 space-y-4">
        <h2 className="text-2xl font-bold text-center">
          {role === "ADMIN" && "Đăng nhập Admin"}
          {role === "TEACHER" && "Đăng nhập Giáo viên"}
          {role === "STUDENT" && "Đăng nhập Học sinh"}
        </h2>

        {role === "ADMIN" && (
          <p className="text-sm text-slate-300 text-center">
            Gợi ý: <b>huynhvannhan</b>
          </p>
        )}

        <input
          className="w-full p-3 rounded bg-slate-700"
          placeholder="Tên đăng nhập"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-3 rounded bg-slate-700"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div className="text-sm text-red-400 text-center">{error}</div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full p-3 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </button>

        {role === "TEACHER" && (
          <button
            onClick={handleRegisterTeacher}
            disabled={loading}
            className="w-full p-3 rounded bg-green-600 hover:bg-green-500 disabled:opacity-50"
          >
            Đăng ký Giáo viên
          </button>
        )}

        <button
          onClick={() => setRole(null)}
          className="w-full text-sm text-slate-400 hover:text-white"
        >
          ← Quay lại chọn vai trò
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
