import React, { useCallback, useMemo, useState } from "react";
import {
  login,
  registerTeacher,
  registerStudent,
} from "../services/authService";
import { UserRole } from "../types";
import { Lock, Loader2, GraduationCap, User } from "lucide-react";

/* =====================
   Types
===================== */
interface Props {
  onSelectRole: (role: UserRole, user: {
    id: string;
    username: string;
    role: UserRole;
    approved: boolean;
  }) => void;
}

type Mode = "login" | "register";

/* =====================
   Utils
===================== */
const mapAuthError = (code?: string): string => {
  switch (code) {
    case "invalid_credentials":
      return "Sai tên đăng nhập hoặc mật khẩu";
    case "user_not_found":
      return "Tài khoản không tồn tại";
    case "user_already_exists":
      return "Tên đăng nhập đã được sử dụng";
    case "weak_password":
      return "Mật khẩu tối thiểu 6 ký tự";
    case "permission_denied":
      return "Tài khoản chưa được cấp quyền";
    case "teacher_pending":
      return "Giáo viên đang chờ Admin duyệt";
    case "student_pending":
      return "Học sinh đang chờ giáo viên duyệt";
    case "account_deleted":
      return "Tài khoản đã bị vô hiệu hóa";
    default:
      return "Thao tác thất bại, vui lòng thử lại";
  }
};

const validateInput = (username: string, password: string): string | null => {
  const u = username.trim();
  const p = password.trim();

  if (!u) return "Vui lòng nhập tên đăng nhập";
  if (u.length < 3) return "Tên đăng nhập tối thiểu 3 ký tự";
  if (!p) return "Vui lòng nhập mật khẩu";
  if (p.length < 6) return "Mật khẩu tối thiểu 6 ký tự";

  return null;
};

/* =====================
   Component
===================== */
const LoginScreen: React.FC<Props> = ({ onSelectRole }) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isDisabled = useMemo(
    () => loading || !username.trim() || !password.trim(),
    [loading, username, password]
  );

  /* =====================
     Handlers
  ===================== */
  const handleLogin = useCallback(async () => {
    if (loading) return;

    const msg = validateInput(username, password);
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const user = await login(username.trim(), password.trim());

      if (!user?.role) {
        throw { code: "permission_denied" };
      }

      if (!user.approved) {
        if (user.role === UserRole.TEACHER) {
          throw { code: "teacher_pending" };
        } else {
          throw { code: "student_pending" };
        }
      }

      onSelectRole(user.role, user);
    } catch (err: any) {
      setError(mapAuthError(err?.code));
    } finally {
      setLoading(false);
    }
  }, [username, password, loading, onSelectRole]);

  const handleRegister = useCallback(async () => {
    if (loading) return;

    const msg = validateInput(username, password);
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (role === UserRole.TEACHER) {
        await registerTeacher(username.trim(), password.trim());
        setError(
          "Đăng ký giáo viên thành công. Vui lòng chờ Admin duyệt."
        );
      } else {
        await registerStudent(username.trim(), password.trim());
        setError(
          "Đăng ký học sinh thành công. Vui lòng chờ giáo viên duyệt."
        );
      }

      setMode("login");
    } catch (err: any) {
      setError(mapAuthError(err?.code));
    } finally {
      setLoading(false);
    }
  }, [username, password, role, loading]);

  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isDisabled) {
      mode === "login" ? handleLogin() : handleRegister();
    }
  };

  /* =====================
     UI
  ===================== */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white px-4">
      <div className="bg-slate-900/90 backdrop-blur-xl p-8 rounded-2xl w-full max-w-md shadow-2xl space-y-6 border border-slate-800">

        <h1 className="text-2xl font-bold text-center flex items-center justify-center gap-2 tracking-wide">
          <GraduationCap className="text-indigo-400" />
          LMS System
        </h1>

        {/* Username */}
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Tên đăng nhập</label>
          <div className="flex items-center bg-slate-800 rounded-xl px-3 focus-within:ring-2 focus-within:ring-indigo-500 transition">
            <User size={18} className="opacity-70" />
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={onEnter}
              className="bg-transparent outline-none px-3 py-2 w-full text-sm"
              placeholder="Nhập tên đăng nhập"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Mật khẩu</label>
          <div className="flex items-center bg-slate-800 rounded-xl px-3 focus-within:ring-2 focus-within:ring-indigo-500 transition">
            <Lock size={18} className="opacity-70" />
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={onEnter}
              className="bg-transparent outline-none px-3 py-2 w-full text-sm"
              placeholder="Nhập mật khẩu"
            />
          </div>
        </div>

        {/* Role chọn khi đăng ký */}
        {mode === "register" && (
          <div>
            <label className="text-sm text-slate-300">Vai trò</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full mt-1 bg-slate-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value={UserRole.STUDENT}>Học sinh</option>
              <option value={UserRole.TEACHER}>Giáo viên</option>
            </select>
          </div>
        )}

        {/* Error / Info */}
        {error && (
          <div className="text-sm text-center px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        {/* Button */}
        <button
          onClick={mode === "login" ? handleLogin : handleRegister}
          disabled={isDisabled}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition rounded-xl py-2 font-semibold flex justify-center items-center gap-2 text-sm"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {mode === "login" ? "Đăng nhập" : "Đăng ký"}
        </button>

        {/* Switch mode */}
        <div className="text-center text-sm text-slate-400">
          {mode === "login" ? (
            <>
              Chưa có tài khoản?{" "}
              <button
                onClick={() => {
                  setError(null);
                  setMode("register");
                }}
                className="text-indigo-400 hover:underline"
              >
                Đăng ký
              </button>
            </>
          ) : (
            <>
              Đã có tài khoản?{" "}
              <button
                onClick={() => {
                  setError(null);
                  setMode("login");
                }}
                className="text-indigo-400 hover:underline"
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
