// components/CourseCard.tsx
import React, { useState, memo } from "react";
import {
  Book,
  Edit,
  Trash2,
  User,
  BookOpen,
  GraduationCap,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";

export interface Course {
  id: string;
  title: string;
  grade: string;
  description?: string;
  teacherName?: string;
  lessonCount?: number;
  fileCount?: number;
  createdAt?: string | Date;
}

interface CourseCardProps {
  course: Course;
  onOpen?: (course: Course) => void;
  onEdit?: (course: Course) => void;
  onDelete?: (course: Course) => Promise<void> | void;
  role?: "ADMIN" | "TEACHER" | "STUDENT";
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onOpen,
  onEdit,
  onDelete,
  role = "STUDENT",
}) => {
  const canEdit = role === "TEACHER" || role === "ADMIN";
  const [isDeleting, setIsDeleting] = useState(false);

  const createdDate = course.createdAt
    ? new Date(course.createdAt)
    : null;

  const isNew =
    createdDate &&
    (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24) < 7;

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;

    const confirmDelete = window.confirm(
      `Bạn có chắc muốn xóa khóa học "${course.title}" không?`
    );
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      await onDelete(course);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="group relative bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full overflow-hidden">

      {/* Gradient Corner */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-bl-[60px] opacity-60 group-hover:opacity-100 transition-all duration-500" />

      <div className="relative z-10">

        {/* Header */}
        <div className="flex justify-between items-start mb-4">

          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
            <Book size={24} />
          </div>

          <div className="flex flex-col items-end gap-2">

            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
              Khối {course.grade}
            </span>

            {isNew && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-600">
                <Sparkles size={12} />
                MỚI
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-black text-slate-800 mb-2 leading-tight line-clamp-2 group-hover:text-indigo-700 transition-colors">
          {course.title || "Chưa có tiêu đề"}
        </h3>

        {/* Info */}
        <div className="space-y-2 mb-4">

          {course.teacherName && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <User size={14} className="text-slate-400" />
              <span>GV: {course.teacherName}</span>
            </div>
          )}

          {course.lessonCount !== undefined && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <BookOpen size={14} />
              {course.lessonCount} bài học
            </div>
          )}

          {course.fileCount !== undefined && (
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500">
              <FileText size={14} />
              {course.fileCount} tài liệu
            </div>
          )}

          {course.description && (
            <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">
              {course.description}
            </p>
          )}

          {createdDate && (
            <div className="text-[11px] text-slate-400 font-medium">
              Tạo ngày: {createdDate.toLocaleDateString("vi-VN")}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 pt-4 mt-auto border-t border-slate-100">
        <div className="flex gap-3">

          <button
            onClick={() => onOpen?.(course)}
            disabled={!onOpen}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <GraduationCap size={16} />
            Vào học
          </button>

          {canEdit && (
            <>
              <button
                onClick={() => onEdit?.(course)}
                disabled={!onEdit}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
              >
                <Edit size={18} />
              </button>

              <button
                onClick={handleDelete}
                disabled={!onDelete || isDeleting}
                className="p-2.5 rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-200 transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(CourseCard);
