import React, { useState } from "react";
import { authService } from "../services/authService";

type Role = "teacher" | "student" | null;

const LoginScreen: React.FC = () => {
  const [role, setRole] = useState<Role>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.login(email, password);
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại");
    }

    setLoading(false);
  };

  const handleRegisterStudent = async () => {
    setError("");
    setLoading(true);

    try {
      await authService.register(
        email,
        password,
        "student",
        fullName
      );
      alert("Đăng ký thành công. Chờ duyệt.");
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>NexusLMS</h2>

      {!role && (
        <>
          <button onClick={() => setRole("teacher")}>
            Tôi là Giáo viên
          </button>
          <button onClick={() => setRole("student")}>
            Tôi là Học sinh
          </button>
        </>
      )}

      {role && (
        <form onSubmit={handleLogin}>
          <h3>
            {role === "teacher"
              ? "Đăng nhập Giáo viên"
              : "Đăng nhập Học sinh"}
          </h3>

          {role === "student" && (
            <input
              type="text"
              placeholder="Họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          )}

          <br />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <br />

          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <br />

          {error && <p style={{ color: "red" }}>{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>

          {role === "student" && (
            <button
              type="button"
              onClick={handleRegisterStudent}
              disabled={loading}
            >
              Đăng ký
            </button>
          )}

          <br />

          <button type="button" onClick={() => setRole(null)}>
            Quay lại
          </button>
        </form>
      )}
    </div>
  );
};

export default LoginScreen;
