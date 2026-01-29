import React, { useState } from "react";
import { UserRole } from "../types";
import { login, register } from "../services/authService";

interface Props {
  onSelectRole: (role: UserRole, data?: any) => void;
}

const ADMIN_USERNAME = "huynhvannhan";
const ADMIN_PASSWORD = "huynhvanhan2020aA@";

const roleColor: Record<UserRole, string> = {
  ADMIN: "bg-indigo-600/20",
  TEACHER: "bg-violet-600/20",
  STUDENT: "bg-pink-600/20",
};

const LoginScreen: React.FC<Props> = ({ onSelectRole }) => {
  const [step, setStep] = useState<"role" | "auth">("role");
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      /* ===== ADMIN CỨNG ===== */
      if (role === UserRole.ADMIN) {
        if (email === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
          onSelectRole(UserRole.ADMIN, { name: "Huỳnh Văn Nhẫn" });
        } else {
          throw new Error("Sai tài khoản hoặc mật khẩu Admin");
        }
        return;
      }

      /* ===== USER FIREBASE ===== */
      if (isLogin) {
        const user = await login(email, password);
        onSelectRole(user.role, user);
      } else {
        const user = await register(email, password, name, role!);

        if (role === UserRole.TEACHER) {
          setError("Đăng ký thành công – chờ Admin duyệt");
          setIsLogin(true);
        } else {
          onSelectRole(user.role, user);
        }
      }
    } catch (err: any) {
      setError(err.message || "Lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  /* ===== CHỌN ROLE ===== */
  if (step === "role") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { r: UserRole.ADMIN, label: "Admin", icon: "⚡" },
            { r: UserRole.TEACHER, label: "Giáo viên", icon: "📐" },
            { r: UserRole.STUDENT, label: "Học sinh", icon: "🎓" },
          ].map((item) => (
            <button
              key={item.r}
              onClick={() => {
                setRole(item.r);
                setStep("auth");
              }}
              className="p-8 rounded-3xl bg-white/5 hover:bg-white/10 transition"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${roleColor[item.r]}`}
              >
                {item.icon}
              </div>
              <h3 className="mt-4 font-bold">{item.label}</h3>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ===== FORM LOGIN ===== */
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-8 rounded-3xl bg-white/5 space-y-4"
      >
        <button
          type="button"
          onClick={() => setStep("role")}
          className="text-sm text-slate-400"
        >
          ⬅ Quay lại
        </button>

        <h2 className="text-2xl font-bold">
          {isLogin ? "Đăng nhập" : "Đăng ký"} ({role})
        </h2>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {!isLogin && role !== UserRole.ADMIN && (
          <input
            placeholder="Họ và tên"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10"
          />
        )}

        <input
          placeholder={role === UserRole.ADMIN ? "Username" : "Email"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/10"
        />

        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/10"
        />

        <button
          disabled={loading}
          className="w-full py-3 bg-indigo-600 rounded-xl font-bold"
        >
          {loading ? "Đang xử lý..." : "Xác nhận"}
        </button>

        {role !== UserRole.ADMIN && (
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-slate-400"
          >
            {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
          </button>
        )}
      </form>
    </div>
  );
};

export default LoginScreen;
