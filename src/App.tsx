import React, { useState, memo } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  NavLink,
  useParams,
  Navigate
} from 'react-router-dom';
import {
  Sparkles,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  LogOut,
  LayoutDashboard,
  BookOpen,
  User,
  Bell
} from 'lucide-react';

import { Dashboard } from './views/Dashboard';
import { CourseView } from './views/CourseView';
import { CreateCourse } from './views/CreateCourse';

/* =========================================================
   TYPES
========================================================= */
type UserRole = 'teacher' | 'student' | 'admin';

/* =========================================================
   LOGIN PORTAL
========================================================= */
const LoginPortal = memo(({ onLogin }: { onLogin: (role: UserRole) => void }) => (
  <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent">
    <div className="w-full max-w-5xl space-y-16 fade-in">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/80 backdrop-blur border border-blue-100 rounded-full text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] shadow-sm">
          <Sparkles size={14} className="animate-pulse" />
          Hệ thống quản lý học tập AI
        </div>

        <h1 className="text-7xl font-black text-slate-900 italic tracking-tighter">
          Toán Học <span className="text-blue-600">Cloud</span>
        </h1>

        <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">
          Hệ thống Huỳnh Văn Nhẫn
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <RoleCard
          icon={<Briefcase size={40} />}
          title="Giáo viên"
          color="blue"
          onClick={() => onLogin('teacher')}
          desc="Biên soạn bài giảng bằng AI, quản lý đề thi và chấm điểm tự động."
        />

        <RoleCard
          icon={<GraduationCap size={40} />}
          title="Học sinh"
          color="orange"
          onClick={() => onLogin('student')}
          desc="Học tập tương tác, làm bài tập và nhận hỗ trợ từ gia sư AI 24/7."
        />
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => onLogin('admin')}
          className="flex items-center gap-4 px-10 py-5 bg-slate-900 text-white rounded-[24px] text-xs font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl hover:scale-105"
        >
          <ShieldCheck size={20} className="text-blue-400" />
          Quản trị viên (ADMIN)
        </button>
      </div>
    </div>
  </div>
));

/* =========================================================
   ROLE CARD
========================================================= */
const RoleCard = ({ icon, title, desc, onClick, color }: any) => (
  <button
    onClick={onClick}
    className="group relative bg-white p-12 rounded-[56px] border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all text-left"
  >
    <div
      className={`w-20 h-20 bg-${color}-50 text-${color}-600 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform shadow-inner`}
    >
      {icon}
    </div>
    <h3 className="text-4xl font-black text-slate-800 mb-4 italic">
      {title}
    </h3>
    <p className="text-slate-400 font-medium text-lg leading-relaxed">
      {desc}
    </p>
  </button>
);

/* =========================================================
   MAIN LAYOUT
========================================================= */
const MainLayout = ({ role, onLogout, children }: any) => (
  <div className="flex min-h-screen bg-[#f8fafc]">
    <aside className="w-20 lg:w-80 bg-white border-r border-slate-100 flex flex-col sticky top-0 h-screen shadow-sm">
      <Sidebar />
    </aside>

    <main className="flex-1 min-w-0">
      <Header role={role} onLogout={onLogout} />
      <div className="p-10 max-w-7xl mx-auto fade-in">{children}</div>
    </main>
  </div>
);

/* =========================================================
   SIDEBAR
========================================================= */
const Sidebar = memo(() => (
  <>
    <div className="p-8 flex items-center gap-4 border-b border-slate-50">
      <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
        <GraduationCap size={28} />
      </div>
      <div className="hidden lg:block">
        <h1 className="text-xl font-black italic">Lumina AI</h1>
        <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.3em]">
          Toán Học LMS
        </span>
      </div>
    </div>

    <nav className="flex-1 p-6 space-y-3 mt-6">
      <NavItem to="/" icon={<LayoutDashboard size={22} />} label="Tổng quan" />
      <NavItem to="/courses/1" icon={<BookOpen size={22} />} label="Bài giảng" />
      <NavItem to="/create" icon={<Sparkles size={22} />} label="Biên soạn AI" />
    </nav>
  </>
));

/* =========================================================
   NAV ITEM (CHUẨN ROUTER)
========================================================= */
const NavItem = ({ to, icon, label }: any) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `w-full flex items-center gap-5 px-6 py-5 rounded-[24px] transition-all ${
        isActive
          ? 'bg-blue-50 text-blue-600 font-black'
          : 'text-slate-400 hover:bg-slate-50'
      }`
    }
  >
    {icon}
    <span className="hidden lg:block text-sm uppercase tracking-widest italic">
      {label}
    </span>
  </NavLink>
);

/* =========================================================
   HEADER
========================================================= */
const Header = ({ role, onLogout }: any) => (
  <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-10 sticky top-0">
    <div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
        Hệ thống quản lý
      </div>
      <div className="text-lg font-black italic uppercase">{role} Portal</div>
    </div>

    <div className="flex items-center gap-6">
      <Bell />
      <button onClick={onLogout} className="text-red-500">
        <LogOut />
      </button>
    </div>
  </header>
);

/* =========================================================
   APP ROOT
========================================================= */
const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);

  if (!role) return <LoginPortal onLogin={setRole} />;

  return (
    <Router>
      <MainLayout role={role} onLogout={() => setRole(null)}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/courses/:id" element={<CourseView />} />
          {role !== 'student' && (
            <Route path="/create" element={<CreateCourse />} />
          )}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </MainLayout>
    </Router>
  );
};

export default App;
