
import React, { useMemo, useRef, useState, memo } from "react";
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
  Eye,
  ClipboardPaste,
  Sparkles,
  FileUp,
  MoreVertical
} from "lucide-react";
// Fix: Import OnlineExam to unify types
import { OnlineExam } from "../examFo";
import { supabase } from "../supabase";
import MathPreview from "./MathPreview";

interface ExamCardProps {
  // Fix: Use OnlineExam type consistently
  exam: OnlineExam & { assignedClassIds?: string[]; questionCount?: number };
  onView?: (exam: OnlineExam) => void;
  onEdit?: (exam: OnlineExam) => void;
  onDelete?: (id: string) => Promise<void> | void;
  onToggleLock?: (exam: OnlineExam) => void;
  onAssign?: (exam: OnlineExam) => void;
  role?: 'teacher' | 'student';
}

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB limit

const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  onView,
  onEdit,
  onDelete,
  onToggleLock,
  onAssign,
  role = 'teacher'
}) => {
  const isTeacher = role === 'teacher';
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formattedDate = useMemo(() => {
    if (!exam.createdAt) return "Mới tạo";
    return new Date(exam.createdAt).toLocaleDateString("vi-VN", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, [exam.createdAt]);

  const fileName = useMemo(() => {
    if (!exam.file_url) return null;
    return exam.file_url.split("/").pop()?.split('?')[0];
  }, [exam.file_url]);

  // Xử lý xóa đề thi vĩnh viễn
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete || loading) return;
    if (confirm(`Thầy Nhẫn chắc chắn muốn xóa vĩnh viễn đề thi "${exam.title}"? Dữ liệu trên Cloud Supabase sẽ biến mất mãi mãi.`)) {
      try {
        setLoading(true);
        await supabase.from('exams').delete(exam.id);
        if (onDelete) await onDelete(exam.id);
      } catch (err) {
        alert("Lỗi xóa đề thi.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Xử lý dán nhanh nội dung (Ctrl+V)
  const handleQuickPaste = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        await supabase.from('exams').update(exam.id, { description: text });
        alert("Đã cập nhật mô tả đề thi từ Clipboard!");
        window.location.reload();
      }
    } catch (err) {
      alert("Hãy dùng phím Ctrl+V hoặc cấp quyền Clipboard.");
    }
  };

  // Xử lý upload Word/PDF
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert("File quá lớn! Thầy hãy chọn file dưới 15MB nhé.");
      return;
    }

    setUploading(true);
    try {
      // Giả lập lưu vào Storage Supabase
      const filePath = `exams/${exam.id}/${file.name}`;
      await supabase.storage.from('documents').upload(filePath, file);
      
      const fileUrl = `https://storage.nhanlms.cloud/${filePath}`;
      await supabase.from('exams').update(exam.id, { file_url: fileUrl });
      
      alert(`Đã đính kèm file "${file.name}" thành công!`);
      window.location.reload();
    } catch (err) {
      alert("Lỗi tải file lên hệ thống.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group bg-white border border-slate-100 rounded-[2.5rem] p-7 hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] hover:-translate-y-2 transition-all duration-500 flex flex-col h-full relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[80px] -mr-10 -mt-10 transition-transform duration-700 ${isHovered ? 'scale-150' : 'scale-100'} blur-xl`}></div>

      {/* Header: Status & Actions */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-sm ${
            exam.isLocked 
              ? 'bg-rose-50 text-rose-500 border-rose-100' 
              : 'bg-emerald-50 text-emerald-500 border-emerald-100'
          }`}>
            {exam.isLocked ? <div className="flex items-center gap-1"><Lock size={10}/> Đã khóa</div> : <div className="flex items-center gap-1"><Unlock size={10}/> Đang mở</div>}
          </span>
          {exam.file_url && (
             <span className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full text-[10px] font-black border border-amber-100 flex items-center gap-1">
               <FileText size={10} /> FILE ĐÍNH KÈM
             </span>
          )}
        </div>

        {isTeacher && (
           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={handleQuickPaste}
                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                title="Dán nhanh mô tả (Ctrl+V)"
              >
                <ClipboardPaste size={18} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                title="Đính kèm Word/PDF"
              >
                {uploading ? <Loader2 className="animate-spin" size={18} /> : <FileUp size={18} />}
              </button>
              <input ref={fileInputRef} type="file" hidden accept=".pdf,.docx" onChange={handleFileUpload} />
           </div>
        )}
      </div>

      {/* Body: Title & Stats */}
      <div className="relative z-10 flex-1">
        <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-5 shadow-2xl group-hover:bg-indigo-600 transition-colors transform group-hover:rotate-3">
          <FileText size={28} />
        </div>

        <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight mb-4">
          <MathPreview content={exam.title} />
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
           <div className="flex items-center gap-2.5 text-xs font-bold text-slate-400">
             <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-indigo-400">
                <Clock size={14} />
             </div>
             {exam.duration} Phút
           </div>
           <div className="flex items-center gap-2.5 text-xs font-bold text-slate-400">
             <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-emerald-400">
                <Sparkles size={14} />
             </div>
             {exam.questions?.length || exam.questionCount || 0} Câu hỏi
           </div>
           <div className="flex items-center gap-2.5 text-xs font-bold text-slate-400">
             <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-amber-400">
                <Calendar size={14} />
             </div>
             {formattedDate}
           </div>
           <div className="flex items-center gap-2.5 text-xs font-bold text-slate-400">
             <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-purple-400">
                <Users size={14} />
             </div>
             {exam.assignedClassIds?.length || 0} Lớp học
           </div>
        </div>
      </div>

      {/* Footer: Action Buttons */}
      <div className="relative z-10 pt-6 mt-auto border-t border-slate-50 flex items-center gap-3">
        <button
          onClick={() => onView?.(exam)}
          className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 group/play"
        >
          <Play size={16} className="fill-current group-hover/play:scale-125 transition-transform" />
          Bắt đầu thi
        </button>

        {isTeacher && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit?.(exam)}
              className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
              title="Chỉnh sửa đề"
            >
              <Edit3 size={18} />
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="p-4 bg-rose-50 text-rose-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm disabled:opacity-50"
              title="Xóa vĩnh viễn"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
            </button>
          </div>
        )}
      </div>

      {/* File Preview Link (Floating) */}
      {exam.file_url && isHovered && (
        <a 
          href={exam.file_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-xs font-black text-indigo-600 animate-in zoom-in-50 duration-300"
        >
          <Eye size={14} /> XEM FILE ĐỀ THI
        </a>
      )}
    </div>
  );
};

export default memo(ExamCard);
