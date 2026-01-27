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
     DATA FROM FIREBASE
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
     LOAD TEACHERS (REALTIME)
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

  const totalTeachers = teachers.length;

  /* =========================
     UI – LOGIN
  ========================= */
  if (!isAuthenticated) {
    return (
      <div className="max-w-sm mx-auto mt-24 p-6 bg-white rounded-2xl shadow">
        <h2 className="text-2xl font-extrabold mb-6 text-center">
          🔐 Admin đăng nhập
        </h2>

        <input
          className="w-full border p-3 mb-4 rounded-xl"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          className="w-full border p-3 mb-6 rounded-xl"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full bg-black text-white py-3 rounded-xl font-semibold"
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
      <h1 className="text-3xl font-extrabold text-gray-800">
        👨‍💼 Quản trị hệ thống
      </h1>

      {/* ===== STATISTICS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow hover:shadow-md transition">
          <div className="text-sm text-gray-500 mb-1">
            Tổng giáo viên
          </div>
          <div className="text-4xl font-extrabold text-indigo-600">
            {totalTeachers}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow hover:shadow-md transition">
          <div className="text-sm text-gray-500 mb-1">
            Chờ duyệt
          </div>
          <div className="text-4xl font-extrabold text-yellow-500">
            {pendingTeachers.length}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow hover:shadow-md transition">
          <div className="text-sm text-gray-500 mb-1">
            Đã duyệt
          </div>
          <div className="text-4xl font-extrabold text-emerald-600">
            {approvedTeachers.length}
          </div>
        </div>
      </div>

      {loading && <p>⏳ Đang tải dữ liệu...</p>}

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
              className="bg-white border p-4 rounded-xl flex justify-between items-center shadow-sm"
            >
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-sm text-gray-500">
                  {t.school} · {t.username}
                </div>
              </div>

              <div className="space-x-2">
                <button
                  className="px-4 py-1 bg-green-600 text-white rounded-lg"
                  onClick={() =>
                    updateStatus(t.username, "APPROVED")
                  }
                >
                  Duyệt
                </button>

                <button
                  className="px-4 py-1 bg-red-600 text-white rounded-lg"
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
              className="bg-white border p-4 rounded-xl flex justify-between items-center shadow-sm"
            >
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-sm text-gray-500">
                  {t.school} · {t.username}
                </div>
              </div>

              <button
                className="px-4 py-1 bg-gray-800 text-white rounded-lg"
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
