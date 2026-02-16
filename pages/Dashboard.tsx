
import React, { useState, useEffect } from "react";
import { 
  Users, FileText, TrendingUp, Plus, Sparkles, 
  ArrowUpRight, Clock, CheckCircle2, UserPlus,
  Loader2, Zap, LayoutGrid, Calendar, Activity,
  ChevronRight, Star
} from "lucide-react";
import { User, Exam } from "../types";
import { supabase } from "../supabase";
import MathPreview from "../components/MathPreview";
import { motion } from "framer-motion";

const MotionDiv = motion.div as any;

interface Props {
  user: User;
  onNavigate: (tab: string) => void;
  onCreateExam: () => void;
}

const Dashboard: React.FC<Props> = ({ user, onNavigate, onCreateExam }) => {
  const [stats, setStats] = useState({
    totalExams: 0,
    totalStudents: 0,
    pendingStudents: 0,
    avgScore: 0
  });
  const [recentExams, setRecentExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { data: exams } = await supabase.from('exams').select();
        const { data: users } = await supabase.from('users').select();
        const { data: submissions } = await supabase.from('submissions').select();

        const allExams = exams || [];
        const allStudents = (users || []).filter((u: any) => u.role === 'student');
        const pending = allStudents.filter((u: any) => !u.isApproved);
        
        const validSubmissions = (submissions || []).filter((s: any) => s.score !== undefined);
        const avg = validSubmissions.length > 0 
          ? validSubmissions.reduce((acc: number, curr: any) => acc + curr.score, 0) / validSubmissions.length 
          : 0;

        setStats({
          totalExams: allExams.length,
          totalStudents: allStudents.length,
          pendingStudents: pending.length,
          avgScore: Number(avg.toFixed(1))
        });
        
        setRecentExams(allExams.slice(0, 4));
      } catch (error) {
        console.error("Lỗi đồng bộ Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-1000">
      {/* 🏔 HERO SECTION - PREMIUM DARK */}
      <section className="relative overflow-hidden bg-slate-900 rounded-[3.5rem] p-10 md:p-16 border border-white/10 group">
        <div className="absolute top-0 right-0 w-[70%] h-full bg-gradient-to-l from-indigo-500/10 to-transparent blur-[120px]"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="max-w-3xl space-y-8">
            <MotionDiv 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 bg-indigo-500/10 backdrop-blur-md rounded-full border border-indigo-500/20"
            >
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">NhanLMS Pro Engine v5.9 Elite</span>
            </MotionDiv>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] text-white">
              Chào Thầy,<br />
              {user.fullName}
            </h1>
            
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl">
              Thư viện đang có <span className="text-white font-bold">{stats.totalExams} đề thi</span>. 
              {stats.pendingStudents > 0 ? (
                <span> Có <span className="text-rose-400 font-bold underline underline-offset-4">{stats.pendingStudents} học sinh</span> đang chờ duyệt.</span>
              ) : (
                <span> Toàn bộ học sinh đã sẵn sàng cho buổi học.</span>
              )}
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={onCreateExam}
                className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-[0_0_40px_rgba(79,70,229,0.3)] transition-all flex items-center gap-3 active:scale-95"
              >
                <Plus size={20} strokeWidth={3} /> SOẠN ĐỀ THI MỚI
              </button>
              <button 
                onClick={() => onNavigate('ai')}
                className="px-10 py-5 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white border border-white/10 rounded-3xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3"
              >
                <Sparkles size={20} className="text-indigo-400" /> HỎI LUMINA AI
              </button>
            </div>
          </div>

          <div className="hidden lg:block relative animate-float">
             <div className="w-72 h-72 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-[4rem] flex items-center justify-center shadow-[0_0_100px_rgba(79,70,229,0.2)] rotate-6">
                <LayoutGrid size={120} className="text-white/20" />
                <Zap size={60} className="text-white absolute drop-shadow-2xl" />
             </div>
          </div>
        </div>
      </section>

      {/* 📊 BENTO STATS GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Thư viện Đề" value={stats.totalExams} icon={<FileText />} color="text-indigo-400" bgColor="bg-indigo-400/10" />
        <StatCard label="Học sinh" value={stats.totalStudents} icon={<Users />} color="text-emerald-400" bgColor="bg-emerald-400/10" />
        <StatCard label="Điểm số TB" value={stats.avgScore} icon={<TrendingUp />} color="text-amber-400" bgColor="bg-amber-400/10" />
        <StatCard label="Yêu cầu chờ" value={stats.pendingStudents} icon={<UserPlus />} color="text-rose-400" bgColor="bg-rose-400/10" isAlert={stats.pendingStudents > 0} />
      </section>

      {/* 🧬 RECENT ACTIVITY & AI HUB */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-8">
          <div className="flex items-center justify-between px-4">
             <div className="flex items-center gap-3">
                <Activity size={24} className="text-indigo-400" />
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Đề thi vừa cập nhật</h3>
             </div>
             <button onClick={() => onNavigate('exams')} className="text-indigo-600 font-bold text-xs uppercase tracking-widest hover:text-indigo-800 transition-colors flex items-center gap-2">
               Tất cả <ChevronRight size={16} />
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-44 bg-slate-100 rounded-[2.5rem] animate-pulse" />)
            ) : recentExams.map((exam) => (
              <MotionDiv 
                whileHover={{ y: -5, scale: 1.02 }}
                key={exam.id}
                className="bg-white p-8 rounded-[3rem] group cursor-pointer border border-slate-100 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                   <div className="w-12 h-12 bg-indigo-50 text-indigo-400 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <FileText size={22} />
                   </div>
                   <Star size={18} className="text-slate-100 group-hover:text-amber-400 transition-colors" />
                </div>
                <h4 className="font-bold text-slate-800 text-lg leading-snug mb-4 line-clamp-2">
                   <MathPreview content={exam.title} />
                </h4>
                <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   <span className="flex items-center gap-1.5"><Clock size={12} /> {exam.duration}p</span>
                   <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> {exam.questions.length} Câu</span>
                </div>
              </MotionDiv>
            ))}
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-slate-900 p-10 rounded-[3.5rem] border border-white/10 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
              <Sparkles size={40} className="text-indigo-400 mb-6 animate-pulse" />
              <h4 className="text-2xl font-black text-white mb-4">Lumina AI Hub</h4>
              <p className="text-slate-400 font-medium text-sm leading-relaxed mb-10">
                 Trợ lý AI bóc tách đề thi siêu tốc từ Word, PDF hoặc ảnh chụp. Hỗ trợ LaTeX vĩnh viễn.
              </p>
              <div className="space-y-3">
                 <button 
                  onClick={() => onNavigate('exams')}
                  className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-400 hover:text-white transition-all shadow-xl"
                 >
                    Dán đề nhanh
                 </button>
                 <button 
                  onClick={() => onNavigate('ai')}
                  className="w-full py-4 bg-white/5 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
                 >
                    Hỏi Gia sư AI
                 </button>
              </div>
           </div>

           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h4 className="text-lg font-black text-slate-800 tracking-tight uppercase tracking-widest">Lớp học hiện tại</h4>
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-4">
                 <ClassRow name="12A1 Chuyên Toán" count={45} status="online" />
                 <ClassRow name="11B2 Nâng cao" count={38} status="offline" />
                 <ClassRow name="10D3 Luyện thi" count={42} status="online" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color, bgColor, isAlert }: any) => (
  <MotionDiv 
    whileHover={{ y: -5 }}
    className={`bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group ${isAlert ? 'border-rose-200 bg-rose-50/30' : ''}`}
  >
    <div className={`w-14 h-14 ${bgColor} ${color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
      {React.cloneElement(icon, { size: 28, strokeWidth: 2.5 })}
    </div>
    <div className="mt-8">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
    </div>
  </MotionDiv>
);

const ClassRow = ({ name, count, status }: any) => (
  <div className="flex items-center justify-between group cursor-pointer p-4 hover:bg-slate-50 rounded-2xl transition-all">
    <div className="flex items-center gap-4">
      <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
      <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">{name}</span>
    </div>
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{count} HS</span>
  </div>
);

export default Dashboard;
