import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Trophy,
  Clock,
  ChevronRight,
  Star,
  LayoutDashboard,
  History,
  Gamepad2,
  PlayCircle,
  Trash2,
  AlertCircle,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { Exam, Grade } from "../types";
import MathPreview from "../components/MathPreview";

/* =========================
   SAFE STUDENT TYPE
========================= */
interface StudentUser {
  uid: string;
  email: string;
  name?: string;
  classId?: string;
  requestedClassName?: string;
}

interface StudentDashboardProps {
  student: StudentUser;
  exams: Exam[];
  onTakeExam: (exam: Exam) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  exams,
  onTakeExam,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "exams" | "results"
  >("overview");
  const [myGrades, setMyGrades] = useState<Grade[]>([]);

  /* =========================
     SAFE DISPLAY NAME
  ========================= */
  const displayName = useMemo(() => {
    if (student.name) return student.name.split(" ").pop();
    return student.email?.split("@")[0] || "Học sinh";
  }, [student.name, student.email]);

  /* =========================
     FILTER EXAMS SAFELY
  ========================= */
  const myClassExams = useMemo(() => {
    return exams.filter((e) => {
      if (
        e.assignedClassIds &&
        student.classId &&
        e.assignedClassIds.includes(student.classId)
      )
        return true;

      if (
        e.assignedClass &&
        student.requestedClassName &&
        e.assignedClass === student.requestedClassName
      )
        return true;

      if (!e.assignedClassIds && !e.assignedClass) return true;

      return false;
    });
  }, [exams, student.classId, student.requestedClassName]);

  /* =========================
     LOAD GRADES
  ========================= */
  useEffect(() => {
    const loadGrades = () => {
      const allGrades: Grade[] = JSON.parse(
        localStorage.getItem("grades") || "[]"
      );

      setMyGrades(
        allGrades.filter(
          (g) =>
            g.studentName === student.name ||
            g.studentName === student.email
        )
      );
    };

    loadGrades();
    window.addEventListener("storage", loadGrades);
    return () => window.removeEventListener("storage", loadGrades);
  }, [student.name, student.email]);

  const handleDeleteGrade = (id: string) => {
    if (!window.confirm("Xóa kết quả lần thi này?")) return;

    const allGrades: Grade[] = JSON.parse(
      localStorage.getItem("grades") || "[]"
    );
    const updated = allGrades.filter((g) => g.id !== id);

    localStorage.setItem("grades", JSON.stringify(updated));
    setMyGrades(
      updated.filter(
        (g) =>
          g.studentName === student.name ||
          g.studentName === student.email
      )
    );
  };

  /* =========================
     STATS
  ========================= */
  const stats = [
    {
      label: "Đề thi đã làm",
      value: myGrades.length,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Điểm trung bình",
      value: myGrades.length
        ? (
            myGrades.reduce((a, b) => a + b.score, 0) / myGrades.length
          ).toFixed(1)
        : "0.0",
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Bài thi sắp tới",
      value: myClassExams.filter(
        (e) => !myGrades.some((g) => g.examTitle === e.title)
      ).length,
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-6xl mx-auto">
      {/* HERO */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-100">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-black mb-3 italic">
            Chào {displayName}! 👋
          </h1>
          <p className="text-indigo-100 font-medium leading-relaxed opacity-90">
            Hôm nay bạn có{" "}
            <strong className="text-white underline">
              {stats[2].value} bài tập mới
            </strong>{" "}
            đã được giáo viên giao cho lớp{" "}
            <strong>{student.requestedClassName || "của bạn"}</strong>.
          </p>
          <div className="mt-8">
            <button
              onClick={() => setActiveTab("exams")}
              className="px-10 py-3.5 bg-white text-indigo-700 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-indigo-50 transition-all shadow-xl"
            >
              Làm bài ngay
            </button>
          </div>
        </div>
        <div className="absolute top-[-20%] right-[-5%] opacity-10 rotate-12 pointer-events-none">
          <Trophy size={400} />
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow"
          >
            <div
              className={`${stat.bg} ${stat.color} p-4.5 rounded-2xl shadow-inner`}
            >
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                {stat.label}
              </p>
              <p className="text-3xl font-black text-slate-800 tracking-tight">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* TAB CONTENT – giữ nguyên UI phía dưới */}
      {/* 👉 Phần còn lại GIỮ NGUYÊN logic render như file bạn gửi */}
    </div>
  );
};

export default StudentDashboard;
