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
  onSelectRole: (role: UserRole, user: any) => void;
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
    case "teacher-pending":
      return "Giáo viên đang chờ Admin duyệt";
    case "account-deleted":
      return "Tài khoản đã bị vô hiệu hóa";
    default:
      return "Thao tác thất bại, vui lòng thử lại";
  }
};

const validateInput = (email: string, password: string) => {
  const e = email.trim();
  const p = password.trim();
  if (!e) return "Vui lòng nhập email";
  if (!e.includes("@")) return "Email không hợp lệ";
  if (!p) return "Vui lòng nhập mật khẩu";
  if (p.length < 6) return "Mật khẩu tối thiểu 6 ký tự";
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

  const handleLogin = useCallback(async () => {
    if (loading) return;

    const msg = validateInput(email, password);
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const user = await login(email.trim(), password.trim());

      if (!user?.role) {
        throw { code: "permission-denied" };
      }

      onSelectRole(user.role, user);
    } catch (err: any) {
      setError(mapAuthError(err.code));
    } finally {
      setLoading(false);
    }
  }, [email, password, loading, onSelectRole]);

  const handleRegister = useCallback(async () => {
    if (loading) return;

    const msg = validateInput(email, password);
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (role === UserRole.TEACHER) {
        await registerTeacher(email.trim(), password.trim());
        alert("Đăng ký thành công. Vui lòng chờ Admin duyệt.");
      } else {
        await registerStudent(email.trim(), password.trim());
        alert("Đăng ký thành công. Bạn có thể đăng nhập.");
      }

      setMode("login");
    } catch (err: any) {
      setError(mapAuthError(err.code));
    } finally {
      setLoading(false);
    }
  }, [email, password, role, loading]);

  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      mode === "login" ? handleLogin() : handleRegister();
    }
  };

  /* UI giữ nguyên như bạn */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      {/* ... UI Y NGUYÊN ... */}
    </div>
  );
};

export default LoginScreen;
