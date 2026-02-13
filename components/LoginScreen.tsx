import React, { useState } from "react";
import { loginUser, registerUser } from "../services/authService";
import { UserRole } from "../types";

interface Props {
  onLoginSuccess: (user: any) => void;
}

const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const user = await loginUser(email, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError("");

      await registerUser(email, password, email, role);
      setMode("login");
      setError("Đăng ký thành công. Vui lòng đăng nhập.");
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="bg-slate-800 p-8 rounded-xl w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold text-center">
          {mode === "login" ? "Đăng nhập" : "Đăng ký"}
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 rounded bg-slate-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Mật khẩu"
          className="w-full p-2 rounded bg-slate-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {mode === "register" && (
          <select
            className="w-full p-2 rounded bg-slate-700"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value={UserRole.STUDENT}>Học sinh</option>
            <option value={UserRole.TEACHER}>Giáo viên</option>
          </select>
        )}

        {error && (
          <div className="text-red-400 text-sm text-center">{error}</div>
        )}

        <button
          onClick={mode === "login" ? handleLogin : handleRegister}
          disabled={loading}
          className="w-full bg-indigo-600 py-2 rounded hover:bg-indigo-700"
        >
          {loading
            ? "Đang xử lý..."
            : mode === "login"
            ? "Đăng nhập"
            : "Đăng ký"}
        </button>

        <div className="text-center text-sm">
          {mode === "login" ? (
            <button
              onClick={() => {
                setError("");
                setMode("register");
              }}
              className="text-indigo-400"
            >
              Chưa có tài khoản? Đăng ký
            </button>
          ) : (
            <button
              onClick={() => {
                setError("");
                setMode("login");
              }}
              className="text-indigo-400"
            >
              Đã có tài khoản? Đăng nhập
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
