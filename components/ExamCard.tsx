import React, { useMemo, useState } from "react";
import {
  Clock,
  FileText,
  Lock,
  Unlock,
  Play,
  Edit3,
  Trash2,
  Users,
  Calendar,
  Upload,
  ExternalLink,
} from "lucide-react";
import { Exam } from "../types";
import { uploadExamFile, deleteExamFile } from "../services/examService";

interface ExamCardProps {
  exam: Exam;
  onView?: (exam: Exam) => void;
  onEdit?: (exam: Exam) => void;
  onDelete?: (id: string) => void;
  onToggleLock?: (exam: Exam) => void;
  onAssign?: (exam: Exam) => void;
}

const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  onView,
  onEdit,
  onDelete,
  onToggleLock,
  onAssign,
}) => {
  const [loading, setLoading] = useState(false);

  const formattedDate = useMemo(() => {
    if (!exam.createdAt) return "N/A";
    return new Date(exam.createdAt).toLocaleDateString("vi-VN");
  }, [exam.createdAt]);

  const assignedClassCount =
    exam.assignedClassIds?.length ?? 0;

  /* =========================
     DELETE
  ========================= */
  const handleDelete = async () => {
    if (!onDelete) return;

    const confirmDelete = confirm(
      "⚠️ Bạn có chắc muốn xóa đề thi này?"
    );
    if (!confirmDelete) return;

    setLoading(true);
    await onDelete(exam.id);
    setLoading(false);
  };

  /* =========================
     UPLOAD FILE
  ========================= */
  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.[0]) return;

    setLoading(true);
    await uploadExamFile(e.target.files[0], exam.id);
    setLoading(false);

    alert("Upload thành công!");
  };

  /* =========================
     DELETE FILE
  ========================= */
  const handleDeleteFile = async () => {
    if (!exam.file_url) return;

    const confirmDelete = confirm(
      "Xóa file đề thi?"
    );
    if (!confirmDelete) return;

    setLoading(true);
    await deleteExamFile(
      exam.id,
      exam.file_url
    );
    setLoading(false);

    alert("Đã xóa file");
  };

  return (
    <div className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between h-full relative">

      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 pr-4">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
              exam.isLocked
                ? "bg-red-50 text-red-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {exam.isLocked ? "Đã khóa" : "Đang mở"}
          </span>

          <h3
            className="font-bold text-lg text-slate-800 hover:text-indigo-600 cursor-pointer mt-2"
            onClick={() => onView?.(exam)}
          >
            {exam.title}
          </h3>
        </div>
      </div>

      {/* INFO */}
      <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 mb-6">
        <div className="flex items-center gap-2">
          <Clock size={14} />
          {exam.duration} phút
        </div>

        <div className="flex items-center gap-2">
          <FileText size={14} />
          {exam.questionCount} câu
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={14} />
          {formattedDate}
        </div>

        <div className="flex items-center gap-2">
          <Users size={14} />
          {assignedClassCount} lớp
        </div>
      </div>

      {/* FILE */}
      <div className="mb-4 space-y-2">
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleUpload}
          className="text-xs"
        />

        {exam.file_url && (
          <div className="flex items-center gap-3 text-xs">
            <a
              href={exam.file_url}
              target="_blank"
              className="text-indigo-600 flex items-center gap-1"
            >
              <ExternalLink size={14} />
              Xem file
            </a>

            <button
              onClick={handleDeleteFile}
              className="text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex gap-2 border-t pt-3 mt-auto">
        <button
          onClick={() => onView?.(exam)}
          className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold"
        >
          <Play size={14} />
        </button>

        <button onClick={() => onAssign?.(exam)}>
          <Users size={16} />
        </button>

        <button onClick={() => onEdit?.(exam)}>
          <Edit3 size={16} />
        </button>

        <button onClick={() => onToggleLock?.(exam)}>
          {exam.isLocked ? (
            <Unlock size={16} />
          ) : (
            <Lock size={16} />
          )}
        </button>

        <button onClick={handleDelete}>
          {loading ? (
            <div className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full" />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      </div>
    </div>
  );
};

export default ExamCard;
