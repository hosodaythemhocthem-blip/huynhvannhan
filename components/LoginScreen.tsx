import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, UserRole } from "../services/authService";

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

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const role: UserRole = activeTab;

      if (authMode === "register") {
        await registerUser(email, password, fullName, role);
        alert("Đăng ký thành công!");
        setAuthMode("login");
        resetForm();
        return;
      }

      const user = await loginUser(email, password);

      // Điều hướng theo role từ database
      if (user.role === "teacher") {
        navigate("/teacher");
      } else if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/student");
      }
    } catch (error: any) {
      alert(error.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow-lg w-96">
        
        {/* Tabs */}
        <div className="flex mb-4 border-b">
          <button
            className={`flex-1 p-2 font-semibold ${
              activeTab === "student"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("student")}
          >
            Học sinh
          </button>
          <button
            className={`flex-1 p-2 font-semibold ${
              activeTab === "teacher"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("teacher")}
          >
            Giáo viên
          </button>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold mb-4 text-center">
          {authMode === "login" ? "Đăng nhập" : "Đăng ký"}{" "}
          {activeTab === "student" ? "Học sinh" : "Giáo viên"}
        </h2>

        {/* Full Name */}
        {authMode === "register" && (
          <input
            type="text"
            placeholder="Họ tên"
            className="w-full p-2 border rounded mb-3"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Mật khẩu"
          className="w-full p-2 border rounded mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition"
        >
          {loading
            ? "Đang xử lý..."
            : authMode === "login"
            ? "Đăng nhập"
            : "Đăng ký"}
        </button>

        {/* Switch Login/Register */}
        <p className="text-center mt-4 text-sm">
          {authMode === "login"
            ? "Chưa có tài khoản?"
            : "Đã có tài khoản?"}{" "}
          <span
            className="text-blue-500 cursor-pointer font-semibold"
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
