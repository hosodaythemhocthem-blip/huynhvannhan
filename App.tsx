import React, { useState } from "react";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./pages/Dashboard";
import { UserRole } from "./types";

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string>("");

  /* ===== CHƯA ĐĂNG NHẬP ===== */
  if (!role) {
    return (
      <LoginScreen
        onSelectRole={(selectedRole, data) => {
          setRole(selectedRole);

          // ✅ Admin không có data từ Firestore
          if (selectedRole === UserRole.ADMIN) {
            setUserName("Huỳnh Văn Nhẫn");
          } else {
            setUserName(data?.name || "Giáo viên");
          }
        }}
      />
    );
  }

  /* ===== ĐÃ ĐĂNG NHẬP ===== */
  return (
    <Dashboard
      userRole={role}        // ⚠️ tên prop PHẢI là userRole
      userName={userName}
      onLogout={() => {
        setRole(null);
        setUserName("");
      }}
    />
  );
};

export default App;
