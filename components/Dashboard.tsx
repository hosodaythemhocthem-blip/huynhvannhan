import React from "react";
import {
  BookOpen,
  School,
  Bot,
  ShieldCheck,
} from "lucide-react";

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
  const roleLabel =
    userRole === "ADMIN"
      ? "Quản trị hệ thống"
      : userRole === "TEACHER"
      ? "Giáo viên"
      : "Học sinh";

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-800">
          📊 Bảng điều khiển
        </h1>
        <p className="mt-2 text-slate-500">
          Xin chào <span className="font-semibold">{userName}</span> —{" "}
          <span className="text-indigo-600 font-semibold">
            {roleLabel}
          </span>
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* KHÓA HỌC */}
        <DashboardCard
          icon={BookOpen}
          title="Khóa học"
          desc="Quản lý và truy cập các khóa học Toán"
          gradient="from-indigo-500 to-indigo-600"
          onClick={() => onNavigate?.("courses")}
        />

        {/* LỚP HỌC */}
        {(userRole === "ADMIN" || userRole === "TEACHER") && (
          <DashboardCard
            icon={School}
            title="Lớp học"
            desc="Quản lý lớp, học sinh và tiến độ"
            gradient="from-emerald-500 to-emerald-600"
            onClick={() => onNavigate?.("classes")}
          />
        )}

        {/* AI */}
        <DashboardCard
          icon={Bot}
          title="Trợ lý AI"
          desc="Hỏi – đáp và hỗ trợ Toán học thông minh"
          gradient="from-purple-500 to-purple-600"
          onClick={() => onNavigate?.("ai")}
        />

        {/* ADMIN */}
        {userRole === "ADMIN" && (
          <DashboardCard
            icon={ShieldCheck}
            title="Quản trị"
            desc="Quản lý giáo viên và cấu hình hệ thống"
            gradient="from-rose-500 to-rose-600"
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
interface DashboardCardProps {
  title: string;
  desc: string;
  gradient: string;
  icon: React.ElementType;
  onClick?: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  desc,
  gradient,
  icon: Icon,
  onClick,
}) => (
  <div
    onClick={onClick}
    className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer border border-slate-200"
  >
    <div
      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient}
      flex items-center justify-center text-white mb-4 shadow`}
    >
      <Icon size={26} />
    </div>

    <h3 className="text-lg font-bold text-slate-800 mb-1">
      {title}
    </h3>
    <p className="text-slate-500 text-sm">
      {desc}
    </p>

    <div className="mt-4 text-sm font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition">
      Truy cập →
    </div>
  </div>
);

export default Dashboard;
