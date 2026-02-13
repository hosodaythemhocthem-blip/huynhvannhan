import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../services/authService";
import { UserRole } from "../types";
import { Eye, EyeOff, Loader2, GraduationCap } from "lucide-react";

type AuthMode = "login" | "register";
type TabType = "student" | "teacher";

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>("student");
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
  };

  const handleSubmit = async () => {
    try {
      setError(null);

      if (!email || !password) {
        setError("Vui lòng nhập đầy đủ thông tin.");
        return;
      }

      setLoading(true);

      const role: UserRole = activeTab;

      if (authMode === "register") {
        if (!fullName) {
          setError("Vui lòng nhập họ tên.");
          return;
        }

        await registerUser(email, password, fullName, role);

        alert(
          role === "student"
            ? "Đăng ký thành công! Chờ giáo viên duyệt."
            : "Đăng ký giáo viên thành công!"
        );

        setAuthMode("login");
        resetForm();
        return;
      }

      const user = await loginUser(email, password);

      if (user.approval_status === "pending") {
        setError("Tài khoản đang chờ giáo viên duyệt.");
        return;
      }

      if (user.approval_status === "rejected") {
        setError("Tài khoản đã bị từ chối.");
        return;
      }

      if (user.role === "teacher") {
        navigate("/teacher");
      } else if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/student");
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-blue-500 to-cyan-400 p-4">
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl w-full max-w-md p-8 transition-all">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-white p-3 rounded-full shadow-lg">
            <GraduationCap size={30} className="text-indigo-600" />
          </div>
          <h1 className="text-white text-2xl font-bold mt-3">
            LMS Toán Học AI
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 bg-white/30 rounded-xl p-1">
          {["student", "teacher"].map((tab) => (
            <button
              key={tab}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? "bg-white text-indigo-600 shadow"
                  : "text-white hover:bg-white/20"
              }`}
              onClick={() => setActiveTab(tab as TabType)}
            >
              {tab === "student" ? "Học sinh" : "Giáo viên"}
            </button>
          ))}
        </div>

        <h2 className="text-xl text-white font-semibold text-center mb-6">
          {authMode === "login" ? "Đăng nhập" : "Đăng ký"}{" "}
          {activeTab === "student" ? "Học sinh" : "Giáo viên"}
        </h2>

        {error && (
          <div className="bg-red-500/20 border border-red-400 text-red-100 p-2 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {authMode === "register" && (
          <input
            type="text"
            placeholder="Họ tên"
            className="w-full p-3 mb-3 rounded-xl bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-3 rounded-xl bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mật khẩu"
            className="w-full p-3 rounded-xl bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div
            className="absolute right-3 top-3 cursor-pointer text-white"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-white text-indigo-600 font-bold hover:scale-105 transition-all duration-200 flex justify-center items-center gap-2"
        >
          {loading && <Loader2 className="animate-spin" size={18} />}
          {authMode === "login" ? "Đăng nhập" : "Đăng ký"}
        </button>

        <p className="text-center mt-5 text-white text-sm">
          {authMode === "login"
            ? "Chưa có tài khoản?"
            : "Đã có tài khoản?"}{" "}
          <span
            className="font-semibold underline cursor-pointer"
            onClick={() =>
              setAuthMode(authMode === "login" ? "register" : "login")
            }
          >
            {authMode === "login" ? "Đăng ký" : "Đăng nhập"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
