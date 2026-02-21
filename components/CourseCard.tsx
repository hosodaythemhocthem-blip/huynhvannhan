import React, { useState, useRef, memo } from "react";
import {
  Book, Trash2, BookOpen, FileText, Loader2,
  Sparkles, ClipboardPaste, Calendar, ArrowRight,
  Upload, MoreVertical, File
} from "lucide-react";
import MathPreview from "./MathPreview";
import { supabase, uploadFileToStorage } from "../supabase";
import { motion } from "framer-motion";
import { useToast } from "./Toast"; // Cần Toast để thông báo đẹp

export interface Course {
  id: string;
  title: string;
  grade: string;
  description?: string;
  teacher_name?: string;
  lesson_count?: number;
  file_count?: number;
  created_at?: string | Date;
}

interface CourseCardProps {
  course: Course;
  onOpen?: (course: Course) => void;
  onDelete?: (course: Course) => void;
  role?: "teacher" | "student";
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onOpen,
  onDelete,
  role = "student",
}) => {
  const { showToast } = useToast(); // Hook thông báo
  const isTeacher = role === "teacher";

  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createdDate = course.created_at
    ? new Date(course.created_at).toLocaleDateString("vi-VN")
    : "Vừa xong";

  // --- 1. Xử lý Upload File (Word/PDF) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];

    // Validate file type
    if (!file.name.match(/\.(pdf|docx|doc)$/i)) {
      showToast("Chỉ hỗ trợ file PDF hoặc Word (docx)!", "error");
      return;
    }

    setIsUploading(true);
    try {
      // Upload lên Supabase Storage bucket 'course_materials'
      // Path: course_id/filename
      const filePath = `${course.id}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('course_materials') // Hãy tạo bucket này trong Supabase Storage (Public)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Cập nhật số lượng tài liệu trong DB
      const newCount = (course.file_count || 0) + 1;
      await supabase
        .from("courses")
        .update({ file_count: newCount })
        .eq("id", course.id);

      showToast(`Đã tải lên "${file.name}" thành công!`, "success");
      
    } catch (err: any) {
      console.error(err);
      showToast("Lỗi tải file. Kiểm tra kết nối mạng.", "error");
    } finally {
      setIsUploading(false);
      // Reset input để upload lại cùng 1 file nếu muốn
      if (fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };

  // --- 2. Xử lý Paste nhanh mô tả (Ctrl+V) ---
  // Tính năng này ẩn, có thể kích hoạt bằng nút Paste
  const handleQuickPasteDescription = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      const { error } = await supabase
        .from("courses")
        .update({ description: text })
        .eq("id", course.id);

      if (error) throw error;
      showToast("Đã dán mô tả mới từ Clipboard!", "success");
      // Để UI cập nhật, component cha cần fetch lại hoặc ta dùng local state (nhưng ở đây đơn giản là báo thành công)
    } catch (err) {
      showToast("Không thể dán nội dung.", "error");
    }
  };

  // --- 3. Xử lý Xóa khóa học ---
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Xóa khóa học: "${course.title}" và toàn bộ tài liệu bên trong?`)) return;

    setIsDeleting(true);
    try {
      // Xóa trong DB
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", course.id);

      if (error) throw error;
      
      // Callback để cha xóa khỏi list UI
      onDelete?.(course);
      showToast("Đã xóa khóa học.", "info");
    } catch (err) {
      showToast("Lỗi khi xóa khóa học.", "error");
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, shadow: "0 20px 40px -10px rgba(99, 102, 241, 0.2)" }}
      className="group bg-white rounded-[2rem] border border-slate-100 shadow-lg overflow-hidden flex flex-col h-full relative transition-all duration-300"
    >
      {/* Nút Upload ẩn (kích hoạt qua ref) */}
      <input
        type="file"
        hidden
        ref={fileInputRef}
        accept=".pdf,.docx,.doc"
        onChange={handleFileUpload}
      />

      {/* --- Card Image / Banner --- */}
      <div className="h-40 bg-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <motion.div 
           whileHover={{ rotate: 10, scale: 1.1 }}
           transition={{ type: "spring", stiffness: 300 }}
        >
          <BookOpen size={56} className="text-indigo-400 opacity-90 relative z-10" />
        </motion.div>
        
        <div className="absolute top-4 right-4">
           <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-xl">
             Lớp {course.grade}
           </span>
        </div>
      </div>

      {/* --- Content --- */}
      <div className="p-6 flex flex-col flex-1 relative">
        {/* Title rendering Math */}
        <div className="mb-3 min-h-[3rem]">
           <h3 className="text-lg font-black text-slate-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
              <MathPreview content={course.title} className="font-sans" />
           </h3>
        </div>

        {/* Date & Author */}
        <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-4">
          <span className="flex items-center gap-1"><Calendar size={12} /> {createdDate}</span>
        </div>

        {/* Description */}
        <p className="text-slate-500 text-sm line-clamp-2 mb-6 leading-relaxed">
          {course.description ? (
             <MathPreview content={course.description} />
          ) : (
             <span className="italic opacity-50">Chưa có mô tả chi tiết...</span>
          )}
        </p>

        {/* --- Stats Row --- */}
        <div className="grid grid-cols-2 gap-3 mt-auto mb-6">
          <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100 group-hover:border-indigo-100 transition-colors">
             <p className="text-[10px] text-slate-400 font-black uppercase">Bài giảng</p>
             <p className="text-xl font-black text-slate-700">{course.lesson_count || 0}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100 group-hover:border-indigo-100 transition-colors">
             <p className="text-[10px] text-slate-400 font-black uppercase">Tài liệu</p>
             <p className="text-xl font-black text-slate-700">{course.file_count || 0}</p>
          </div>
        </div>

        {/* --- Actions --- */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
          <button
            onClick={() => onOpen?.(course)}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
          >
            Vào học <ArrowRight size={14} />
          </button>

          {isTeacher && (
            <div className="flex gap-2">
              {/* Nút Paste Mô tả */}
              <button
                onClick={handleQuickPasteDescription}
                className="p-3 border border-slate-200 text-slate-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                title="Dán mô tả (Ctrl+V)"
              >
                <ClipboardPaste size={16} />
              </button>

              {/* Nút Upload File */}
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                disabled={isUploading}
                className="p-3 border border-slate-200 text-slate-400 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all relative overflow-hidden"
                title="Tải lên Word/PDF"
              >
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              </button>

              {/* Nút Delete */}
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                title="Xóa khóa học"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Uploading Overlay Effect */}
      {isUploading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600 mb-2" size={32} />
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest animate-pulse">Đang tải lên...</span>
        </div>
      )}
    </motion.div>
  );
};

export default memo(CourseCard);
