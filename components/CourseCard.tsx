import React, { useState, useRef } from "react";
import {
  Book, Trash2, User, BookOpen, GraduationCap,
  FileText, Loader2, Sparkles, Paperclip,
  ClipboardPaste, MoreHorizontal, Calendar, ArrowRight
} from "lucide-react";
import MathPreview from "./MathPreview";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";

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
  role?: "teacher" | "student";
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onOpen,
  onEdit,
  onDelete,
  role = "student",
}) => {
  const isTeacher = role === "teacher";
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createdDate = course.createdAt ? new Date(course.createdAt) : new Date();

  const handleQuickPaste = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const text = await navigator.clipboard.readText();
      const { error } = await (supabase.from('courses') as any)
        .update({ description: text })
        .eq('id', course.id);
      
      if (error) throw error;
      alert("Đã cập nhật mô tả từ bộ nhớ tạm!");
      window.location.reload(); // Refresh để thấy thay đổi
    } catch (err) {
      alert("Không thể dán nội dung. Hãy thử lại!");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Thầy Nhẫn chắc chắn muốn xóa khóa học: ${course.title}?`)) {
      setIsDeleting(true);
      try {
        const { error } = await (supabase.from('courses') as any).delete().eq('id', course.id);
        if (error) throw error;
        if (onDelete) onDelete(course);
      } catch (err) {
        alert("Lỗi khi xóa khóa học vĩnh viễn.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <motion.div
      whileHover={{ y: -10, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-full relative"
    >
      {/* Cấp lớp badge */}
      <div className="absolute top-6 left-6 z-10">
        <span className="px-5 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-indigo-200">
          Lớp {course.grade}
        </span>
      </div>

      {/* Ảnh giả lập/Icon */}
      <div className="h-48 bg-slate-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 animate-pulse"></div>
        <BookOpen size={64} className="text-white/20 group-hover:scale-110 transition-transform duration-500" />
        <Sparkles size={24} className="absolute top-6 right-6 text-indigo-400 animate-bounce" />
      </div>

      {/* Nội dung */}
      <div className="p-8 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="text-xl font-black text-slate-800 italic leading-tight group-hover:text-indigo-600 transition-colors">
            <MathPreview content={course.title} />
          </h3>
          <div className="flex items-center gap-2 mt-2 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
            <Calendar size={12} />
            {createdDate.toLocaleDateString('vi-VN')}
          </div>
        </div>

        <p className="text-slate-500 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">
          {course.description || "Chưa có mô tả chi tiết cho khóa học này."}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-auto mb-8">
          <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Book size={14} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Bài giảng</p>
              <p className="text-sm font-black text-slate-700">{course.lessonCount || 0}</p>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <FileText size={14} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Tài liệu</p>
              <p className="text-sm font-black text-slate-700">{course.fileCount || 0}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-50">
          <button
            onClick={() => onOpen?.(course)}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
          >
            Vào học <ArrowRight size={14} />
          </button>

          {isTeacher && (
            <div className="flex gap-2">
              <button
                onClick={handleQuickPaste}
                className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 rounded-xl transition-all"
                title="Dán mô tả nhanh (Ctrl+V)"
              >
                <ClipboardPaste size={18} />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                title="Xóa khóa học vĩnh viễn"
              >
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default memo(CourseCard);
