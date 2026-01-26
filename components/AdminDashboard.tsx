import React, { useMemo, useState } from "react";
import { TeacherAccount, AccountStatus } from "@/types";

/* =========================
   CONFIG (demo – sau thay Firebase)
========================= */
const ADMIN_CREDENTIAL = {
  username: "huynhvannhan",
  password: "huynhvannhan2020aA@",
};

/* =========================
   ADMIN DASHBOARD
========================= */
export default function AdminDashboard() {
  /* ---------- AUTH ---------- */
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  /* ---------- DATA (demo) ---------- */
  const [teachers, setTeachers] = useState<TeacherAccount[]>([
    {
      username: "gvtoan01",
      name: "Nguyễn Văn A",
      school: "THPT ABC",
      code: "T01",
      status: "PENDING",
      createdAt: new Date().toISOString(),
    },
    {
      username: "gvtoan02",
      name: "Trần Thị B",
      school: "THPT XYZ",
      code: "T02",
      status: "APPROVED",
      createdAt: new Date().toISOString(),
    },
  ]);

  /* =========================
     AUTH LOGIC
  ========================= */
  const handleLogin = () => {
    if (
      username.trim() === ADMIN_CREDENTIAL.username &&
      password === ADMIN_CREDENTIAL.password
    ) {
      setIsAuthenticated(true);
      setPassword(""); // clear memory
    } else {
      alert("❌ Sai tài khoản hoặc mật khẩu Admin");
    }
  };

  /* =========================
     ACTIONS
  ========================= */
  const updateStatus = (username: string, status: AccountStatus) => {
    setTeachers((prev) =>
      prev.map((t) =>
        t.username === username ? { ...t, status } : t
      )
    );
  };

  const deleteTeacher = (username: string) => {
    const ok = window.confirm(
      "⚠️ Bạn chắc chắn muốn XÓA vĩnh viễn tài khoản giáo viên này?"
    );
    if (!ok) return;

    setTeachers((prev) =>
      prev.filter((t) => t.username !== username)
    );
  };

  /* =========================
     FILTER
  ========================= */
  const pendingTeachers = useMemo(
    () => teachers.filter((t) => t.status === "PENDING"),
    [teachers]
  );

  const approvedTeachers = useMemo(
    () => teachers.filter((t) => t.status === "APPROVED"),
    [teachers]
  );

  /* =========================
     UI – LOGIN
  ========================= */
  if (!isAuthenticated) {
    return (
      <div className="max-w-sm mx-auto mt-24 p-6 border rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4 text-center">
          🔐 Admin đăng nhập
        </h2>

        <input
          className="w-full border p-2 mb-3 rounded"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          className="w-full border p-2 mb-4 rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full bg-black text-white py-2 rounded hover:opacity-90"
          onClick={handleLogin}
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  /* =========================
     UI – ADMIN PANEL
  ========================= */
  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold">
        👨‍💼 Quản trị hệ thống
      </h1>

      {/* ===== PENDING ===== */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          ⏳ Giáo viên chờ duyệt
        </h2>

        {pendingTeachers.length === 0 && (
          <p className="text-gray-500 italic">
            Không có tài khoản chờ duyệt
          </p>
        )}

        <ul className="space-y-2">
          {pendingTeachers.map((t) => (
            <li
              key={t.username}
              className="border p-3 rounded flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-sm text-gray-500">
                  {t.school} · {t.username}
                </div>
              </div>

              <div className="space-x-2">
                <button
                  className="px-3 py-1 bg-green-600 text-white rounded"
                  onClick={() =>
                    updateStatus(t.username, "APPROVED")
                  }
                >
                  Duyệt
                </button>

                <button
                  className="px-3 py-1 bg-red-600 text-white rounded"
                  onClick={() =>
                    updateStatus(t.username, "REJECTED")
                  }
                >
                  Từ chối
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== APPROVED ===== */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          ✅ Giáo viên đã duyệt
        </h2>

        <ul className="space-y-2">
          {approvedTeachers.map((t) => (
            <li
              key={t.username}
              className="border p-3 rounded flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-sm text-gray-500">
                  {t.school} · {t.username}
                </div>
              </div>

              <button
                className="px-3 py-1 bg-gray-800 text-white rounded"
                onClick={() => deleteTeacher(t.username)}
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
