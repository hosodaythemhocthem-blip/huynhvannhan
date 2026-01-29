import { useEffect, useState } from "react";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./pages/Dashboard";
import { observeAuth, logout } from "./services/authService";
import { UserRole } from "./types";

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = observeAuth((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return <div className="text-white p-10">Loading...</div>;
  }

  if (!user) {
    return (
      <LoginScreen
        onSelectRole={(role, data) => {
          setUser({ role, ...data });
        }}
      />
    );
  }

  return (
    <Dashboard
      userRole={user.role}
      userName={user.email || "Admin"}
      onLogout={async () => {
        await logout();
        setUser(null);
      }}
    />
  );
}

export default App;
