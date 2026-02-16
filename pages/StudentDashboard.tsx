import React, { useState, useEffect, useMemo } from "react";
import { 
  Trophy, Clock, Star, CheckCircle2, BookOpen, FileText, 
  Sparkles, ArrowRight, History, Zap, Search, LayoutGrid
} from "lucide-react";
import { Exam, User } from "../types";
import { supabase } from "../supabase";
import MathPreview from "../components/MathPreview";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../components/Toast";

const MotionDiv = motion.div as any;

interface Props {
  user: User;
  activeTab?: string;
  onStartExam?: (exam: Exam) => void;
}

const StudentDashboard: React.FC<Props> = ({ user, activeTab, onStartExam }) => {
  const { showToast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'available' | 'completed' | 'lab'>('available');
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: ex } = await supabase.from('exams').select();
        const { data: sub } = await supabase.from('submissions').select();
        setExams(ex || []);
        setSubmissions((sub || []).filter((s: any) => s.student_id === user.id));
      } catch (e) {
        showToast("Lỗi đồng bộ Cloud.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  const stats = useMemo(() => {
    const done = submissions.length;
    const avg = done > 0 ? (submissions.reduce((a, b) => a + (b.score || 0), 0) / done).toFixed(1) : "0.0";
    return { done, avg, pending: Math.max(0, exams.length - done) };
  }, [exams, submissions]);

  const filtered = useMemo(() => {
    let list = exams.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));
    if (tab === 'available') return list.filter(e => !submissions.find(s => s.exam_id === e.id));
    if (tab === 'completed') return list.filter(e => submissions.find(s => s.exam_id === e.id));
    return [];
  }, [exams, submissions, tab, search]);

  return (
    <div className="space-y-12 pb-20">
      <MotionDiv 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[3.5rem] p-12 md:p-20 text-white shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
            <Zap size={16} className="text-amber-300 fill-amber-300" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Hệ sinh thái NhanLMS v6.0</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
            Chào <span className="text-amber-300 italic">{user.fullName.split(' ').pop()}</span>!
          </h1>
          <p className="text-indigo-100 text-xl font-medium max-w-xl">
            Em có <span className="text-white font-bold">{stats.pending} bài tập</span> mới đang chờ chinh phục. Hãy bắt đầu ngay nhé!
          </p>
          <div className="flex gap-4 pt-4">
            <button onClick={() => setTab('available')} className="px-10 py-5 bg-white text-indigo-700 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">LÀM BÀI NGAY</button>
            <button onClick={() => setTab('lab')} className="px-10 py-5 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all">STUDY LAB AI</button>
          </div>
        </div>
      </MotionDiv>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard label="Hoàn thành" value={stats.done} color="bg-emerald-500" icon={<CheckCircle2 />} />
        <StatCard label="Điểm trung bình" value={stats.avg} color="bg-amber-500" icon={<Star />} />
        <StatCard label="Bài tập mới" value={stats.pending} color="bg-indigo-500" icon={<Clock />} />
      </section>

      <div className="space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex p-2 bg-slate-100 rounded-3xl w-full md:w-auto">
            <TabBtn active={tab === 'available'} onClick={() => setTab('available')} label="Đề thi mới" />
            <TabBtn active={tab === 'completed'} onClick={() => setTab('completed')} label="Lịch sử" />
            <TabBtn active={tab === 'lab'} onClick={() => setTab('lab')} label="AI Lab" />
          </div>
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
              type="text" placeholder="Tìm đề thi..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-3xl font-bold shadow-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'lab' ? (
            <MotionDiv key="lab" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-20 rounded-[4rem] text-center border border-indigo-100 shadow-xl">
               <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl text-white">
                  <Sparkles size={48} className="animate-pulse" />
               </div>
               <h3 className="text-3xl font-black text-slate-900 mb-4">Lumina Study Lab</h3>
               <p className="text-slate-500 text-lg font-medium">Sử dụng trợ lý AI ở góc màn hình để nhận lời giải Toán học chi tiết nhất.</p>
            </MotionDiv>
          ) : (
            <MotionDiv 
              key={tab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {loading ? (
                [1,2,3].map(i => <div key={i} className="h-64 bg-slate-100 rounded-[3rem] animate-pulse" />)
              ) : filtered.length > 0 ? filtered.map(exam => (
                <ExamCard 
                  key={exam.id} exam={exam} 
                  sub={submissions.find(s => s.exam_id === exam.id)} 
                  onStart={onStartExam}
                />
              )) : (
                <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
                   <p className="text-slate-400 font-black text-xl italic uppercase tracking-widest">Không có dữ liệu đề thi</p>
                </div>
              )}
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color, icon }: any) => (
  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
    <div className={`w-16 h-16 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform`}>
      {React.cloneElement(icon, { size: 28 })}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  </div>
);

const TabBtn = ({ active, onClick, label }: any) => (
  <button 
    onClick={onClick}
    className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${active ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
  >
    {label}
  </button>
);

const ExamCard = ({ exam, sub, onStart }: any) => (
  <MotionDiv whileHover={{ y: -8 }} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col justify-between h-full">
    <div>
      <div className="flex justify-between items-start mb-6">
        <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
          <FileText size={24} />
        </div>
        {sub && <span className="text-3xl font-black text-emerald-600 tracking-tighter">{sub.score}/10</span>}
      </div>
      <h4 className="text-xl font-bold text-slate-800 leading-tight mb-4">
        <MathPreview content={exam.title} />
      </h4>
    </div>
    <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
        <Clock size={14} /> {exam.duration} phút
      </div>
      <button 
        onClick={() => !sub && onStart?.(exam)}
        className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${sub ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white shadow-lg hover:bg-black'}`}
      >
        {sub ? 'XEM LẠI' : 'BẮT ĐẦU'}
      </button>
    </div>
  </MotionDiv>
);

export default StudentDashboard;
