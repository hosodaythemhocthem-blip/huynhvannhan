import React, { useState } from "react";
import { ShieldCheck, Briefcase, GraduationCap } from "lucide-react";
import { UserRole } from "../types";

const ADMIN_ACCOUNT = {
  username: "huynhvannhan",
  password: "huynhvanhan2020aA@",
};

interface Props {
  onSelectRole: (role: UserRole, data?: any) => void;
}

const LoginScreen: React.FC<Props> = ({ onSelectRole }) => {
  const [view, setView] = useState<"select" | "admin" | "teacher" | "student">(
    "select"
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleAdminLogin = () => {
    if (
      username === ADMIN_ACCOUNT.username &&
      password === ADMIN_ACCOUNT.password
    ) {
      onSelectRole(UserRole.ADMIN, { name: "Huỳnh Văn Nhẫn" });
    } else {
      setError("Sai tài khoản hoặc mật khẩu Admin");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      {view === "select" && (
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl w-full p-8">
          <Card
            icon={<ShieldCheck size={40} />}
            title="ADMIN"
            onClick={() => setView("admin")}
          />
          <Card
            icon={<Briefcase size={40} />}
            title="GIÁO VIÊN"
            onClick={() => setView("teacher")}
          />
          <Card
            icon={<GraduationCap size={40} />}
            title="HỌC SINH"
            onClick={() => setView("student")}
          />
        </div>
      )}

      {view !== "select" && (
        <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold text-center mb-6">
            Đăng nhập {view.toUpperCase()}
          </h2>

          {error && (
            <div className="mb-4 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <input
            className="w-full mb-3 p-3 border rounded-lg"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            className="w-full mb-4 p-3 border rounded-lg"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={
              view === "admin"
                ? handleAdminLogin
                : () =>
                    onSelectRole(
                      view === "teacher"
                        ? UserRole.TEACHER
                        : UserRole.STUDENT,
                      { name: "Người dùng" }
                    )
            }
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg"
          >
            Đăng nhập
          </button>

          <button
            onClick={() => setView("select")}
            className="w-full mt-3 text-sm text-slate-500"
          >
            ← Quay lại
          </button>
        </div>
      )}
    </div>
  );
};

const Card = ({ icon, title, onClick }: any) => (
  <div
    onClick={onClick}
    className="cursor-pointer bg-white rounded-2xl p-10 shadow hover:shadow-xl text-center transition"
  >
    <div className="flex justify-center mb-4 text-indigo-600">{icon}</div>
    <div className="font-bold text-lg">{title}</div>
  </div>
);

export default LoginScreen;
