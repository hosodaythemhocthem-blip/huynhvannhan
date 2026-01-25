import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/firebase"; // giữ nguyên đường dẫn đang dùng

type Teacher = {
  id: string;
  fullName: string;
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt?: any;
};

export default function AdminDashboard() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD GIÁO VIÊN CHỜ DUYỆT
  ========================== */
  const loadPendingTeachers = async () => {
    setLoading(true);
    const q = query(
      collection(db, "teachers"),
      where("status", "==", "PENDING")
    );

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Teacher, "id">),
    }));

    setTeachers(data);
    setLoading(false);
  };

  /* =========================
     DUYỆT / TỪ CHỐI GIÁO VIÊN
     → LƯU DB VĨNH VIỄN
     → GHI LOG KHÔNG BAO GIỜ MẤT
  ========================== */
  const updateStatus = async (
    teacherId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    try {
      // 1️⃣ Update giáo viên
      await updateDoc(doc(db, "teachers", teacherId), {
        status,
        reviewedAt: serverTimestamp(),
      });

      // 2️⃣ Ghi log hệ thống (audit trail)
      await addDoc(collection(db, "audit_logs"), {
        action: "UPDATE_TEACHER_STATUS",
        teacherId,
        status,
        actorRole: "ADMIN",
        createdAt: serverTimestamp(),
      });

      // 3️⃣ Cập nhật UI
      setTeachers((prev) =>
        prev.filter((teacher) => teacher.id !== teacherId)
      );
    } catch (error) {
      console.error("Update status failed:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  useEffect(() => {
    loadPendingTeachers();
  }, []);

  /* =========================
     UI (GIỮ ĐƠN GIẢN – KHÔNG PHÁ)
  ========================== */
  return (
    <div style={{ padding: 24 }}>
      <h2>📌 Giáo viên chờ duyệt</h2>

      {loading && <p>Đang tải dữ liệu...</p>}

      {!loading && teachers.length === 0 && (
        <p>Không có giáo viên nào chờ duyệt</p>
      )}

      {!loading && teachers.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: 16,
          }}
        >
          <thead>
            <tr>
              <th style={th}>Họ tên</th>
              <th style={th}>Email</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id}>
                <td style={td}>{teacher.fullName}</td>
                <td style={td}>{teacher.email}</td>
                <td style={td}>
                  <button
                    style={approveBtn}
                    onClick={() =>
                      updateStatus(teacher.id, "APPROVED")
                    }
                  >
                    ✔ Duyệt
                  </button>
                  <button
                    style={rejectBtn}
                    onClick={() =>
                      updateStatus(teacher.id, "REJECTED")
                    }
                  >
                    ✖ Từ chối
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* =========================
   STYLE NHẸ – KHÔNG PHỤ THUỘC
========================== */
const th: React.CSSProperties = {
  borderBottom: "1px solid #ccc",
  padding: 8,
  textAlign: "left",
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: 8,
};

const approveBtn: React.CSSProperties = {
  marginRight: 8,
  padding: "6px 12px",
  background: "#22c55e",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};

const rejectBtn: React.CSSProperties = {
  padding: "6px 12px",
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};
