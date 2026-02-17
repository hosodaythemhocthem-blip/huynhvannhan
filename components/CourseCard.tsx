import React, { useState, useRef, memo } from "react";
import {
  Book,
  Trash2,
  BookOpen,
  FileText,
  Loader2,
  Sparkles,
  ClipboardPaste,
  Calendar,
  ArrowRight,
  Upload
} from "lucide-react";
import MathPreview from "./MathPreview";
import { supabase } from "../supabase";
import { motion } from "framer-motion";

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
  onDelete,
  role = "student",
}) => {
  const isTeacher = role === "teacher";

  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [description, setDescription] = useState(course.description || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createdDate = course.createdAt
    ? new Date(course.createdAt)
    : new Date();

  /* =============================
     QUICK PASTE DESCRIPTION
  ============================== */
  const handleQuickPaste = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const text = await navigator.clipboard.readText();

      const { error } = await supabase
        .from("courses")
        .update({ description: text })
        .eq("id", course.id);

      if (error) throw error;

      setDescription(text);
      alert("Đã cập nhật mô tả thành công!");
    } catch (err) {
      alert("Không thể dán nội dung.");
    }
  };

  /* =============================
     DELETE COURSE
  ============================== */
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`Thầy Nhẫn chắc chắn muốn xóa khóa học: ${course.title}?`))
      return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", course.id);

      if (error) throw error;

      onDelete?.(course);
    } catch (err) {
      alert("Lỗi khi xóa khóa học.");
    } finally {
      setIsDeleting(false);
    }
  };

  /* =============================
     UPLOAD FILE (PDF / WORD)
  ============================== */
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];

    if (!file.name.match(/\.(pdf|docx)$/i)) {
      alert("Chỉ hỗ trợ file PDF hoặc DOCX");
      return;
    }

    setIsUploading(true);

    try {
      const filePath = `${course.id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("course-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Tăng fileCount
      const newCount = (course.fileCount || 0) + 1;

      await supabase
        .from("courses")
        .update({ fileCount: newCount })
        .eq("id", course.id);

      alert("Tải tài liệu thành công!");
    } catch (err) {
      alert("Lỗi khi tải tài liệu.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-md overflow-hidden flex flex-col h-full relative transition-all"
    >
      {/* Grade Badge */}
      <div className="absolute top-6 left-6 z-10">
        <span className="px-5 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
          Lớp {course.grade}
        </span>
      </div>

      {/* Banner */}
      <div className="h-44 bg-slate-900 flex items-center justify-center relative">
        <BookOpen
          size={60}
          className="text-white/20 group-hover:scale-110 transition-transform"
        />
        <Sparkles
          size={20}
          className="absolute top-6 right-6 text-indigo-400 animate-pulse"
        />
      </div>

      {/* Content */}
      <div className="p-8 flex flex-col flex-1">
        <h3 className="text-xl font-black text-slate-800 italic mb-2 group-hover:text-indigo-600 transition">
          <MathPreview content={course.title} />
        </h3>

        <div className="flex items-center gap-2 text-slate-400 text-xs mb-4">
          <Calendar size={12} />
          {createdDate.toLocaleDateString("vi-VN")}
        </div>

        <p className="text-slate-500 text-sm line-clamp-2 mb-6">
          {description || "Chưa có mô tả."}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-auto mb-6">
          <Stat label="Bài giảng" value={course.lessonCount || 0} />
          <Stat label="Tài liệu" value={course.fileCount || 0} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={() => onOpen?.(course)}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase hover:bg-indigo-600 transition"
          >
            Vào học <ArrowRight size={14} />
          </button>

          {isTeacher && (
            <div className="flex gap-2">
              <button
                onClick={handleQuickPaste}
                className="p-3 border rounded-xl hover:bg-indigo-50"
              >
                <ClipboardPaste size={16} />
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 border rounded-xl hover:bg-emerald-50"
              >
                {isUploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
              </button>

              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition"
              >
                {isDeleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>

              <input
                type="file"
                hidden
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* Small Stat Component */
const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-slate-50 p-4 rounded-xl text-center">
    <p className="text-xs text-slate-400 font-bold uppercase">{label}</p>
    <p className="text-lg font-black text-slate-700">{value}</p>
  </div>
);

export default memo(CourseCard);
