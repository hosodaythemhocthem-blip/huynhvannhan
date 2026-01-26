import React, { useState } from "react";

/* =========================
   KIỂU DỮ LIỆU
========================= */
interface TeacherAccount {
  id: string;
  username: string;
  fullName: string;
  active: boolean;
}

/* =========================
   COMPONENT
========================= */
const AdminDashboard: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherAccount[]>([
    {
      id: "1",
      username: "gvtoan01",
      fullName: "Giáo viên Toán 1",
      active: true,
    },
    {
      id: "2",
      username: "gvtoan02",
      fullName: "Giáo viên Toán 2",
      active: false,
    },
  ]);

  const handleAdd = () => {
    const username = prompt("Tên đăng nhập GV:");
    const fullName = prompt("Họ tên GV:");
    if (!username || !fullName) return;

    setTeachers((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        username,
        fullName,
        active: true,
      },
    ]);
  };

  const toggleActive = (id: string) => {
    setTeachers((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, active: !t.active } : t
      )
    );
  };

  const handleDelete = (id: string) => {
    if (!confirm("Xóa tài khoản giáo viên này?")) return;
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 26, fontWeight: 900 }}>
        🛡 Quản trị hệ thống
      </h1>
      <p style={{ color: "#475569", marginBottom: 16 }}>
        Quản lý tài khoản giáo viên
      </p>

      <button
        onClick={handleAdd}
        style={{
          marginBottom: 12,
          padding: "6px 12px",
          background: "#16a34a",
          color: "white",
          border: "none",
          borderRadius: 6,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        ➕ Thêm giáo viên
      </button>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr style={{ background: "#f1f5f9" }}>
            <th style={th}>Tên đăng nhập</th>
            <th style={th}>Họ tên</th>
            <th style={th}>Trạng thái</th>
            <th style={th}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((t) => (
            <tr key={t.id}>
              <td style={td}>{t.username}</td>
              <td style={td}>{t.fullName}</td>
              <td style={td}>
                {t.active ? "✅ Hoạt động" : "⛔ Bị khóa"}
              </td>
              <td style={td}>
                <button
                  onClick={() => toggleActive(t.id)}
                  style={btn}
                >
                  {t.active ? "Khóa" : "Mở"}
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  style={{
                    ...btn,
                    background: "#fee2e2",
                    borderColor: "#fecaca",
                    color: "#991b1b",
                  }}
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* =========================
   STYLE
========================= */
const th: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  padding: 8,
  textAlign: "left",
};

const td: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  padding: 8,
};

const btn: React.CSSProperties = {
  marginRight: 6,
  padding: "4px 8px",
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  cursor: "pointer",
};

export default AdminDashboard;
