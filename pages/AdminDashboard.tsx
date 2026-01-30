import React, { useEffect, useMemo, useState } from "react";
import { TeacherAccount, AccountStatus } from "@/types";
import { db } from "@/services/firebase";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

/* =========================
   ADMIN LOGIN (CỐ ĐỊNH)
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
     LOAD TEACHERS (REALTIME)
     collection: users
     role: TEACHER
  ========================= */
  useEffect(() => {
    if (!isAuthenticated) return;

    const q = query(
      collection(db, "users"),
      where("role", "==", "TEACHER")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list: TeacherAccount[] = snap.docs.map((d) => ({
          uid: d.id,                 // 🔑 docId = uid
          ...(d.data() as TeacherAccount),
        }));
        setTeachers(list);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthenticated]);

  /* =========================
     ACTIONS
  ========================= */
  const updateStatus = async (
    uid: string,
    status: AccountStatus
  ) => {
    await updateDoc(doc(db, "users", uid), { status });
  };

  const deleteTeacher = async (uid: string) => {
    const ok = window.confirm("⚠️ Xóa vĩnh viễn tài khoản giáo viên?");
    if (!ok) return;

    await deleteDoc(doc(db, "users", uid));
  };

  /* =========================
     FILTER
  ========================= */
  const pendingTeachers = useMemo(
    () => teachers.filter((t) => t.status === AccountStatus.PENDING),
    [teachers]
  );

  const approvedTeachers = useMemo(
    () => teachers.filter((t) => t.status === AccountStatus.APPROVED),
    [teachers]
  );

  /* =========================
     UI – LOGIN
  ========================= */
  if (!isAuthenticated) {
    return (
      <div className="max-w-sm mx-auto mt-24 p-8 bg-white rounded-3xl shadow-xl">
        <h2 className="text-2xl font-black mb-6 text-center">
          🔐 Admin đăng nhập
        </h2>

        <input
          className="w-full border p-3 mb-4 rounded-xl"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <input
          type="password"
          className="w-full border p-3 mb-6 rounded-xl"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <button
          className="w-full bg-black text-white py-3 rounded-xl font-black"
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
    <div className="p-6 space-y-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black">
        👨‍💼 Quản trị hệ thống
      </h1>

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Stat title="Tổng giáo viên" value={teachers.length} />
        <Stat title="Chờ duyệt" value={pendingTeachers.length} color="yellow" />
        <Stat title="Đã duyệt" value={approvedTeachers.length} color="green" />
      </div>

      {loading && <p>⏳ Đang tải dữ liệu…</p>}

      {/* ===== PENDING ===== */}
      <Section title="⏳ Giáo viên chờ duyệt">
        {pendingTeachers.map((t) => (
          <TeacherRow
            key={t.uid}
            teacher={t}
            onApprove={() => updateStatus(t.uid, AccountStatus.APPROVED)}
            onReject={() => updateStatus(t.uid, AccountStatus.REJECTED)}
          />
        ))}
      </Section>

      {/* ===== APPROVED ===== */}
      <Section title="✅ Giáo viên đã duyệt">
        {approvedTeachers.map((t) => (
          <TeacherRow
            key={t.uid}
            teacher={t}
            onDelete={() => deleteTeacher(t.uid)}
          />
        ))}
      </Section>
    </div>
  );
}

/* =========================
   SUB COMPONENTS
========================= */
function Stat({ title, value, color = "indigo" }: any) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow">
      <div className="text-sm text-gray-500">{title}</div>
      <div className={`text-4xl font-black text-${color}-600`}>
        {value}
      </div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <section>
      <h2 className="text-lg font-black mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function TeacherRow({ teacher, onApprove, onReject, onDelete }: any) {
  return (
    <div className="bg-white border p-4 rounded-xl flex justify-between items-center">
      <div>
        <div className="font-bold">{teacher.name}</div>
        <div className="text-sm text-gray-500">
          {teacher.school || "—"} · {teacher.email}
        </div>
      </div>

      <div className="flex gap-2">
        {onApprove && (
          <button className="btn-green" onClick={onApprove}>Duyệt</button>
        )}
        {onReject && (
          <button className="btn-red" onClick={onReject}>Từ chối</button>
        )}
        {onDelete && (
          <button className="btn-dark" onClick={onDelete}>Xóa</button>
        )}
      </div>
    </div>
  );
}
