import React, { useState } from "react";
import { login, registerTeacher, registerStudent } from "../services/authService";
import { UserRole } from "../types";
import {
  Mail,
  Lock,
  Loader2,
  GraduationCap,
  User,
} from "lucide-react";

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

  const validate = () => {
    if (!email.trim()) return "Vui lòng nhập email hoặc tài khoản";
    if (!password.trim()) return "Vui lòng nhập mật khẩu";
    if (password.length < 6) return "Mật khẩu tối thiểu 6 ký tự";
    return null;
  };

  const handleLogin = async () => {
    const msg = validate();
    if (msg) return setError(msg);

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
    const msg = validate();
    if (msg) return setError(msg);

    try {
      setLoading(true);
      setError(null);

      if (role === UserRole.TEACHER) {
        await registerTeacher(email, password);
        alert("Đăng ký thành công! Vui lòng chờ Admin duyệt.");
      } else {
        await registerStudent(email, password);
        alert("Đăng ký thành công! Bạn có thể đăng nhập.");
      }

      setMode("login");
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      mode === "login" ? handleLogin() : handleRegister();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-2xl space-y-6 animate-fadeIn">
        <h1 className="text-3xl font-bold text-center tracking-wide">
          Lumina LMS
        </h1>

        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-4 top-3 text-slate-400" size={18} />
          <input
            onKeyDown={onEnter}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800 outline-none border border-slate-700 focus:border-indigo-500"
            placeholder="Email hoặc tài khoản"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock className="absolute left-4 top-3 text-slate-400" size={18} />
          <input
            onKeyDown={onEnter}
            type="password"
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800 outline-none border border-slate-700 focus:border-indigo-500"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Role select đẹp khi register */}
        {mode === "register" && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setRole(UserRole.STUDENT)}
              className={`p-3 rounded-xl flex items-center justify-center gap-2 border ${
                role === UserRole.STUDENT
                  ? "bg-emerald-600 border-emerald-400"
                  : "bg-slate-800 border-slate-700"
              }`}
            >
              <GraduationCap size={18} /> Học sinh
            </button>
            <button
              onClick={() => setRole(UserRole.TEACHER)}
              className={`p-3 rounded-xl flex items-center justify-center gap-2 border ${
                role === UserRole.TEACHER
                  ? "bg-emerald-600 border-emerald-400"
                  : "bg-slate-800 border-slate-700"
              }`}
            >
              <User size={18} /> Giáo viên
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-red-400 text-sm bg-red-950 px-4 py-2 rounded-xl animate-shake">
            {error}
          </div>
        )}

        {/* Button */}
        <button
          disabled={loading}
          onClick={mode === "login" ? handleLogin : handleRegister}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
            mode === "login"
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-emerald-600 hover:bg-emerald-700"
          } disabled:opacity-50`}
        >
          {loading && <Loader2 className="animate-spin" size={18} />}
          {mode === "login" ? "Đăng nhập" : "Đăng ký"}
        </button>

        {/* Switch */}
        <div className="text-center text-sm text-slate-400">
          {mode === "login" ? (
            <>
              Chưa có tài khoản?{" "}
              <button
                onClick={() => setMode("register")}
                className="text-indigo-400 underline"
              >
                Đăng ký
              </button>
            </>
          ) : (
            <>
              Đã có tài khoản?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-indigo-400 underline"
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
