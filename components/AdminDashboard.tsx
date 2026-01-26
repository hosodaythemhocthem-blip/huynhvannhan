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
    await updateDoc(doc(db, "teachers", username), {
      status,
    });
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
          className="w-full bg-black text-white py-2 rounded"
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
