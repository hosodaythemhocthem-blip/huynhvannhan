import React, { useMemo, useRef, useState, memo } from "react";
import {
  Clock, FileText, Lock, Unlock, Play, Edit3, Trash2, 
  Users, Calendar, ExternalLink, Loader2, Eye, 
  ClipboardPaste, Sparkles, FileUp, MoreVertical, Trash
} from "lucide-react";
import { OnlineExam } from "../types"; // Đảm bảo đúng đường dẫn type
import { supabase } from "../supabase";
import MathPreview from "./MathPreview";
import { motion } from "framer-motion";

interface ExamCardProps {
  exam: OnlineExam & { assignedClassIds?: string[]; questionCount?: number };
  onView?: (exam: OnlineExam) => void;
  onEdit?: (exam: OnlineExam) => void;
  onDelete?: (id: string) => Promise<void> | void;
  onToggleLock?: (exam: OnlineExam) => void;
  role?: 'teacher' | 'student';
}

const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  onView,
  onEdit,
  onDelete,
  onToggleLock,
  role = 'teacher'
}) => {
  const isTeacher = role === 'teacher';
  const [loading, setLoading] = useState(false);

  const handleQuickPaste = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const text = await navigator.clipboard.readText();
      const { error } = await (supabase.from('exams') as any)
        .update({ description: text })
        .eq('id', exam.id);
      
      if (error) throw error;
      alert("Đã dán và cập nhật mô tả đề thi vĩnh viễn!");
      window.location.reload();
    } catch (err) {
      alert("Không thể truy cập bộ nhớ tạm!");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Thầy Nhẫn có chắc muốn xóa VĨNH VIỄN đề thi: ${exam.title}?`)) {
      setLoading(true);
      try {
        const { error } = await (supabase.from('exams') as any).delete().eq('id', exam.id);
        if (error) throw error;
        if (onDelete) onDelete(exam.id);
      } catch (err) {
        alert("Lỗi khi xóa dữ liệu Cloud.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col h-full relative"
    >
      {/* Badge Trạng thái */}
      <div className="absolute top-6 right-6 z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleLock?.(exam); }}
          className={`p-3 rounded-2xl transition-all shadow-lg ${exam.isLocked ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}
        >
          {exam.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
        </button>
      </div>

      <div className="p-8 flex flex-col flex-1">
        {/* Tiêu đề & Math */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
            <Sparkles size={12} /> {exam.grade || "Tự do"}
          </div>
          <h3 className="text-xl font-black text-slate-800 italic leading-tight group-hover:text-indigo-600 transition-colors">
            <MathPreview content={exam.title} />
          </h3>
        </div>

        {/* Thông tin chi tiết */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="flex items-center gap-3 text-slate-400 font-bold text-[10px] uppercase">
            <Clock size={14} className="text-slate-300" />
            {exam.duration} Phút
          </div>
          <div className="flex items-center gap-3 text-slate-400 font-bold text-[10px] uppercase">
            <FileText size={14} className="text-slate-300" />
            {exam.questions?.length || 0} Câu hỏi
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
          <button
            onClick={() => onView?.(exam)}
            className="flex-1 mr-3 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
          >
            <Play size={14} fill="currentColor" /> Bắt đầu
          </button>

          {isTeacher && (
            <div className="flex gap-2">
              <button
                onClick={handleQuickPaste}
                className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-md rounded-2xl transition-all"
                title="Dán nhanh (Ctrl+V)"
              >
                <ClipboardPaste size={18} />
              </button>
              <button
                onClick={() => onEdit?.(exam)}
                className="p-4 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all"
                title="Sửa đề"
              >
                <Edit3 size={18} />
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="p-4 bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white rounded-2xl transition-all"
                title="Xóa vĩnh viễn"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Trash size={18} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default memo(ExamCard);
