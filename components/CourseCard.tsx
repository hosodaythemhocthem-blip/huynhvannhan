import React, { useState, useRef, memo } from "react";
import {
  Book, Trash2, BookOpen, FileText, Loader2,
  Sparkles, ClipboardPaste, Calendar, ArrowRight,
  Upload, MoreVertical, File
} from "lucide-react";
import MathPreview from "./MathPreview";
// FIX: Xóa uploadFileToStorage vì không sử dụng và gây lỗi TS2305
import { supabase } from "../supabase"; 
import { motion } from "framer-motion";
import { useToast } from "./Toast"; 

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
  const { showToast } = useToast(); 
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
      const filePath = `${course.id}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('course_materials') 
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
      whileHover={{ y: -8, boxShadow: "0 20px 40px -10px rgba(99, 102, 241, 0.2)" }}
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
        <div className="font-bold text-slate-800 text-lg mb-2 line-clamp-2">
           <MathPreview content={course.title} />
        </div>
        
        {/* Description rendering Math */}
        <div className="text-sm text-slate-500 mb-6 flex-1 line-clamp-3">
             {course.description ? (
                <MathPreview content={course.description} />
             ) : (
                <span className="italic opacity-60">Chưa có mô tả cho khóa học này.</span>
             )}
        </div>

        {/* Course Meta Info */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-6 mt-auto">
            <div className="flex items-center gap-1.5" title="Số bài học">
                <FileText size={14} />
                <span>{course.lesson_count || 0}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Tài liệu đính kèm">
                <File size={14} />
                <span>{course.file_count || 0}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Ngày tạo">
                <Calendar size={14} />
                <span>{createdDate}</span>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
            <button 
                onClick={() => onOpen?.(course)}
                className="flex-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 group/btn"
            >
                Vào Lớp
                <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>

            {isTeacher && (
                <>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                        }}
                        disabled={isUploading}
                        className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors disabled:opacity-50"
                        title="Tải lên tài liệu"
                    >
                        {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    </button>

                    <button 
                        onClick={handleQuickPasteDescription}
                        className="p-3 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors"
                        title="Dán nhanh mô tả từ Clipboard"
                    >
                        <ClipboardPaste size={18} />
                    </button>

                    <button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-colors disabled:opacity-50"
                        title="Xóa khóa học"
                    >
                        {isDeleting ? <Loader2 size={18} className="animate-spin text-rose-500" /> : <Trash2 size={18} />}
                    </button>
                </>
            )}
        </div>
      </div>
    </motion.div>
  );
};

export default memo(CourseCard);
