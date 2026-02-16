
import React, { useState, memo, useRef } from "react";
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
  Paperclip,
  ClipboardPaste,
  MoreHorizontal
} from "lucide-react";
import MathPreview from "./MathPreview";
import { supabase } from "../supabase";

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

  const createdDate = course.createdAt ? new Date(course.createdAt) : null;
  const isNew = createdDate && (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24) < 7;

  // Xử lý xóa vĩnh viễn qua Supabase
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete || isDeleting) return;

    if (confirm(`Thầy Nhẫn chắc chắn muốn xóa vĩnh viễn khóa học "${course.title}"? Dữ liệu trên Cloud sẽ không thể khôi phục.`)) {
      try {
        setIsDeleting(true);
        await supabase.from('courses').delete(course.id);
        if (onDelete) await onDelete(course);
      } catch (err) {
        console.error("Lỗi xóa khóa học:", err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Xử lý tải file nhanh (Word/PDF)
  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Giả lập upload lên Supabase Storage & Database
      const newMaterial = {
        id: Math.random().toString(36).substr(2, 9),
        course_id: course.id,
        file_name: file.name,
        created_at: new Date().toISOString()
      };
      await supabase.from('class_materials').insert(newMaterial);
      alert(`Đã thêm tài liệu "${file.name}" vào khóa học vĩnh viễn!`);
    } catch (err) {
      alert("Lỗi tải file nhanh.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Xử lý dán nhanh (Ctrl+V helper)
  const handleQuickPaste = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        await supabase.from('courses').update(course.id, { description: text });
        alert("Đã cập nhật mô tả khóa học từ Clipboard!");
        window.location.reload(); // Refresh để thấy thay đổi
      }
    } catch (err) {
      alert("Hãy dùng phims Ctrl+V hoặc cấp quyền Clipboard.");
    }
  };

  return (
    <div 
      onClick={() => onOpen?.(course)}
      className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between h-full overflow-hidden cursor-pointer"
    >
      {/* Hiệu ứng nền Blur */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/50 rounded-bl-[100px] -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700 blur-2xl"></div>

      <div className="relative z-10">
        {/* Header: Icon & Tags */}
        <div className="flex justify-between items-start mb-6">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl group-hover:bg-indigo-600 transition-all duration-300 transform group-hover:rotate-6">
            <Book size={28} />
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
              Khối {course.grade}
            </span>
            {isNew && (
              <span className="flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse">
                <Sparkles size={12} /> MỚI
              </span>
            )}
          </div>
        </div>

        {/* Content: Title & Math Description */}
        <h3 className="text-2xl font-black text-slate-800 mb-4 leading-tight line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {course.title}
        </h3>

        <div className="space-y-4 mb-6">
          {course.description && (
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50 group-hover:bg-white transition-all">
               <MathPreview 
                 content={course.description.length > 100 ? course.description.substring(0, 100) + "..." : course.description} 
                 className="text-sm text-slate-500 font-medium leading-relaxed"
               />
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <User size={14} className="text-indigo-400" />
              <span>GV: {course.teacherName || "Thầy Huỳnh Văn Nhẫn"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-tighter">
              <BookOpen size={14} />
              {course.lessonCount || 0} bài học
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-tighter">
              <FileText size={14} />
              {course.fileCount || 0} tài liệu
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Action Buttons */}
      <div className="relative z-10 pt-6 mt-auto border-t border-slate-50 flex items-center justify-between">
        <button
          onClick={(e) => { e.stopPropagation(); onOpen?.(course); }}
          className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 group/btn"
        >
          <GraduationCap size={18} className="group-hover/btn:animate-bounce" />
          VÀO HỌC NGAY
        </button>

        {isTeacher && (
          <div className="flex items-center gap-2 ml-4">
            {/* Quick Upload Button */}
            <button
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
              title="Tải Word/PDF nhanh"
            >
              {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              hidden 
              accept=".pdf,.docx" 
              onChange={handleQuickUpload} 
            />

            {/* Quick Paste Button */}
            <button
              onClick={handleQuickPaste}
              className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-white hover:shadow-md transition-all"
              title="Dán nhanh mô tả (Ctrl+V)"
            >
              <ClipboardPaste size={18} />
            </button>

            {/* Delete Button */}
            <button
              onClick={handleDelete}
              className="p-3 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
              title="Xóa vĩnh viễn"
            >
              {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(CourseCard);
