// components/LoginScreen.tsx
import React, { useState } from "react";
import { loginUser, registerUser, UserRole } from "../services/authService";

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (isRegister) {
        await registerUser(email, password, fullName, role);
        alert("Đăng ký thành công!");
      } else {
        const user = await loginUser(email, password);
        alert(`Xin chào ${user.full_name}`);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-xl font-bold mb-4 text-center">
          {isRegister ? "Đăng ký" : "Đăng nhập"}
        </h2>

        {isRegister && (
          <input
            type="text"
            placeholder="Họ tên"
            className="w-full p-2 border mb-3"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Mật khẩu"
          className="w-full p-2 border mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {isRegister && (
          <select
            className="w-full p-2 border mb-3"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value="student">Học sinh</option>
            <option value="teacher">Giáo viên</option>
            <option value="admin">Admin</option>
          </select>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          {loading ? "Đang xử lý..." : isRegister ? "Đăng ký" : "Đăng nhập"}
        </button>

        <p className="text-center mt-3 text-sm">
          {isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
          <span
            className="text-blue-500 cursor-pointer"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? "Đăng nhập" : "Đăng ký"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
