import React, { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../supabase";

/* ================= TYPES ================= */

export enum AccountStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface TeacherAccount {
  id: string;
  name: string;
  email: string;
  school?: string;
  status: AccountStatus;
}

/* ================= ADMIN LOGIN (LOCAL) ================= */

const ADMIN_CREDENTIAL = {
  username: "huynhvannhan",
  password: "huynhvannhan2020aA@",
};

export default function AdminDashboard() {
  /* ================= AUTH ================= */

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  /* ================= DATA ================= */

  const [teachers, setTeachers] = useState<TeacherAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= LOGIN ================= */

  const handleLogin = useCallback(() => {
    if (
      username.trim() === ADMIN_CREDENTIAL.username &&
      password === ADMIN_CREDENTIAL.password
    ) {
      setIsAuthenticated(true);
      setPassword("");
      setError(null);
    } else {
      setError("Sai tài khoản hoặc mật khẩu Admin");
    }
  }, [username, password]);

  /* ================= LOAD TEACHERS ================= */

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadTeachers = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setError("Không thể tải danh sách giáo viên");
        setLoading(false);
        return;
      }

      setTeachers(data || []);
      setLoading(false);
    };

    loadTeachers();
  }, [isAuthenticated]);

  /* ================= ACTIONS ================= */

  const updateStatus = async (id: string, status: AccountStatus) => {
    const { error } = await supabase
      .from("teachers")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert("❌ Không thể cập nhật trạng thái");
      return;
    }

    setTeachers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  };

  const deleteTeacher = async (id: string) => {
    const ok = window.confirm(
      "⚠️ Xóa vĩnh viễn tài khoản giáo viên?\nHành động này không thể hoàn tác."
    );
    if (!ok) return;

    const { error } = await supabase
      .from("teachers")
      .delete()
      .eq("id", id);

    if (error) {
      alert("❌ Không thể xóa giáo viên");
      return;
    }

    setTeachers((prev) => prev.filter((t) => t.id !== id));
  };

  /* ================= FILTER ================= */

  const pendingTeachers = useMemo(
    () => teachers.filter((t) => t.status === AccountStatus.PENDING),
    [teachers]
  );

  const approvedTeachers = useMemo(
    () => teachers.filter((t) => t.status === AccountStatus.APPROVED),
    [teachers]
  );

  /* ================= UI – LOGIN ================= */

  if (!isAuthenticated) {
    return (
      <div className="max-w-sm mx-auto mt-24 p-8 bg-white rounded-3xl shadow-xl">
        <h2 className="text-2xl font-black mb-6 text-center">
          🔐 Admin đăng nhập
        </h2>

        {error && (
          <div className="mb-4 text-sm text-red-600 font-bold text-center">
            {error}
          </div>
        )}

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
          className="w-full bg-black text-white py-3 rounded-xl font-black"
          onClick={handleLogin}
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  /* ================= UI – ADMIN PANEL ================= */

  return (
    <div className="p-6 space-y-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black">
        👨‍💼 Quản trị hệ thống
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Stat title="Tổng giáo viên" value={teachers.length} />
        <Stat title="Chờ duyệt" value={pendingTeachers.length} />
        <Stat title="Đã duyệt" value={approvedTeachers.length} />
      </div>

      {loading && <p>⏳ Đang tải dữ liệu…</p>}
      {error && <p className="text-red-600 font-bold">{error}</p>}

      <Section title="⏳ Giáo viên chờ duyệt">
        {pendingTeachers.map((t) => (
          <TeacherRow
            key={t.id}
            teacher={t}
            onApprove={() => updateStatus(t.id, AccountStatus.APPROVED)}
            onReject={() => updateStatus(t.id, AccountStatus.REJECTED)}
          />
        ))}
      </Section>

      <Section title="✅ Giáo viên đã duyệt">
        {approvedTeachers.map((t) => (
          <TeacherRow
            key={t.id}
            teacher={t}
            onDelete={() => deleteTeacher(t.id)}
          />
        ))}
      </Section>
    </div>
  );
}

/* ================= SUB COMPONENTS ================= */

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-4xl font-black text-indigo-600">
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-black mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function TeacherRow({
  teacher,
  onApprove,
  onReject,
  onDelete,
}: {
  teacher: TeacherAccount;
  onApprove?: () => void;
  onReject?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="bg-white border p-4 rounded-xl flex justify-between items-center">
      <div>
        <div className="font-bold">
          {teacher.name || "Chưa đặt tên"}
        </div>
        <div className="text-sm text-gray-500">
          {teacher.school || "—"} · {teacher.email}
        </div>
      </div>

      <div className="flex gap-2">
        {onApprove && (
          <button
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold text-sm"
            onClick={onApprove}
          >
            Duyệt
          </button>
        )}
        {onReject && (
          <button
            className="px-4 py-2 rounded-lg bg-rose-600 text-white font-bold text-sm"
            onClick={onReject}
          >
            Từ chối
          </button>
        )}
        {onDelete && (
          <button
            className="px-4 py-2 rounded-lg bg-slate-800 text-white font-bold text-sm"
            onClick={onDelete}
          >
            Xóa
          </button>
        )}
      </div>
    </div>
  );
}
