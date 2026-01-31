import React from "react";
import { UserRole, DashboardStats, User } from "../types";

import TeacherPortal from "./TeacherPortal";
import ClassManagement from "../components/ClassManagement";
import GameManagement from "../components/GameManagement";
import GradeManagement from "../components/GradeManagement";

import { Gamepad2, FileCheck } from "lucide-react";

/* =========================
   TYPES
========================= */
interface Props {
  userRole: UserRole;
  user: User | null;          // user thật từ auth
  userName: string;
  stats: DashboardStats;
  onNavigate: (page: string) => void;
  onCreateExam: () => void;
  classes: any[];
  exams: any[];
}

/* =========================
   DASHBOARD
========================= */
const Dashboard: React.FC<Props> = ({
  userRole,
  user,
  userName,
  stats,
  onNavigate,
  onCreateExam,
  classes,
  exams,
}) => {
  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* ================= TEACHER PORTAL ================= */}
      {userRole === UserRole.TEACHER && user && (
        <TeacherPortal
          user={user}            // ✅ user đã chắc chắn tồn tại
          onCreateExam={onCreateExam}
        />
      )}

      {/* ================= DASHBOARD STATS ================= */}
      <DashboardComponent
        userRole={userRole}
        userName={userName}
        stats={stats}
        onNavigate={onNavigate}
        onCreateExam={onCreateExam}
      />

      {/* ================= ADMIN / TEACHER AREA ================= */}
      {userRole !== UserRole.STUDENT && (
        <>
          {/* ===== CLASS MANAGEMENT ===== */}
          <ClassManagement />

          {/* ===== GAME MANAGEMENT ===== */}
          <section className="space-y-6">
            <SectionHeader
              icon={<Gamepad2 size={16} />}
              title="Giải trí & Tương tác"
              subtitle="Trò chơi lớp học"
            />
            <GameManagement classes={classes} />
          </section>

          {/* ===== GRADE MANAGEMENT ===== */}
          <section className="space-y-6">
            <SectionHeader
              icon={<FileCheck size={16} />}
              title="Điểm số & Thống kê"
              subtitle="Kết quả thi học sinh"
            />
            <GradeManagement classes={classes} exams={exams} />
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;

/* =========================
   SUB COMPONENTS (INLINE)
========================= */

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-black text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
