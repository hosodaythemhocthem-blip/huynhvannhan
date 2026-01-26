import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  onSnapshot,
  getDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../services/firebase";

type Teacher = {
  id: string;
  fullName: string;
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

type Notification = {
  id: string;
  message: string;
  read: boolean;
};

export default function AdminDashboard() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // ============================
  // 1. BẢO VỆ QUYỀN ADMIN
  // ============================
  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        alert("Bạn chưa đăng nhập");
        window.location.href = "/login";
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists() || snap.data().role !== "ADMIN") {
        alert("Bạn không có quyền truy cập");
        window.location.href = "/";
      }
    });

    return () => unsub();
  }, []);

  // ============================
  // 2. REALTIME LOAD TEACHERS
  // ============================
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

  // ============================
  // 3. REALTIME LOAD NOTIFICATIONS
  // ============================
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

  // ============================
  // 4. DUYỆT / TỪ CHỐI GIÁO VIÊN
  // ============================
  const updateStatus = async (
    teacherId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    try {
      // Update teacher
      await updateDoc(doc(db, "teachers", teacherId), {
        status,
        reviewedAt: serverTimestamp(),
      });

      // Audit log vĩnh viễn
      await addDoc(collection(db, "audit_logs"), {
        action: "UPDATE_TEACHER_STATUS",
        teacherId,
        status,
        actorRole: "ADMIN",
        createdAt: serverTimestamp(),
      });

      // Mark all notifications as read
      notifications.forEach(async (n) => {
        await updateDoc(doc(db, "notifications", n.id), {
          read: true,
        });
      });
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra");
    }
  };

  // ============================
  // UI
  // ============================
  return (
    <div style={{ padding: 24 }}>
      <h2>📌 Bảng quản trị duyệt giáo viên</h2>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div style={{
          background: "#fef3c7",
          padding: 12,
          borderRadius: 6,
          marginBottom: 16
        }}>
          <strong>🔔 Có giáo viên mới đăng ký:</strong>
          <ul>
            {notifications.map((n) => (
              <li key={n.id}>{n.message}</li>
            ))}
          </ul>
        </div>
      )}

      {loading && <p>Đang tải dữ liệu...</p>}

      {!loading && teachers.length === 0 && (
        <p>Không có giáo viên nào chờ duyệt</p>
      )}

      {!loading && teachers.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Họ tên</th>
              <th style={th}>Email</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t.id}>
                <td style={td}>{t.fullName}</td>
                <td style={td}>{t.email}</td>
                <td style={td}>
                  <button style={approveBtn} onClick={() => updateStatus(t.id, "APPROVED")}>
                    ✔ Duyệt
                  </button>
                  <button style={rejectBtn} onClick={() => updateStatus(t.id, "REJECTED")}>
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

// ============================
// STYLE
// ============================
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
