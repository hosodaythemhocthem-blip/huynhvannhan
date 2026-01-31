import React from "react";
import {
  Book,
  Edit,
  Trash2,
  User,
  BookOpen,
  GraduationCap,
} from "lucide-react";

/* =========================
   KIỂU DỮ LIỆU
========================= */
export interface Course {
  id: string;
  title: string;
  grade: string;
  description?: string;
  teacherName?: string;
  lessonCount?: number;
  createdAt?: unknown; // an toàn hơn any
}

/* =========================
   PROPS
========================= */
interface CourseCardProps {
  course: Course;
  onOpen?: (course: Course) => void;
  onEdit?: (course: Course) => void;
  onDelete?: (course: Course) => void;
  role?: "ADMIN" | "TEACHER" | "STUDENT";
}

/* =========================
   COMPONENT
========================= */
const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onOpen,
  onEdit,
  onDelete,
  role = "STUDENT",
}) => {
  const canEdit = role === "TEACHER" || role === "ADMIN";

  return (
    <div className="group relative bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full">
      
      {/* Decorative Gradient */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-[40px] rounded-tr-[20px] -z-0 opacity-50 group-hover:opacity-100 transition-opacity" />

      {/* HEADER */}
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
            <Book size={24} />
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
            Khối {course.grade}
          </span>
        </div>

        <h3 className="text-lg font-black text-slate-800 mb-2 leading-tight line-clamp-2 group-hover:text-indigo-700 transition-colors">
          {course.title}
        </h3>

        <div className="space-y-2 mb-4">
          {course.teacherName && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <User size={14} className="text-slate-400" />
              <span>GV: {course.teacherName}</span>
            </div>
          )}

          {course.description && (
            <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">
              {course.description}
            </p>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="relative z-10 pt-4 mt-auto border-t border-slate-100">
        {typeof course.lessonCount === "number" && (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">
            <BookOpen size={14} />
            {course.lessonCount} bài học
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => onOpen?.(course)}
            disabled={!onOpen}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Vào học"
          >
            <GraduationCap size={16} />
            Vào học
          </button>

          {canEdit && (
            <>
              <button
                onClick={() => onEdit?.(course)}
                disabled={!onEdit}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Chỉnh sửa"
                aria-label="Chỉnh sửa khóa học"
              >
                <Edit size={18} />
              </button>

              <button
                onClick={() => onDelete?.(course)}
                disabled={!onDelete}
                className="p-2.5 rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Xóa khóa học"
                aria-label="Xóa khóa học"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
