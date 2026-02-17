import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Loader2,
  Sparkles,
  Zap,
  LogOut,
  UploadCloud,
  ChevronRight,
} from "lucide-react";
import { User, Exam } from "../types";
import { ExamService } from "../services/exam.service";
import { motion, AnimatePresence } from "framer-motion";
import Dashboard from "./Dashboard";
import ExamDashboard from "../components/ExamDashboard";
import ExamEditor from "../components/ExamEditor";
import ClassManagement from "../components/ClassManagement";
import GradeManagement from "../components/GradeManagement";
import GameManagement from "../components/GameManagement";
import ImportExamFromFile from "../components/ImportExamFromFile";
import { useToast } from "../components/Toast";

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

  /* =========================================================
     LOAD EXAMS CLOUD
  ========================================================= */

  const refreshExams = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ExamService.getAllExams();
      setExams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi load exams:", err);
      showToast("Không thể tải dữ liệu Cloud", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshExams();
  }, [refreshExams]);

  /* =========================================================
     CREATE NEW EXAM
  ========================================================= */

  const handleCreateNew = () => {
    const newExam: Exam = {
      id: crypto.randomUUID(),
      title: "Đề thi mới chưa đặt tên",
      duration: 45,
      teacherId: user.id,
      questions: [],
      total_points: 0,
      question_count: 0,
      is_deleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEditingExam(newExam);
  };

  /* =========================================================
     SAVE EXAM
  ========================================================= */

  const handleSaveExam = async (updated: Exam) => {
    const result = await ExamService.saveExam(updated);

    if (result) {
      showToast("Đã lưu vĩnh viễn lên Cloud!", "success");
      setEditingExam(null);
      await refreshExams();
    } else {
      showToast("Lỗi khi lưu Cloud", "error");
    }
  };

  /* =========================================================
     DELETE EXAM
  ========================================================= */

  const handleDeleteExam = async (id: string) => {
    if (!window.confirm("Thầy có chắc muốn xóa vĩnh viễn đề thi này?"))
      return;

    const success = await ExamService.deleteExam(id);

    if (success) {
      showToast("Đã xóa vĩnh viễn!", "info");
      refreshExams();
    } else {
      showToast("Không thể xóa đề thi", "error");
    }
  };

  /* =========================================================
     MAIN CONTENT
  ========================================================= */

  const renderMainContent = () => {
    if (editingExam) {
      return (
        <ExamEditor
          exam={editingExam}
          onSave={handleSaveExam}
          onCancel={() => setEditingExam(null)}
        />
      );
    }

    if (isImporting) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-10 bg-white rounded-[3rem] shadow-xl border border-slate-100"
        >
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-3xl font-black uppercase">
                Nhập đề Word / PDF
              </h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                Tự động phân tích & nhận diện công thức toán
              </p>
            </div>
            <button
              onClick={() => setIsImporting(false)}
              className="w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-rose-100 hover:text-rose-500 rounded-full transition-all"
            >
              <Plus className="rotate-45" />
            </button>
          </div>

          <ImportExamFromFile
            onImportSuccess={() => {
              setIsImporting(false);
              refreshExams();
            }}
          />
        </motion.div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return <Dashboard user={user} />;

      case "exams":
        return (
          <ExamDashboard
            exams={exams}
            onCreate={handleCreateNew}
            onEdit={setEditingExam}
            onDelete={handleDeleteExam}
          />
        );

      case "classes":
        return <ClassManagement />;

      case "grades":
        return <GradeManagement />;

      case "games":
        return <GameManagement />;

      default:
        return null;
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex font-sans">
      {/* SIDEBAR */}
      <aside className="w-80 bg-slate-950 m-5 rounded-[2.5rem] flex flex-col p-8 text-white shadow-2xl">

        <div className="flex items-center gap-4 mb-14">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
            <Zap className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tight">
              LUMINA
            </h1>
            <span className="text-[10px] text-indigo-400 uppercase tracking-[0.3em]">
              Cloud System
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
            { id: "exams", label: "Kho đề", icon: FileText },
            { id: "classes", label: "Lớp học", icon: Users },
            { id: "grades", label: "Bảng điểm", icon: BarChart3 },
            { id: "games", label: "Hoạt động", icon: Zap },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setEditingExam(null);
                setIsImporting(false);
              }}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                activeTab === item.id
                  ? "bg-white text-black"
                  : "text-slate-400 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={16} />
                {item.label}
              </div>
              {activeTab === item.id && <ChevronRight size={14} />}
            </button>
          ))}
        </nav>

        {/* PROFILE */}
        <div className="mt-auto">
          <div className="p-4 bg-white/5 rounded-2xl mb-4">
            <p className="font-bold">{user.name}</p>
            <p className="text-xs text-indigo-400">{user.email}</p>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-6 py-4 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all text-[11px] font-bold uppercase tracking-widest"
          >
            <LogOut size={16} /> Thoát
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-end mb-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-2">
              <Sparkles size={14} />
              Lumina Teacher
            </div>
            <h2 className="text-4xl font-black">
              {activeTab === "exams" ? "Quản lý đề thi" : "Hệ sinh thái"}
            </h2>
          </div>

          {!editingExam && !isImporting && activeTab === "exams" && (
            <div className="flex gap-4">
              <button
                onClick={() => setIsImporting(true)}
                className="px-6 py-4 bg-white border rounded-2xl font-bold text-xs uppercase tracking-widest hover:border-indigo-500 transition"
              >
                <UploadCloud size={16} /> Nhập Word/PDF
              </button>

              <button
                onClick={handleCreateNew}
                className="px-6 py-4 bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition"
              >
                <Plus size={16} /> Soạn đề mới
              </button>
            </div>
          )}
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (editingExam ? "_edit" : "")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {loading ? (
              <div className="flex flex-col items-center py-40">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
                <p className="text-xs uppercase tracking-widest mt-4 text-slate-400">
                  Đang đồng bộ Cloud...
                </p>
              </div>
            ) : (
              renderMainContent()
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default TeacherPortal;
