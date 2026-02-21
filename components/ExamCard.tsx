import React, { memo } from "react";
import { Play, Edit3, Trash2, Lock, Unlock, FileText, Clock } from "lucide-react";
import { Exam } from "../types";
import { motion } from "framer-motion";

interface Props {
  exam: Exam;
  questionCount?: number;
  onView?: (exam: Exam) => void;
  onEdit?: (exam: Exam) => void;
  onDelete?: (id: string) => void;
  onToggleLock?: (exam: Exam) => void;
  role?: "teacher" | "student" | "admin";
}

const ExamCard: React.FC<Props> = ({
  exam,
  questionCount = 0,
  onView,
  onEdit,
  onDelete,
  onToggleLock,
  role = "student",
}) => {
  const isTeacher = role === "teacher" || role === "admin";

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`relative bg-white p-5 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-xl group
        ${exam.is_locked ? 'border-slate-200 bg-slate-50' : 'border-indigo-100'}`}
    >
      {/* Badge Trạng thái */}
      <div className="flex justify-between items-start mb-3">
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1
          ${exam.is_locked ? 'bg-slate-200 text-slate-500' : 'bg-indigo-100 text-indigo-600'}`}>
          {exam.is_locked ? <><Lock size={10}/> Đã khóa</> : <><Unlock size={10}/> Đang mở</>}
        </div>
        
        {isTeacher && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleLock?.(exam); }}
            className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
            title={exam.is_locked ? "Mở khóa đề thi" : "Khóa đề thi"}
          >
            {exam.is_locked ? <Lock size={16} /> : <Unlock size={16} />}
          </button>
        )}
      </div>

      {/* Tiêu đề & Info */}
      <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
        {exam.title}
      </h3>
      
      <div className="flex items-center gap-4 text-xs text-slate-500 mb-6 font-medium">
        <span className="flex items-center gap-1"><FileText size={14}/> {questionCount} câu hỏi</span>
        <span className="flex items-center gap-1"><Clock size={14}/> 45 phút</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-slate-100">
        <button
          onClick={() => onView?.(exam)}
          disabled={exam.is_locked && !isTeacher}
          className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-indigo-600 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={14} /> {isTeacher ? "Xem trước" : "Làm bài"}
        </button>

        {isTeacher && (
          <>
            <button
              onClick={() => onEdit?.(exam)}
              className="p-2.5 border border-slate-200 text-slate-500 rounded-xl hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
              title="Chỉnh sửa"
            >
              <Edit3 size={16} />
            </button>

            <button
              onClick={() => onDelete?.(exam.id)}
              className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-colors"
              title="Xóa đề"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default memo(ExamCard);
