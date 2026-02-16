import React, { useState, useEffect } from "react";
import { 
  Plus, LayoutDashboard, FileText, Users, BarChart3, 
  ShieldCheck, Loader2, Sparkles, Zap, History, Settings,
  UploadCloud, Wand2, ClipboardPaste
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
import ImportExamFromFile from "../components/ImportExamFromFile"; // Component mới cho Word/PDF
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
  const [isImporting, setIsImporting] = useState(false);

  // Tải dữ liệu từ Supabase Cloud vĩnh viễn
  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('exams')
          .select('*')
          .order('updatedAt', { ascending: false });
        
        if (error) throw error;
        setExams(data || []);
      } catch (err: any) {
        showToast("Lỗi kết nối Supabase: " + err.message, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [showToast]);

  // Tạo đề thi thủ công siêu nhanh
  const handleCreateNew = () => {
    const newExam: Exam = {
      id: `exam_${Date.now()}`,
      title: "Đề thi mới " + new Date().toLocaleDateString('vi-VN'),
      description: "Thầy Nhẫn hãy nhập mô tả hoặc dán nội dung vào đây...",
      teacherId: user.id,
      questions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      duration: 90,
      isLocked: false,
      subject: "Toán học",
      grade: "12"
    };
    setEditingExam(newExam);
  };

  const renderContent = () => {
    // Ưu tiên hiển thị màn hình Import file Word/PDF
    if (isImporting) {
      return (
        <ImportExamFromFile 
          onImported={(newExam) => {
            setExams([newExam, ...exams]);
            setIsImporting(false);
            setEditingExam(newExam); // Cho phép chỉnh sửa ngay sau khi import
          }}
          onCancel={() => setIsImporting(false)}
        />
      );
    }

    // Hiển thị trình biên tập đề thi (Hỗ trợ Latex/Mathjax)
    if (editingExam) {
      return (
        <ExamEditor 
          exam={editingExam} 
          onSave={async (updated) => {
            try {
              const { error } = await supabase.from('exams').upsert(updated);
              if (error) throw error;
              
              setExams(prev => {
                const idx = prev.findIndex(e => e.id === updated.id);
                if (idx > -1) return prev.map(e => e.id === updated.id ? updated : e);
                return [updated, ...prev];
              });
              setEditingExam(null);
              showToast("Đã lưu đề thi vĩnh viễn vào hệ thống!", "success");
            } catch (err) {
              showToast("Lỗi khi lưu dữ liệu.", "error");
            }
          }}
          onCancel={() => setEditingExam(null)}
        />
      );
    }

    // Chuyển đổi giữa các phân hệ quản lý
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} onNavigate={() => {}} onCreateExam={handleCreateNew} />;
      
      case 'exams':
        return (
          <ExamDashboard 
            exams={exams}
            onCreate={handleCreateNew}
            onEdit={(e) => setEditingExam(e)}
            onDelete={async (id) => {
              if(confirm("Thầy có chắc chắn muốn xóa vĩnh viễn đề thi này?")) {
                const { error } = await supabase.from('exams').delete().eq('id', id);
                if (!error) {
                  setExams(prev => prev.filter(e => e.id !== id));
                  showToast("Đã xóa vĩnh viễn.", "success");
                }
              }
            }}
          />
        );

      case 'classes': return <ClassManagement />;
      case 'progress': return <GradeManagement exams={exams} classes={[]} />;
      case 'games': return <GameManagement />;

      default:
        return (
          <div className="flex flex-col items-center justify-center py-48 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
            <Settings size={60} className="text-slate-200 animate-spin-slow mb-6" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Phân hệ đang được nâng cấp...</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto">
      {!editingExam && !isImporting && (
        <header className="mb-14 flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm">
                Elite v5.9 Active
              </span>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
            </div>
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter italic">
              {activeTab === 'exams' ? "Kho Đề Thi" : activeTab.toUpperCase()}
            </h1>
          </div>

          {activeTab === 'exams' && (
            <div className="flex gap-4">
              <button 
                onClick={() => setIsImporting(true)}
                className="px-8 py-5 bg-white border-2 border-slate-900 text-slate-900 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3 shadow-xl shadow-slate-200"
              >
                <UploadCloud size={20} /> NHẬP TỪ WORD/PDF
              </button>
              <button 
                onClick={handleCreateNew}
                className="px-8 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center gap-3"
              >
                <Plus size={20} strokeWidth={3} /> SOẠN ĐỀ MỚI
              </button>
            </div>
          )}
        </header>
      )}

      <div className="relative">
        <AnimatePresence mode="wait">
          <MotionDiv
            key={activeTab + (editingExam ? '_edit' : '') + (isImporting ? '_import' : '')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {loading && activeTab === 'exams' ? (
              <div className="flex flex-col items-center justify-center py-40">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-400 font-black text-[10px] tracking-[0.5em]">SYNCHRONIZING WITH SUPABASE...</p>
              </div>
            ) : renderContent()}
          </MotionDiv>
        </AnimatePresence>
      </div>
      
      <footer className="mt-40 py-10 border-t border-slate-100 flex justify-between items-center opacity-40 italic">
         <p className="text-[10px] font-bold text-slate-500 uppercase">Hệ sinh thái toán học Thầy Nhẫn © 2026</p>
         <div className="flex gap-6">
            <Zap size={16} className="text-amber-500" />
            <Sparkles size={16} className="text-indigo-500" />
         </div>
      </footer>
    </div>
  );
};

export default TeacherPortal;
