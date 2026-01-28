import React, { useState } from "react";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./pages/Dashboard";
import { UserRole } from "./types";

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState("");

  if (!role) {
    return (
      <LoginScreen
        onSelectRole={(r, data) => {
          setRole(r);
          setUserName(data?.name || "Huỳnh Văn Nhẫn");
        }}
      />
    );
  }

  return (
    <Dashboard
      role={role}
      userName={userName}
      onLogout={() => {
        setRole(null);
        setUserName("");
      }}
    />
  );
};

export default App;
