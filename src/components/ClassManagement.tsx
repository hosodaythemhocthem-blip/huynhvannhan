import React, { useState } from "react";

/* =========================
   KIỂU DỮ LIỆU
========================= */
interface ClassItem {
  id: string;
  name: string;
  grade: string;
  teacher: string;
  studentCount: number;
}

/* =========================
   COMPONENT
========================= */
const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([
    {
      id: "1",
      name: "Toán Đại số",
      grade: "10",
      teacher: "Huỳnh Văn Nhẫn",
      studentCount: 42,
    },
    {
      id: "2",
      name: "Toán Hình học",
      grade: "11",
      teacher: "Huỳnh Văn Nhẫn",
      studentCount: 38,
    },
  ]);

  const handleAdd = () => {
    const newClass: ClassItem = {
      id: Date.now().toString(),
      name: "Lớp mới",
      grade: "12",
      teacher: "Huỳnh Văn Nhẫn",
      studentCount: 0,
    };
    setClasses((prev) => [...prev, newClass]);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Xóa lớp này?")) return;
    setClasses((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800 }}>
        🏫 Quản lý lớp học
      </h2>

      <button
        onClick={handleAdd}
        style={{
          margin: "12px 0",
          padding: "6px 12px",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 6,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        ➕ Thêm lớp
      </button>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr style={{ background: "#f1f5f9" }}>
            <th style={th}>Tên lớp</th>
            <th style={th}>Khối</th>
            <th style={th}>Giáo viên</th>
            <th style={th}>Sĩ số</th>
            <th style={th}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((c) => (
            <tr key={c.id}>
              <td style={td}>{c.name}</td>
              <td style={td}>{c.grade}</td>
              <td style={td}>{c.teacher}</td>
              <td style={td}>{c.studentCount}</td>
              <td style={td}>
                <button
                  onClick={() => handleDelete(c.id)}
                  style={{
                    background: "#fee2e2",
                    border: "1px solid #fecaca",
                    color: "#991b1b",
                    borderRadius: 6,
                    padding: "4px 8px",
                    cursor: "pointer",
                  }}
                >
                  🗑 Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const th: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  padding: 8,
  textAlign: "left",
};

const td: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  padding: 8,
};

export default ClassManagement;
