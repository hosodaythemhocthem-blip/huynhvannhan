import React from 'react';
import { UserRole, DashboardStats, User } from '../types';
import DashboardComponent from '../components/Dashboard';
import TeacherPortal from './TeacherPortal';
import ClassManagement from '../components/ClassManagement';
import GameManagement from '../components/GameManagement';
import GradeManagement from '../components/GradeManagement';
import { Gamepad2, FileCheck } from 'lucide-react';

interface Props {
  userRole: UserRole;
  user: User | null;              // ✅ truyền user thật
  userName: string;
  stats: DashboardStats;
  onNavigate: (page: string) => void;
  onCreateExam: () => void;
  classes: any[];
  exams: any[];
}

const Dashboard: React.FC<Props> = ({ 
  userRole, 
  user,
  userName, 
  stats, 
  onNavigate, 
  onCreateExam,
  classes,
  exams 
}) => {
  return (
    <div className="space-y-12 max-w-6xl mx-auto">

      {/* ===== TEACHER PORTAL ===== */}
      {userRole === UserRole.TEACHER && (
        <TeacherPortal 
          user={user}               // ✅ KHÔNG CÒN null
          onCreateExam={onCreateExam} 
        />
      )}

      {/* ===== DASHBOARD STATS ===== */}
      <DashboardComponent 
        userRole={userRole}
        userName={userName}
        stats={stats}
        onNavigate={onNavigate}
        onCreateExam={onCreateExam}
      />

      {/* ===== ADMIN / TEACHER ONLY ===== */}
      {userRole !== UserRole.STUDENT && (
        <>
          <ClassManagement />

          {/* ===== GAME MANAGEMENT ===== */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                <Gamepad2 size={16} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Giải trí & Tương tác
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Trò chơi lớp học
                </p>
              </div>
            </div>

            <GameManagement classes={classes} />
          </section>

          {/* ===== GRADE MANAGEMENT ===== */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                <FileCheck size={16} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Điểm số & Thống kê
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Kết quả thi học sinh
                </p>
              </div>
            </div>

            <GradeManagement classes={classes} exams={exams} />
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;
