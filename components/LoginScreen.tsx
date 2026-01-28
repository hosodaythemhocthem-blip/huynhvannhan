import React, { useState } from "react";
import { UserRole } from "../types";

interface Props {
  onSelectRole: (role: UserRole, data?: any) => void;
}

const LoginScreen: React.FC<Props> = ({ onSelectRole }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    setError("");

    // 🔐 ADMIN CỨNG
    if (role === UserRole.ADMIN) {
      if (
        username === "huynhvannhan" &&
        password === "huynhvanhan2020aA@"
      ) {
        onSelectRole(UserRole.ADMIN, { name: "Huỳnh Văn Nhẫn" });
      } else {
        setError("Sai tài khoản hoặc mật khẩu Admin");
      }
      return;
    }

    // 👩‍🏫 GIÁO VIÊN / 👨‍🎓 HỌC SINH (demo)
    if (!username) {
      setError("Vui lòng nhập tên");
      return;
    }

    onSelectRole(role!, { name: username });
  };

  /* ===== CHƯA CHỌN ROLE ===== */
  if (!role) {
    return (
      <div style={styles.center}>
        <h2>Chọn vai trò</h2>
        <button onClick={() => setRole(UserRole.ADMIN)}>Admin</button>
        <button onClick={() => setRole(UserRole.TEACHER)}>Giáo viên</button>
        <button onClick={() => setRole(UserRole.STUDENT)}>Học sinh</button>
      </div>
    );
  }

  /* ===== FORM ĐĂNG NHẬP ===== */
  return (
    <div style={styles.center}>
      <h2>Đăng nhập {role}</h2>

      <input
        placeholder="Tài khoản"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        placeholder="Mật khẩu"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button onClick={handleLogin}>Đăng nhập</button>
      <button onClick={() => setRole(null)}>⬅ Quay lại</button>
    </div>
  );
};

const styles = {
  center: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
  },
};

export default LoginScreen;
