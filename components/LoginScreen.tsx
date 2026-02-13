import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../services/authService";
import { UserRole } from "../types";

type AuthMode = "login" | "register";
type TabType = "student" | "teacher";

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>("student");
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

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

      // ================= REGISTER =================
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

      // ================= LOGIN =================
      const user = await loginUser(email, password);

      if (user.approval_status === "pending") {
        setError("Tài khoản đang chờ giáo viên duyệt.");
        return;
      }

      if (user.approval_status === "rejected") {
        setError("Tài khoản đã bị từ chối.");
        return;
      }

      // Điều hướng theo role
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-96 transition-all">
        {/* Tabs */}
        <div className="flex mb-6 border-b">
          {["student", "teacher"].map((tab) => (
            <button
              key={tab}
              className={`flex-1 p-2 font-semibold transition ${
                activeTab === tab
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-blue-500"
              }`}
              onClick={() => setActiveTab(tab as TabType)}
            >
              {tab === "student" ? "Học sinh" : "Giáo viên"}
            </button>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-center mb-6">
          {authMode === "login" ? "Đăng nhập" : "Đăng ký"}{" "}
          {activeTab === "student" ? "Học sinh" : "Giáo viên"}
        </h2>

        {error && (
          <div className="bg-red-100 text-red-600 p-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {authMode === "register" && (
          <input
            type="text"
            placeholder="Họ tên"
            className="w-full p-2 border rounded-lg mb-3 focus:ring-2 focus:ring-blue-400"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded-lg mb-3 focus:ring-2 focus:ring-blue-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Mật khẩu"
          className="w-full p-2 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition font-semibold"
        >
          {loading
            ? "Đang xử lý..."
            : authMode === "login"
            ? "Đăng nhập"
            : "Đăng ký"}
        </button>

        <p className="text-center mt-4 text-sm">
          {authMode === "login"
            ? "Chưa có tài khoản?"
            : "Đã có tài khoản?"}{" "}
          <span
            className="text-blue-600 cursor-pointer font-semibold hover:underline"
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
