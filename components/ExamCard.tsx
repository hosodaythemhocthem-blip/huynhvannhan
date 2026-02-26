import React, { memo } from "react";
import { Play, Edit3, Trash2, Lock, Unlock, FileText, Clock, Calendar } from "lucide-react";
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
  
  // Format ngày tạo đề ra chuẩn Việt Nam (DD/MM/YYYY)
  const createdDate = exam.created_at 
    ? new Date(exam.created_at).toLocaleDateString('vi-VN') 
    : 'Mới cập nhật';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className={`relative flex flex-col justify-between bg-white rounded-2xl transition-all duration-300 shadow-sm hover:shadow-2xl overflow-hidden group border
        ${exam.is_locked ? 'border-slate-200/80 bg-slate-50/50' : 'border-indigo-100 hover:border-indigo-300'}`}
    >
      {/* Thanh viền màu trên cùng tạo điểm nhấn */}
      <div className={`h-1.5 w-full ${exam.is_locked ? 'bg-slate-300' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`} />

      <div className="p-5 flex-1 flex flex-col">
        {/* Header: Trạng thái & Nút Khóa/Mở */}
        <div className="flex justify-between items-start mb-4">
          <div className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm
            ${exam.is_locked 
              ? 'bg-slate-100 text-slate-500 border border-slate-200' 
              : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
            {exam.is_locked ? <><Lock size={12}/> Đã khóa</> : <><Unlock size={12}/> Đang mở</>}
          </div>
          
          {isTeacher && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleLock?.(exam); }}
              className={`p-2 rounded-xl transition-all ${exam.is_locked ? 'text-slate-400 hover:bg-slate-200' : 'text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600'}`}
              title={exam.is_locked ? "Nhấn để Mở khóa" : "Nhấn để Khóa"}
            >
              {exam.is_locked ? <Lock size={16} /> : <Unlock size={16} />}
            </button>
          )}
        </div>

        {/* Tiêu đề Đề thi */}
        <h3 className="font-bold text-slate-800 text-lg mb-4 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
          {exam.title || "Đề thi chưa có tên"}
        </h3>
        
        {/* Lưới thông số (Info Badges) */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 font-medium mt-auto mb-5">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-2 rounded-lg border border-slate-100">
            <FileText size={14} className="text-blue-500"/> 
            <span>{questionCount} câu</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-2 rounded-lg border border-slate-100">
            <Clock size={14} className="text-amber-500"/> 
            <span>{exam.time_limit || 45} phút</span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5 bg-slate-50 px-2.5 py-2 rounded-lg border border-slate-100">
            <Calendar size={14} className="text-emerald-500"/> 
            <span>Ngày tạo: {createdDate}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 pt-4 border-t border-slate-100 mt-auto">
          <button
            onClick={() => onView?.(exam)}
            disabled={exam.is_locked && !isTeacher}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
              ${exam.is_locked && !isTeacher 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 text-white hover:bg-gradient-to-r hover:from-indigo-600 hover:to-violet-600 shadow-md hover:shadow-indigo-200 hover:shadow-lg'}`}
          >
            <Play size={16} className={exam.is_locked && !isTeacher ? "" : "group-hover:scale-110 transition-transform"} /> 
            {isTeacher ? "Xem trước" : "Làm bài"}
          </button>

          {isTeacher && (
            <>
              <button
                onClick={() => onEdit?.(exam)}
                className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm hover:shadow"
                title="Chỉnh sửa chi tiết"
              >
                <Edit3 size={18} />
              </button>

              <button
                onClick={() => onDelete?.(exam.id)}
                className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all shadow-sm hover:shadow"
                title="Xóa vĩnh viễn"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default memo(ExamCard);
