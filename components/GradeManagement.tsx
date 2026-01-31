import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  Download,
  Eye,
  Trash2,
  RotateCcw,
  BarChart,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  UserX
} from "lucide-react";
import { Class, Exam, Grade, StudentAccount } from "../types";

/* =========================
   PROPS
========================= */
interface GradeManagementProps {
  classes: Class[];
  exams: Exam[];
}

/* =========================
   COMPONENT CHÍNH
========================= */
const GradeManagement: React.FC<GradeManagementProps> = ({ classes, exams }) => {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedExamTitle, setSelectedExamTitle] = useState("");
  const [allGrades, setAllGrades] = useState<Grade[]>([]);
  const [allStudents, setAllStudents] = useState<StudentAccount[]>([]);
  const [showUnsubmittedModal, setShowUnsubmittedModal] = useState(false);

  /* =========================
     LOAD DATA (LOCAL STORAGE)
  ========================= */
  useEffect(() => {
    const loadData = () => {
      setAllGrades(JSON.parse(localStorage.getItem("grades") || "[]"));
      setAllStudents(JSON.parse(localStorage.getItem("student_accounts") || "[]"));
    };
    loadData();
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, []);

  /* =========================
     FILTERED DATA
  ========================= */
  const filteredGrades = useMemo(() => {
    return allGrades.filter(g => {
      if (selectedClassId && g.classId !== selectedClassId) return false;
      if (selectedExamTitle && g.examTitle !== selectedExamTitle) return false;
      return true;
    });
  }, [allGrades, selectedClassId, selectedExamTitle]);

  const selectedClass = useMemo(
    () => classes.find(c => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  const studentsInClass = useMemo(
    () =>
      allStudents.filter(
        s => s.classId === selectedClassId && s.status === "APPROVED"
      ),
    [allStudents, selectedClassId]
  );

  const submittedStudentNames = useMemo(
    () => Array.from(new Set(filteredGrades.map(g => g.studentName))),
    [filteredGrades]
  );

  const unsubmittedStudents = useMemo(
    () => studentsInClass.filter(s => !submittedStudentNames.includes(s.name)),
    [studentsInClass, submittedStudentNames]
  );

  /* =========================
     STATS
  ========================= */
  const scoreStats = useMemo(() => {
    const stats = { gioi: 0, kha: 0, tb: 0, yeu: 0, kem: 0 };
    filteredGrades.forEach(g => {
      if (g.score >= 8) stats.gioi++;
      else if (g.score >= 6.5) stats.kha++;
      else if (g.score >= 5) stats.tb++;
      else if (g.score >= 3.5) stats.yeu++;
      else stats.kem++;
    });
    return stats;
  }, [filteredGrades]);

  const totalStudents = studentsInClass.length;
  const submittedCount = submittedStudentNames.length;
  const notSubmittedCount = unsubmittedStudents.length;
  const passedCount = filteredGrades.filter(g => g.score >= 5).length;

  const submittedPercent = totalStudents
    ? ((submittedCount / totalStudents) * 100).toFixed(1)
    : "0.0";

  const notSubmittedPercent = totalStudents
    ? ((notSubmittedCount / totalStudents) * 100).toFixed(1)
    : "0.0";

  const passRate = submittedCount
    ? ((passedCount / submittedCount) * 100).toFixed(1)
    : "0.0";

  /* =========================
     ACTIONS
  ========================= */
  const handleDeleteGrade = (id: string) => {
    if (!window.confirm("Xóa kết quả này?")) return;
    const updated = allGrades.filter(g => g.id !== id);
    localStorage.setItem("grades", JSON.stringify(updated));
    setAllGrades(updated);
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ================= FILTER BAR ================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap gap-5 items-end">
          {/* CLASS */}
          <FilterSelect
            label="Chọn lớp"
            value={selectedClassId}
            onChange={setSelectedClassId}
            options={[
              { value: "", label: "-- Chọn lớp --" },
              ...classes.map(c => ({ value: c.id, label: c.name }))
            ]}
          />

          {/* EXAM */}
          <FilterSelect
            label="Chọn đề thi"
            value={selectedExamTitle}
            onChange={setSelectedExamTitle}
            options={[
              { value: "", label: "-- Chọn đề --" },
              ...exams.map(e => ({ value: e.title, label: e.title }))
            ]}
          />

          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">
              <Download size={16} /> Excel
            </button>
            <button
              onClick={() => {
                setSelectedClassId("");
                setSelectedExamTitle("");
              }}
              className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 border border-red-100"
              title="Reset"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ================= OVERVIEW ================= */}
      <OverviewBlock
        submittedCount={submittedCount}
        notSubmittedCount={notSubmittedCount}
        submittedPercent={submittedPercent}
        notSubmittedPercent={notSubmittedPercent}
        scoreStats={scoreStats}
        passedCount={passedCount}
        submittedTotal={submittedCount}
        passRate={passRate}
        onShowUnsubmitted={() => setShowUnsubmittedModal(true)}
      />

      {/* ================= TABLE ================= */}
      <GradeTable
        grades={filteredGrades}
        onDelete={handleDeleteGrade}
      />

      {/* ================= MODAL ================= */}
      {showUnsubmittedModal && (
        <UnsubmittedModal
          students={unsubmittedStudents}
          className={selectedClass?.name}
          onClose={() => setShowUnsubmittedModal(false)}
        />
      )}
    </div>
  );
};

/* =========================
   SMALL COMPONENTS
========================= */

const FilterSelect = ({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <div className="flex-1 min-w-[240px] space-y-2">
    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none border-2 border-slate-100 rounded-2xl px-5 py-3 font-bold text-sm"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  </div>
);

/* =========================
   EXPORT
========================= */
export default GradeManagement;
