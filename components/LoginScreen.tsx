import React, { useState } from "react";
import { UserRole } from "../types";
import { login, register } from "../services/authService";

interface LoginScreenProps {
  onSelectRole: (role: UserRole, data?: any) => void;
}

const ADMIN_USERNAME = "huynhvannhan";
const ADMIN_PASSWORD = "huynhvanhan2020aA@";

const LoginScreen: React.FC<LoginScreenProps> = ({ onSelectRole }) => {
  const [step, setStep] = useState<"role" | "auth">("role");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep("auth");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      /* ================= ADMIN CỨNG ================= */
      if (selectedRole === UserRole.ADMIN) {
        if (email === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
          onSelectRole(UserRole.ADMIN, { name: "Huỳnh Văn Nhẫn" });
        } else {
          throw new Error("❌ Sai tài khoản hoặc mật khẩu Admin");
        }
        return;
      }

      /* ============ TEACHER / STUDENT ============ */
      if (isLogin) {
        const user = await login(email, password);
        onSelectRole(user.role, user);
      } else {
        const user = await register(email, password, name, selectedRole!);

        if (selectedRole === UserRole.TEACHER) {
          setError("🎉 Đăng ký thành công! Tài khoản đang chờ Admin duyệt.");
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617]">
      <div className="w-full max-w-4xl px-4">

        {step === "role" ? (
          <div className="text-center">
            <h1 className="text-4xl font-black text-white mb-8">
              Lumina <span className="text-indigo-500">Math LMS</span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button onClick={() => handleRoleSelect(UserRole.ADMIN)} className="glass p-8 rounded-3xl">
                ⚡ <h3 className="text-white font-bold mt-4">Admin</h3>
              </button>
              <button onClick={() => handleRoleSelect(UserRole.TEACHER)} className="glass p-8 rounded-3xl">
                📐 <h3 className="text-white font-bold mt-4">Giáo viên</h3>
              </button>
              <button onClick={() => handleRoleSelect(UserRole.STUDENT)} className="glass p-8 rounded-3xl">
                🎓 <h3 className="text-white font-bold mt-4">Học sinh</h3>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto glass p-10 rounded-[3rem]">
            <button onClick={() => setStep("role")} className="text-slate-400 mb-6">
              ⬅ Quay lại
            </button>

            <h2 className="text-2xl font-black text-white mb-6">
              {isLogin ? "Đăng nhập" : "Đăng ký"} ({selectedRole})
            </h2>

            {error && (
              <div className="mb-4 text-sm text-red-400">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && selectedRole !== UserRole.ADMIN && (
                <input
                  placeholder="Họ và tên"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 text-white"
                />
              )}

              <input
                placeholder={
                  selectedRole === UserRole.ADMIN
                    ? "Username Admin"
                    : "Email"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 text-white"
              />

              <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 text-white"
              />

              <button
                disabled={loading}
                className="w-full py-3 bg-indigo-600 rounded-xl text-white font-bold"
              >
                {loading ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </form>

            {selectedRole !== UserRole.ADMIN && (
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="mt-6 text-slate-400 text-sm"
              >
                {isLogin ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
