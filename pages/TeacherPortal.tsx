
import React, { useState, useEffect } from "react";
import { 
  Plus, LayoutDashboard, FileText, Users, BarChart3, 
  ShieldCheck, Loader2, Sparkles, Zap, History, Settings
} from "lucide-react";
import { User, Exam } from "../types";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import Dashboard from "./Dashboard";
import ExamDashboard from "../components/ExamDashboard";
import ExamEditor from "../components/ExamEditor";
import ClassManagement from "../components/ClassManagement";
import GradeManagement from "../components/GradeManagement";
import GameManagement from "../components/GameManagement";
import { useToast } from "../components/Toast";

const MotionDiv = motion.div as any;

interface Props {
  user: User;
  activeTab: string;
}

const TeacherPortal: React.FC<Props> = ({ user, activeTab }) => {
  const { showToast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.from('exams').select();
        setExams(data || []);
      } catch (err) {
        showToast("Lỗi đồng bộ Supabase Cloud.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [showToast]);

  const handleCreateNew = () => {
    const newExam: Exam = {
      id: `exam_${Date.now()}`,
      title: "Đề thi mới chưa đặt tên",
      description: "Thầy Nhẫn hãy nhập mô tả tại đây...",
      teacherId: user.id,
      questions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      duration: 60,
      isLocked: false,
      subject: "Toán học",
      grade: "12"
    };
    setEditingExam(newExam);
  };

  const renderContent = () => {
    if (editingExam) {
      return (
        <ExamEditor 
          exam={editingExam} 
          onSave={(updated) => {
            setExams(prev => {
              const idx = prev.findIndex(e => e.id === updated.id);
              if (idx > -1) return prev.map(e => e.id === updated.id ? updated : e);
              return [updated, ...prev];
            });
            setEditingExam(null);
          }}
          onCancel={() => setEditingExam(null)}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} onNavigate={() => {}} onCreateExam={handleCreateNew} />;
      
      case 'exams':
        return (
          <ExamDashboard 
            exams={exams as any}
            onCreate={handleCreateNew}
            onAdd={(e) => setExams(prev => [e as any, ...prev])}
            onEdit={(e) => setEditingExam(e as any)}
            onDelete={(id) => setExams(prev => prev.filter(e => e.id !== id))}
          />
        );

      case 'classes': return <ClassManagement />;
      case 'progress': return <GradeManagement exams={exams} classes={[]} />;
      case 'games': return <GameManagement />;

      default:
        return (
          <div className="flex flex-col items-center justify-center py-48 text-center">
            <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-indigo-400 mb-6 shadow-2xl">
               <Settings size={40} className="animate-spin-slow" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Phân hệ đang bảo trì định kỳ...</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {!editingExam && (
        <header className="mb-14 animate-in fade-in slide-in-from-left-6 duration-700">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_15px_rgba(79,70,229,0.6)]"></div>
                   <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.5em]">Node Giáo viên Đã kết nối</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter capitalize italic">
                  {activeTab.replace('-', ' ')}
                </h1>
              </div>

              {activeTab === 'exams' && (
                <button 
                  onClick={handleCreateNew}
                  className="px-10 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-3xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center gap-4 active:scale-95"
                >
                  <Plus size={22} strokeWidth={3} /> SOẠN ĐỀ THỦ CÔNG
                </button>
              )}
           </div>
        </header>
      )}

      <div className="relative min-h-[700px]">
        <AnimatePresence mode="wait">
          <MotionDiv
            key={activeTab + (editingExam ? '_editing' : '')}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5, ease: "circOut" }}
          >
            {loading && activeTab === 'exams' ? (
              <div className="flex flex-col items-center justify-center py-48 space-y-6">
                <div className="w-24 h-24 border-8 border-indigo-50 border-t-indigo-600 rounded-full animate-spin shadow-inner"></div>
                <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px]">Cloud Sync Active...</p>
              </div>
            ) : renderContent()}
          </MotionDiv>
        </AnimatePresence>
      </div>
      
      <footer className="mt-40 py-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between opacity-50 hover:opacity-100 transition-opacity">
         <div className="flex items-center gap-4">
            <ShieldCheck size={24} className="text-emerald-500" />
            <div>
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">NhanLMS Core Pro v5.8.0</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Permanent Encryption Active</p>
            </div>
         </div>
         <div className="flex gap-10 mt-6 md:mt-0">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
               <FileText size={16} /> {exams.length} ĐỀ THI
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
               <History size={16} /> REGION: ASIA-VNVN
            </div>
         </div>
      </footer>
    </div>
  );
};

export default TeacherPortal;
