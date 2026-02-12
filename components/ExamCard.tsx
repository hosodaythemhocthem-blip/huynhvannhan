import React, { useMemo, useRef, useState } from "react";
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
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Exam } from "../types";
import {
  uploadExamFile,
  deleteExamFile,
} from "../services/examService";

interface ExamCardProps {
  exam: Exam;
  onView?: (exam: Exam) => void;
  onEdit?: (exam: Exam) => void;
  onDelete?: (id: string) => Promise<void>;
  onToggleLock?: (exam: Exam) => void;
  onAssign?: (exam: Exam) => void;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  onView,
  onEdit,
  onDelete,
  onToggleLock,
  onAssign,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formattedDate = useMemo(() => {
    if (!exam.createdAt) return "N/A";
    return new Date(exam.createdAt).toLocaleDateString("vi-VN");
  }, [exam.createdAt]);

  const assignedClassCount =
    exam.assignedClassIds?.length ?? 0;

  /* =========================
     DELETE EXAM
  ========================= */
  const handleDelete = async () => {
    if (!onDelete || loading) return;

    if (!window.confirm("⚠️ Xóa đề thi vĩnh viễn?")) return;

    try {
      setLoading(true);
      await onDelete(exam.id);
    } catch (err) {
      console.error(err);
      alert("Xóa thất bại");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UPLOAD FILE
  ========================= */
  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];

    if (
      ![
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(file.type)
    ) {
      alert("Chỉ hỗ trợ PDF, DOC, DOCX");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert("File vượt quá 15MB");
      return;
    }

    try {
      setUploading(true);
      await uploadExamFile(file, exam.id);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      alert("Upload thành công");
    } catch (error) {
      console.error(error);
      alert("Upload thất bại");
    } finally {
      setUploading(false);
    }
  };

  /* =========================
     DELETE FILE
  ========================= */
  const handleDeleteFile = async () => {
    if (!exam.file_url || uploading) return;

    if (!window.confirm("Xóa file đề thi?")) return;

    try {
      setUploading(true);
      await deleteExamFile(exam.id, exam.file_url);
      alert("Đã xóa file");
    } catch (error) {
      console.error(error);
      alert("Xóa thất bại");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full relative">

      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 pr-4">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
              exam.isLocked
                ? "bg-red-50 text-red-600 border-red-200"
                : "bg-emerald-50 text-emerald-600 border-emerald-200"
            }`}
          >
            {exam.isLocked ? "Đã khóa" : "Đang mở"}
          </span>

          <h3
            className="font-bold text-lg text-slate-800 hover:text-indigo-600 cursor-pointer mt-2 transition-colors"
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
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleUpload}
            disabled={uploading}
            className="text-xs"
          />

          {uploading && (
            <Loader2 className="animate-spin text-indigo-600" size={16} />
          )}
        </div>

        {exam.file_url && (
          <div className="flex items-center gap-3 text-xs">
            <a
              href={exam.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 flex items-center gap-1 hover:underline"
            >
              <ExternalLink size={14} />
              Xem file
            </a>

            <button
              onClick={handleDeleteFile}
              disabled={uploading}
              className="text-red-500 hover:text-red-700 transition"
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
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95"
        >
          <Play size={14} />
          Vào thi
        </button>

        <button
          onClick={() => onAssign?.(exam)}
          className="p-2 rounded-lg hover:bg-slate-100 transition"
        >
          <Users size={16} />
        </button>

        <button
          onClick={() => onEdit?.(exam)}
          className="p-2 rounded-lg hover:bg-slate-100 transition"
        >
          <Edit3 size={16} />
        </button>

        <button
          onClick={() => onToggleLock?.(exam)}
          className="p-2 rounded-lg hover:bg-slate-100 transition"
        >
          {exam.isLocked ? (
            <Unlock size={16} />
          ) : (
            <Lock size={16} />
          )}
        </button>

        <button
          onClick={handleDelete}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      </div>
    </div>
  );
};

export default ExamCard;
