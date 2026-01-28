import React, { ReactElement } from "react";
import {
  BookOpen,
  FileText,
  Users,
  PlusCircle,
  LayoutGrid,
  TrendingUp,
  ArrowRight,
  LucideIcon,
} from "lucide-react";
import { UserRole, DashboardStats } from "../types";

/* ================= TYPES ================= */

type StatColor = "blue" | "amber" | "emerald";

interface DashboardProps {
  userRole: UserRole;
  userName: string;
  stats: DashboardStats;
  onNavigate: (page: string) => void;
  onCreateExam: () => void;
}

interface StatCardProps {
  icon: ReactElement;
  title: string;
  value: number;
  note: string;
  color: StatColor;
}

/* ================= COLOR MAP (TAILWIND SAFE) ================= */

const COLOR_MAP: Record<StatColor, string> = {
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
};

const GLOW_MAP: Record<StatColor, string> = {
  blue: "bg-blue-500/5",
  amber: "bg-amber-500/5",
  emerald: "bg-emerald-500/5",
};

/* ================= MAIN ================= */

const Dashboard: React.FC<DashboardProps> = ({
  userRole,
  userName,
  stats,
  onNavigate,
  onCreateExam,
}) => {
  const canManage = userRole === "ADMIN" || userRole === "TEACHER";

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full -ml-10 -mb-10 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest">
              <TrendingUp size={14} />
              {userRole} Portal
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Chào ngày mới,<br />
              <span className="text-indigo-200">{userName}</span> 👋
            </h1>
            <p className="text-indigo-100 text-lg font-medium max-w-md">
              Bạn có {stats.exams} đề thi đang hoạt động và {stats.students} học sinh đang theo dõi.
            </p>
          </div>

          {canManage && (
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onCreateExam}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-indigo-600 font-bold hover:bg-indigo-50 shadow-xl hover:scale-105 active:scale-95 transition"
              >
                <PlusCircle size={20} />
                Tạo Đề Thi Mới
              </button>
              <button
                onClick={() => onNavigate("classes")}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-indigo-500/30 font-bold backdrop-blur-md border border-white/10"
              >
                <Users size={20} />
                Quản lý lớp
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard
          icon={<BookOpen />}
          title="Khóa học"
          value={stats.courses}
          note="Tăng 12% so với tháng trước"
          color="blue"
        />
        <StatCard
          icon={<FileText />}
          title="Đề thi đã tạo"
          value={stats.exams}
          note="8 đề mới trong tuần"
          color="amber"
        />
        <StatCard
          icon={<Users />}
          title="Tổng học sinh"
          value={stats.students}
          note="Tỷ lệ chuyên cần 94%"
          color="emerald"
        />
      </div>
    </div>
  );
};

/* ================= STAT CARD ================= */

const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  note,
  color,
}) => {
  return (
    <div className="group relative bg-white rounded-[2.5rem] p-8 border border-slate-100 hover:shadow-2xl transition overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 ${GLOW_MAP[color]} rounded-full -mr-12 -mt-12`} />

      <div className="relative z-10 space-y-6">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${COLOR_MAP[color]}`}
        >
          {React.cloneElement(icon, { size: 28 })}
        </div>

        <div>
          <div className="text-4xl font-black text-slate-800">
            {value.toLocaleString()}
          </div>
          <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
            {title}
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-400 border-t pt-4 italic">
          {note}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
