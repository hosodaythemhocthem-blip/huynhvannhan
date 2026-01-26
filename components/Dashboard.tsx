import React from "react";

/* =========================
   KIỂU DỮ LIỆU
========================= */
interface DashboardProps {
  userRole?: "ADMIN" | "TEACHER" | "STUDENT";
  userName?: string;
  onNavigate?: (page: string) => void;
}

/* =========================
   COMPONENT
========================= */
const Dashboard: React.FC<DashboardProps> = ({
  userRole = "TEACHER",
  userName = "Huỳnh Văn Nhẫn",
  onNavigate,
}) => {
  return (
    <div style={{ padding: 24 }}>
      {/* HEADER */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900 }}>
          📊 Bảng điều khiển
        </h1>
        <p style={{ color: "#475569" }}>
          Xin chào <strong>{userName}</strong> (
          {userRole === "ADMIN"
            ? "Quản trị hệ thống"
            : userRole === "TEACHER"
            ? "Giáo viên"
            : "Học sinh"}
          )
        </p>
      </div>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {/* KHÓA HỌC */}
        <Card
          title="📘 Khóa học"
          desc="Quản lý và truy cập các khóa học Toán"
          onClick={() => onNavigate?.("courses")}
        />

        {/* LỚP HỌC */}
        {(userRole === "ADMIN" || userRole === "TEACHER") && (
          <Card
            title="🏫 Lớp học"
            desc="Quản lý danh sách lớp và học sinh"
            onClick={() => onNavigate?.("classes")}
          />
        )}

        {/* AI TUTOR */}
        <Card
          title="🤖 Trợ lý AI"
          desc="Hỏi – đáp Toán học thông minh"
          onClick={() => onNavigate?.("ai")}
        />

        {/* QUẢN TRỊ */}
        {userRole === "ADMIN" && (
          <Card
            title="🛡 Quản trị"
            desc="Quản lý giáo viên & hệ thống"
            onClick={() => onNavigate?.("admin")}
          />
        )}
      </div>
    </div>
  );
};

/* =========================
   CARD COMPONENT
========================= */
interface CardProps {
  title: string;
  desc: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ title, desc, onClick }) => (
  <div
    onClick={onClick}
    style={{
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: 16,
      cursor: "pointer",
      background: "#ffffff",
      transition: "all 0.2s",
    }}
    onMouseEnter={(e) =>
      (e.currentTarget.style.boxShadow =
        "0 10px 20px rgba(0,0,0,0.08)")
    }
    onMouseLeave={(e) =>
      (e.currentTarget.style.boxShadow = "none")
    }
  >
    <h3 style={{ fontSize: 18, fontWeight: 800 }}>
      {title}
    </h3>
    <p style={{ marginTop: 6, color: "#64748b" }}>
      {desc}
    </p>
  </div>
);

export default Dashboard;
