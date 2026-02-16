import React, { useState, useEffect } from "react";
import { 
  Plus, LayoutDashboard, FileText, Users, BarChart3, 
  ShieldCheck, Loader2, Sparkles, Zap, History, Settings,
  UploadCloud, Wand2, ClipboardPaste, LogOut, UserCheck
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
import ImportExamFromFile from "../components/ImportExamFromFile";
import { useToast } from "../components/Toast";

const MotionDiv = motion.div as any;

interface Props {
  user: User;
  onLogout: () => void;
}

const TeacherPortal: React.FC<Props> = ({ user, onLogout }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("exams");
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // 1. Tải dữ liệu từ Supabase Cloud vĩnh viễn
  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setExams(data || []);
    } catch (err) {
      showToast("Lỗi đồng bộ dữ liệu Cloud.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    const newExam: any = {
      id: `exam_${Date.now()}`,
      title: "Đề thi mới chưa đặt tên",
      duration: 45,
      questions: [],
      teacher_id: user.id,
      created_at: new Date().toISOString()
    };
    setEditingExam(newExam);
  };

  const renderContent = () => {
    if (editingExam) {
      return (
        <ExamEditor 
          exam={editingExam} 
          onSave={async (updated) => {
            const { error } = await supabase.from('exams').upsert(updated);
            if (!error) {
              showToast("Đã lưu đề thi vĩnh viễn!", "success");
              setEditingExam(null);
              fetchExams();
            }
          }}
          onCancel={() => setEditingExam(null)} 
        />
      );
    }

    if (isImporting) {
      return (
        <div className="p-8 bg-white rounded-[3rem] shadow-xl border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Nhập đề từ Word/PDF</h3>
            <button onClick={() => setIsImporting(false)} className="text-slate-400 hover:text-rose-500 transition-all font-bold uppercase text-[10px] tracking-widest">Đóng</button>
          </div>
          <ImportExamFromFile teacherId={user.id} onCreated={() => { setIsImporting(false); fetchExams(); }} />
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard": return <Dashboard user={user} />;
      case "exams": return (
        <ExamDashboard 
          exams={exams} 
          onCreate={handleCreateNew}
          onEdit={setEditingExam}
          onDelete={async (id) => {
            if(confirm("Xóa vĩnh viễn đề thi này?")) {
              await supabase.from('exams').delete().eq('id', id);
              fetchExams();
              showToast("Đã xóa khỏi Cloud.", "success");
            }
          }}
        />
      );
      case "classes": return <ClassManagement />;
      case "grades": return <GradeManagement />;
      case "games": return <GameManagement />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar Siêu Đẹp */}
      <aside className="w-80 bg-slate-900 m-6 rounded-[3rem] flex flex-col p-8 text-white shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Sparkles size={120} />
        </div>
        
        <div className="flex items-center gap-4 mb-16 relative">
          <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="fill-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">Lumina LMS</h1>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Teacher Edition</p>
          </div>
        </div>

        <nav className="flex-1 space-y-3 relative">
          {[
            { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
            { id: "exams", label: "Đề thi vĩnh viễn", icon: FileText },
            { id: "classes", label: "Quản lý lớp", icon: Users },
            { id: "grades", label: "Bảng điểm Cloud", icon: BarChart3 },
            { id: "games", label: "Hoạt động Gamify", icon: Zap },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setEditingExam(null); setIsImporting(false); }}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === item.id ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-white/10 relative">
          <div className="flex items-center gap-4 p-2 mb-4 bg-white/5 rounded-2xl">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-lg font-black italic">H</div>
             <div className="overflow-hidden">
                <p className="text-xs font-black truncate">Thầy Huỳnh Văn Nhẫn</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">huynhvannhan@gmail.com</p>
             </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-rose-400 hover:bg-rose-500/10 transition-all">
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
           <div>
              <h2 className="text-4xl font-black text-slate-800 italic uppercase tracking-tighter">Hệ sinh thái của Thầy</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-2">Đang trực tuyến: Lumina Cloud Server v6.0</p>
           </div>
           
           {!editingExam && !isImporting && (
             <div className="flex gap-4">
                <button 
                  onClick={() => setIsImporting(true)}
                  className="px-8 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-3"
                >
                  <UploadCloud size={20} /> Tải đề Word/PDF
                </button>
                <button 
                  onClick={handleCreateNew}
                  className="px-8 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-200 flex items-center gap-3"
                >
                  <Plus size={20} /> Soạn đề mới
                </button>
             </div>
           )}
        </header>

        <AnimatePresence mode="wait">
          <MotionDiv
            key={activeTab + (editingExam ? '_edit' : '') + (isImporting ? '_import' : '')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-40">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-400 font-black text-[10px] tracking-[0.5em]">SYNCHRONIZING WITH CLOUD...</p>
              </div>
            ) : renderContent()}
          </MotionDiv>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default TeacherPortal;
