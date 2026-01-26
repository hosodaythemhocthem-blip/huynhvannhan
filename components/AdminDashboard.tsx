import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/firebase";

/* =========================
   1. KIỂU DỮ LIỆU (TYPES)
========================= */

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

interface Teacher {
  id: string;
  name: string;
  email: string;
  subject?: string;
  status: ApprovalStatus;
  createdAt?: any;
}

interface Notification {
  id: string;
  message: string;
  read: boolean;
}

/* =========================
   2. STYLE NHẸ (INLINE)
========================= */

const th: React.CSSProperties = {
  textAlign: "left",
  padding: 12,
  borderBottom: "1px solid #e5e7eb",
  fontSize: 13,
  textTransform: "uppercase",
  color: "#475569",
};

const td: React.CSSProperties = {
  padding: 12,
  borderBottom: "1px solid #f1f5f9",
  fontSize: 14,
};

/* =========================
   3. COMPONENT CHÍNH
========================= */

const AdminDashboard: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     3.1 LOAD GIÁO VIÊN CHỜ DUYỆT (REALTIME)
  ========================= */

  useEffect(() => {
    const q = query(
      collection(db, "teachers"),
      where("status", "==", "PENDING")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Teacher, "id">),
      }));
      setTeachers(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* =========================
     3.2 LOAD THÔNG BÁO (REALTIME)
  ========================= */

  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      where("read", "==", false)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Notification, "id">),
      }));
      setNotifications(data);
    });

    return () => unsub();
  }, []);

  /* =========================
     3.3 DUYỆT / TỪ CHỐI GIÁO VIÊN
  ========================= */

  const updateStatus = async (
    teacherId: string,
    status: ApprovalStatus
  ) => {
    try {
      // 1️⃣ Update trạng thái giáo viên
      await updateDoc(doc(db, "teachers", teacherId), {
        status,
        reviewedAt: serverTimestamp(),
      });

      // 2️⃣ Ghi log vĩnh viễn (KHÔNG BAO GIỜ XÓA)
      await addDoc(collection(db, "audit_logs"), {
        action: "UPDATE_TEACHER_STATUS",
        teacherId,
        status,
        actor: "ADMIN",
        createdAt: serverTimestamp(),
      });

      // 3️⃣ Đánh dấu thông báo đã đọc
      for (const n of notifications) {
        await updateDoc(doc(db, "notifications", n.id), {
          read: true,
        });
      }
    } catch (err) {
      console.error(err);
      alert("❌ Có lỗi xảy ra khi cập nhật");
    }
  };

  /* =========================
     4. GIAO DIỆN
  ========================= */

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800 }}>
        📌 Bảng Quản Trị – Duyệt Giáo Viên
      </h2>

      {/* ===== THÔNG BÁO ===== */}
      {notifications.length > 0 && (
        <div
          style={{
            background: "#fef3c7",
            padding: 14,
            borderRadius: 8,
            margin: "16px 0",
          }}
        >
          <strong>🔔 Có giáo viên mới đăng ký:</strong>
          <ul style={{ marginTop: 8 }}>
            {notifications.map((n) => (
              <li key={n.id}>• {n.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ===== TRẠNG THÁI LOAD ===== */}
      {loading && <p>⏳ Đang tải dữ liệu...</p>}

      {!loading && teachers.length === 0 && (
        <p>✅ Không có giáo viên nào đang chờ duyệt</p>
      )}

      {/* ===== BẢNG GIÁO VIÊN ===== */}
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
              <th style={th}>Môn</th>
              <th style={th}>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {teachers.map((t) => (
              <tr key={t.id}>
                <td style={td}>{t.name}</td>
                <td style={td}>{t.email}</td>
                <td style={td}>{t.subject || "—"}</td>
                <td style={td}>
                  <button
                    onClick={() => updateStatus(t.id, "APPROVED")}
                    style={{
                      marginRight: 8,
                      padding: "6px 12px",
                      background: "#22c55e",
                      color: "white",
                      borderRadius: 6,
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    ✔ Duyệt
                  </button>

                  <button
                    onClick={() => updateStatus(t.id, "REJECTED")}
                    style={{
                      padding: "6px 12px",
                      background: "#ef4444",
                      color: "white",
                      borderRadius: 6,
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
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
};

export default AdminDashboard;
