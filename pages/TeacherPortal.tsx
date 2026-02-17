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

  const [activeTab, setActiveTab] = useState("dashboard");
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  /* =========================================
     LOAD EXAMS
  ========================================= */
  const refreshExams = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ExamService.getAllExams();
      setExams(data);
    } catch (err) {
      showToast("Không thể tải dữ liệu Cloud", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshExams();
  }, [refreshExams]);

  /* =========================================
     CREATE EXAM
  ========================================= */
  const handleCreateNew = () => {
    const newExam: Exam = {
      id: crypto.randomUUID(),
      title: "Đề thi mới",
      duration: 45,
      teacher_id: user.id,
      questions: [],
      total_points: 0,
      question_count: 0,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setEditingExam(newExam);
  };

  /* =========================================
     SAVE
  ========================================= */
  const handleSaveExam = async (updated: Exam) => {
    const result = await ExamService.saveExam(updated);

    if (result) {
      showToast("Đã lưu Cloud!", "success");
      setEditingExam(null);
      refreshExams();
    } else {
      showToast("Lỗi khi lưu", "error");
    }
  };

  /* =========================================
     DELETE
  ========================================= */
  const handleDeleteExam = async (id: string) => {
    if (!window.confirm("Xóa đề này?")) return;

    const success = await ExamService.deleteExam(id);

    if (success) {
      showToast("Đã xóa", "info");
      refreshExams();
    }
  };

  /* =========================================
     RENDER
  ========================================= */
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

    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            user={user}
            onNavigate={setActiveTab}
            onCreateExam={handleCreateNew}
          />
        );

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

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex">
      <aside className="w-80 bg-slate-950 m-5 rounded-[2.5rem] flex flex-col p-8 text-white">
        <div className="flex items-center gap-4 mb-10">
          <Zap />
          <h1 className="text-xl font-black">LUMINA</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
            { id: "exams", label: "Kho đề", icon: FileText },
            { id: "classes", label: "Lớp học", icon: Users },
            { id: "grades", label: "Bảng điểm", icon: BarChart3 },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setEditingExam(null);
              }}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl ${
                activeTab === item.id
                  ? "bg-white text-black"
                  : "text-slate-400"
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="p-4 bg-white/5 rounded-2xl mb-4">
            <p className="font-bold">{user.full_name}</p>
            <p className="text-xs text-indigo-400">{user.email}</p>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-6 py-4 text-rose-400"
          >
            <LogOut size={16} /> Thoát
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        {loading ? (
          <div className="flex justify-center py-40">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          renderMainContent()
        )}
      </main>
    </div>
  );
};

export default TeacherPortal;
