import React, { useState } from "react";
import { login, register } from "../services/authService";
import { UserRole } from "../types";

interface Props {
  onSelectRole: (role: UserRole, data: any) => void;
}

const LoginScreen: React.FC<Props> = ({ onSelectRole }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = await login(email, password);
      onSelectRole(user.role, user);
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError(null);

      await register(email, password, role);

      alert(
        role === UserRole.TEACHER
          ? "Đăng ký thành công! Vui lòng chờ Admin duyệt."
          : "Đăng ký thành công! Bạn có thể đăng nhập."
      );

      setMode("login");
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-xl shadow-lg space-y-5">
        <h1 className="text-2xl font-bold text-center">
          {mode === "login" ? "Đăng nhập hệ thống" : "Đăng ký tài khoản"}
        </h1>

        {/* Email */}
        <input
          className="w-full px-4 py-2 rounded bg-slate-700 outline-none"
          placeholder="Email hoặc tài khoản"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <input
          className="w-full px-4 py-2 rounded bg-slate-700 outline-none"
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Role select khi đăng ký */}
        {mode === "register" && (
          <select
            className="w-full px-4 py-2 rounded bg-slate-700"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value={UserRole.STUDENT}>Học sinh</option>
            <option value={UserRole.TEACHER}>Giáo viên</option>
          </select>
        )}

        {/* Error */}
        {error && (
          <div className="text-red-400 text-sm bg-red-950 px-3 py-2 rounded">
            {error}
          </div>
        )}

        {/* Button */}
        {mode === "login" ? (
          <button
            disabled={loading}
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-semibold disabled:opacity-50"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        ) : (
          <button
            disabled={loading}
            onClick={handleRegister}
            className="w-full bg-green-600 hover:bg-green-700 py-2 rounded font-semibold disabled:opacity-50"
          >
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        )}

        {/* Switch mode */}
        <div className="text-center text-sm text-slate-400">
          {mode === "login" ? (
            <>
              Chưa có tài khoản?{" "}
              <button
                onClick={() => setMode("register")}
                className="text-blue-400 underline"
              >
                Đăng ký
              </button>
            </>
          ) : (
            <>
              Đã có tài khoản?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-blue-400 underline"
              >
                Đăng nhập
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
