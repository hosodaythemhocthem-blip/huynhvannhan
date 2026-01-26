import React, { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";

/* =========================
   KIỂU DỮ LIỆU
========================= */

interface ClassRoom {
  id: string;
  name: string;
  grade: string;
  description?: string;
  createdAt?: any;
}

interface Student {
  id: string;
  fullName: string;
  email?: string;
}

/* =========================
   COMPONENT CHÍNH
========================= */

const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    grade: "",
    description: "",
  });

  /* =========================
     LOAD DANH SÁCH LỚP (REALTIME)
  ========================= */

  useEffect(() => {
    const q = query(
      collection(db, "classes"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ClassRoom, "id">),
      }));
      setClasses(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* =========================
     LOAD HỌC SINH THEO LỚP
  ========================= */

  useEffect(() => {
    if (!selectedClass) return;

    const q = collection(
      db,
      "classes",
      selectedClass.id,
      "students"
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Student, "id">),
      }));
      setStudents(data);
    });

    return () => unsub();
  }, [selectedClass]);

  /* =========================
     TẠO LỚP
  ========================= */

  const createClass = async () => {
    if (!form.name || !form.grade) {
      alert("Vui lòng nhập tên lớp và khối");
      return;
    }

    await addDoc(collection(db, "classes"), {
      ...form,
      createdAt: serverTimestamp(),
    });

    setForm({ name: "", grade: "", description: "" });
  };

  /* =========================
     CẬP NHẬT LỚP
  ========================= */

  const updateClass = async () => {
    if (!selectedClass) return;

    await updateDoc(doc(db, "classes", selectedClass.id), {
      ...form,
    });

    setSelectedClass(null);
    setForm({ name: "", grade: "", description: "" });
  };

  /* =========================
     XÓA LỚP
  ========================= */

  const deleteClass = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa lớp này?")) return;
    await deleteDoc(doc(db, "classes", id));
    setSelectedClass(null);
  };

  /* =========================
     GIAO DIỆN
  ========================= */

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800 }}>
        🏫 Quản lý lớp học
      </h2>

      {/* FORM */}
      <div
        style={{
          marginTop: 16,
          padding: 16,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          maxWidth: 480,
        }}
      >
        <h4 style={{ fontWeight: 700, marginBottom: 8 }}>
          {selectedClass ? "✏️ Cập nhật lớp" : "➕ Tạo lớp mới"}
        </h4>

        <input
          placeholder="Tên lớp (VD: 10A1)"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />

        <input
          placeholder="Khối (VD: 10)"
          value={form.grade}
          onChange={(e) =>
            setForm({ ...form, grade: e.target.value })
          }
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />

        <textarea
          placeholder="Mô tả (tuỳ chọn)"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />

        <button
          onClick={selectedClass ? updateClass : createClass}
          style={{
            padding: "6px 14px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontWeight: 700,
          }}
        >
          {selectedClass ? "Lưu thay đổi" : "Tạo lớp"}
        </button>
      </div>

      {/* DANH SÁCH LỚP */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontWeight: 700 }}>📚 Danh sách lớp</h3>

        {loading && <p>⏳ Đang tải...</p>}

        {classes.map((c) => (
          <div
            key={c.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: 12,
              marginTop: 8,
            }}
          >
            <strong>{c.name}</strong> – Khối {c.grade}
            <div style={{ marginTop: 6 }}>
              <button
                onClick={() => {
                  setSelectedClass(c);
                  setForm({
                    name: c.name,
                    grade: c.grade,
                    description: c.description || "",
                  });
                }}
                style={{ marginRight: 8 }}
              >
                ✏️ Sửa
              </button>
              <button
                onClick={() => deleteClass(c.id)}
                style={{ color: "red" }}
              >
                🗑 Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* HỌC SINH */}
      {selectedClass && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontWeight: 700 }}>
            👨‍🎓 Học sinh – {selectedClass.name}
          </h3>

          {students.length === 0 && (
            <p>Chưa có học sinh trong lớp</p>
          )}

          {students.map((s) => (
            <div key={s.id}>
              • {s.fullName} {s.email && `(${s.email})`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
