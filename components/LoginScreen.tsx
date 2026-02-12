import React, { useCallback, useState } from "react";
import {
  login,
  registerTeacher,
  registerStudent,
} from "../services/authService";
import { UserRole } from "../types";
import {
  Lock,
  Loader2,
  GraduationCap,
  User,
} from "lucide-react";

/* =====================
   Types
===================== */
interface Props {
  onSelectRole: (role: UserRole, user: any) => void;
}

type Mode = "login" | "register";

/* =====================
   Utils
===================== */
const mapAuthError = (code?: string) => {
  switch (code) {
    case "auth/user-not-found":
      return "Tài khoản không tồn tại";
    case "auth/wrong-password":
      return "Sai mật khẩu";
    case "auth/email-already-in-use":
      return "Tên đăng nhập đã được sử dụng";
    case "auth/weak-password":
      return "Mật khẩu quá yếu";
    case "permission-denied":
      return "Tài khoản chưa được cấp quyền";
    case "teacher-pending":
      return "Giáo viên đang chờ Admin duyệt";
    case "account-deleted":
      return "Tài khoản đã bị vô hiệu hóa";
    default:
      return "Thao tác thất bại, vui lòng thử lại";
  }
};

const validateInput = (username: string, password: string) => {
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      if (!user || !user.role) {
        throw { code: "permission-denied" };
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
        alert("Đăng ký giáo viên thành công. Vui lòng chờ Admin duyệt.");
      } else {
        await registerStudent(username.trim(), password.trim());
        alert("Đăng ký học sinh thành công. Bạn có thể đăng nhập.");
      }

      setMode("login");
    } catch (err: any) {
      setError(mapAuthError(err?.code));
    } finally {
      setLoading(false);
    }
  }, [username, password, role, loading]);

  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      mode === "login" ? handleLogin() : handleRegister();
    }
  };

  /* =====================
     UI
  ===================== */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-md shadow-2xl space-y-6">

        <h1 className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          <GraduationCap />
          LMS System
        </h1>

        {/* Username */}
        <div className="space-y-2">
          <label className="text-sm">Tên đăng nhập</label>
          <div className="flex items-center bg-slate-800 rounded-xl px-3">
            <User size={18} className="opacity-70" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={onEnter}
              className="bg-transparent outline-none px-3 py-2 w-full"
              placeholder="Nhập tên đăng nhập"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="text-sm">Mật khẩu</label>
          <div className="flex items-center bg-slate-800 rounded-xl px-3">
            <Lock size={18} className="opacity-70" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={onEnter}
              className="bg-transparent outline-none px-3 py-2 w-full"
              placeholder="Nhập mật khẩu"
            />
          </div>
        </div>

        {/* Role chọn khi đăng ký */}
        {mode === "register" && (
          <div>
            <label className="text-sm">Vai trò</label>
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as UserRole)
              }
              className="w-full mt-1 bg-slate-800 rounded-xl px-3 py-2"
            >
              <option value={UserRole.STUDENT}>Học sinh</option>
              <option value={UserRole.TEACHER}>Giáo viên</option>
            </select>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Button */}
        <button
          onClick={mode === "login" ? handleLogin : handleRegister}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 transition rounded-xl py-2 font-semibold flex justify-center items-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {mode === "login" ? "Đăng nhập" : "Đăng ký"}
        </button>

        {/* Switch mode */}
        <div className="text-center text-sm">
          {mode === "login" ? (
            <>
              Chưa có tài khoản?{" "}
              <button
                onClick={() => setMode("register")}
                className="text-indigo-400 hover:underline"
              >
                Đăng ký
              </button>
            </>
          ) : (
            <>
              Đã có tài khoản?{" "}
              <button
                onClick={() => setMode("login")}
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
