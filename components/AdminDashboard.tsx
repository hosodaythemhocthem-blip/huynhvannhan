import React, { useEffect, useMemo, useState } from "react";
import { TeacherAccount, AccountStatus } from "@/types";
import { db } from "@/services/firebase";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

/* =========================
   ADMIN LOGIN (cố định)
========================= */
const ADMIN_CREDENTIAL = {
  username: "huynhvannhan",
  password: "huynhvannhan2020aA@",
};

export default function AdminDashboard() {
  /* =========================
     AUTH
  ========================= */
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  /* =========================
     DATA
  ========================= */
  const [teachers, setTeachers] = useState<TeacherAccount[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOGIN
  ========================= */
  const handleLogin = () => {
    if (
      username.trim() === ADMIN_CREDENTIAL.username &&
      password === ADMIN_CREDENTIAL.password
    ) {
      setIsAuthenticated(true);
      setPassword("");
    } else {
      alert("❌ Sai tài khoản hoặc mật khẩu Admin");
    }
  };

  /* =========================
     LOAD TEACHERS
  ========================= */
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsub = onSnapshot(
      collection(db, "teachers"),
      (snap) => {
        const list: TeacherAccount[] = snap.docs.map((d) => ({
          ...(d.data() as TeacherAccount),
        }));
        setTeachers(list);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [isAuthenticated]);

  /* =========================
     ACTIONS
  ========================= */
  const updateStatus = async (
    username: string,
    status: AccountStatus
  ) => {
    await updateDoc(doc(db, "teachers", username), { status });
  };

  const deleteTeacher = async (username: string) => {
    const ok = window.confirm(
      "⚠️ Xóa vĩnh viễn tài khoản giáo viên này?"
    );
    if (!ok) return;

    await deleteDoc(doc(db, "teachers", username));
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
     LOGIN UI (ĐẸP)
  ========================= */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
        <div className="bg-white w-full max-w-sm p-8 rounded-3xl shadow-xl">
          <h2 className="text-2xl font-extrabold text-center mb-6">
            🔐 Admin đăng nhập
          </h2>

          <input
            className="w-full border border-gray-300 focus:ring-2 focus:ring-indigo-400 p-3 mb-4 rounded-xl outline-none"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            className="w-full border border-gray-300 focus:ring-2 focus:ring-indigo-400 p-3 mb-6 rounded-xl outline-none"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 text-white py-3 rounded-xl font-semibold transition"
            onClick={handleLogin}
          >
            🚀 Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  /* =========================
     ADMIN UI (GÁI 18)
  ========================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-12">
        <h1 className="text-3xl font-extrabold text-gray-800">
          👨‍💼 Quản trị hệ thống
        </h1>

        {loading && (
          <div className="text-gray-500 animate-pulse">
            ⏳ Đang tải dữ liệu...
          </div>
        )}

        {/* ===== PENDING ===== */}
        <section>
          <h2 className="text-xl font-semibold mb-4">
            ⏳ Giáo viên chờ duyệt
          </h2>

          {pendingTeachers.length === 0 && (
            <p className="text-gray-500 italic">
              Không có tài khoản chờ duyệt
            </p>
          )}

          <ul className="space-y-4">
            {pendingTeachers.map((t) => (
              <li
                key={t.username}
                className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:shadow-md transition"
              >
                <div>
                  <div className="font-semibold text-gray-800">
                    {t.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t.school} · {t.username}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-sm font-medium transition"
                    onClick={() =>
                      updateStatus(t.username, "APPROVED")
                    }
                  >
                    ✔ Duyệt
                  </button>

                  <button
                    className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-sm font-medium transition"
                    onClick={() =>
                      updateStatus(t.username, "REJECTED")
                    }
                  >
                    ✖ Từ chối
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ===== APPROVED ===== */}
        <section>
          <h2 className="text-xl font-semibold mb-4">
            ✅ Giáo viên đã duyệt
          </h2>

          <ul className="space-y-4">
            {approvedTeachers.map((t) => (
              <li
                key={t.username}
                className="bg-white rounded-2xl p-4 flex justify-between items-center border border-gray-100 shadow hover:shadow-md transition"
              >
                <div>
                  <div className="font-semibold text-gray-800">
                    {t.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t.school} · {t.username}
                  </div>
                </div>

                <button
                  className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white rounded-full text-sm transition"
                  onClick={() => deleteTeacher(t.username)}
                >
                  🗑 Xóa
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
