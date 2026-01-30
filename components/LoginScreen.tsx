import React, { useCallback, useState } from "react";
import {
  login,
  registerTeacher,
  registerStudent,
} from "../services/authService";
import { UserRole } from "../types";
import {
  Mail,
  Lock,
  Loader2,
  GraduationCap,
  User,
} from "lucide-react";

/* =====================
   Types
===================== */
interface Props {
  onSelectRole: (role: UserRole, data: any) => void;
}

type Mode = "login" | "register";

/* =====================
   Utils
===================== */
const mapAuthError = (code?: string) => {
  switch (code) {
    case "auth/invalid-email":
      return "Email không hợp lệ";
    case "auth/user-not-found":
      return "Tài khoản không tồn tại";
    case "auth/wrong-password":
      return "Sai mật khẩu";
    case "auth/email-already-in-use":
      return "Email đã được sử dụng";
    case "auth/weak-password":
      return "Mật khẩu quá yếu";
    case "auth/user-disabled":
      return "Tài khoản đã bị khóa";
    case "permission-denied":
      return "Tài khoản chưa được cấp quyền";
    default:
      return "Thao tác thất bại, vui lòng thử lại";
  }
};

const validateInput = (email: string, password: string) => {
  if (!email.trim()) return "Vui lòng nhập email";
  if (!email.includes("@")) return "Email không hợp lệ";
  if (!password.trim()) return "Vui lòng nhập mật khẩu";
  if (password.length < 6) return "Mật khẩu tối thiểu 6 ký tự";
  return null;
};

/* =====================
   Component
===================== */
const LoginScreen: React.FC<Props> = ({ onSelectRole }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* =====================
     Handlers
  ===================== */
  const handleLogin = useCallback(async () => {
    const msg = validateInput(email, password);
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const user = await login(email, password);

      // 🛡️ Phòng rủi ro user không có role
      if (!user?.role) {
        throw { code: "permission-denied" };
      }

      onSelectRole(user.role, user);
    } catch (err: any) {
      setError(mapAuthError(err.code));
    } finally {
      setLoading(false);
    }
  }, [email, password, onSelectRole]);

  const handleRegister = useCallback(async () => {
    const msg = validateInput(email, password);
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (role === UserRole.TEACHER) {
        await registerTeacher(email, password);
        alert("Đăng ký thành công. Vui lòng chờ Admin duyệt.");
      } else {
        await registerStudent(email, password);
        alert("Đăng ký thành công. Bạn có thể đăng nhập.");
      }

      setMode("login");
    } catch (err: any) {
      setError(mapAuthError(err.code));
    } finally {
      setLoading(false);
    }
  }, [email, password, role]);

  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      mode === "login" ? handleLogin() : handleRegister();
    }
  };

  /* =====================
     Render
  ===================== */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur border border-slate-800 p-8 rounded-[2rem] shadow-2xl space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col items-center gap-2">
          <GraduationCap size={40} className="text-indigo-400" />
          <h1 className="text-3xl font-bold tracking-wide">Lumina LMS</h1>
          <p className="text-sm text-slate-400">
            Hệ thống quản lý học tập Toán học
          </p>
        </div>

        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input
            onKeyDown={onEnter}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800 outline-none border border-slate-700 focus:border-indigo-500"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input
            onKeyDown={onEnter}
            type="password"
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800 outline-none border border-slate-700 focus:border-indigo-500"
            placeholder="Mật khẩu"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Role select */}
        {mode === "register" && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole(UserRole.STUDENT)}
              className={`p-3 rounded-xl flex items-center justify-center gap-2 border transition ${
                role === UserRole.STUDENT
                  ? "bg-emerald-600 border-emerald-400"
                  : "bg-slate-800 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <GraduationCap size={18} /> Học sinh
            </button>
            <button
              type="button"
              onClick={() => setRole(UserRole.TEACHER)}
              className={`p-3 rounded-xl flex items-center justify-center gap-2 border transition ${
                role === UserRole.TEACHER
                  ? "bg-emerald-600 border-emerald-400"
                  : "bg-slate-800 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <User size={18} /> Giáo viên
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-red-400 text-sm bg-red-950/60 border border-red-900 px-4 py-2 rounded-xl animate-shake">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          disabled={loading}
          onClick={mode === "login" ? handleLogin : handleRegister}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition shadow-lg ${
            mode === "login"
              ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/40"
              : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/40"
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
                type="button"
                onClick={() => {
                  setError(null);
                  setMode("register");
                }}
                className="text-indigo-400 underline"
              >
                Đăng ký
              </button>
            </>
          ) : (
            <>
              Đã có tài khoản?{" "}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode("login");
                }}
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
