import React from "react";
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
  MoreVertical 
} from "lucide-react";
import { Exam } from "../types";

interface ExamCardProps {
  exam: Exam;
  onView?: (exam: Exam) => void;       // Xem chi tiết / Làm thử
  onEdit?: (exam: Exam) => void;       // Sửa đề
  onDelete?: (id: string) => void;     // Xóa đề
  onToggleLock?: (exam: Exam) => void; // Khóa/Mở khóa
  onAssign?: (exam: Exam) => void;     // Giao bài cho lớp
}

const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  onView,
  onEdit,
  onDelete,
  onToggleLock,
  onAssign,
}) => {
  // Format ngày tạo
  const formattedDate = exam.createdAt 
    ? new Date(exam.createdAt).toLocaleDateString('vi-VN') 
    : 'N/A';

  return (
    <div className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 relative flex flex-col justify-between h-full">
      
      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
              exam.isLocked 
                ? 'bg-red-50 text-red-600 border-red-100' 
                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
              {exam.isLocked ? 'Đã khóa' : 'Đang mở'}
            </span>
            {exam.subject && (
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {exam.subject}
              </span>
            )}
          </div>
          <h3 
            className="font-bold text-lg text-slate-800 line-clamp-2 cursor-pointer hover:text-indigo-600 transition-colors"
            onClick={() => onView?.(exam)}
            title={exam.title}
          >
            {exam.title}
          </h3>
        </div>
        
        {/* Context Menu Trigger (Visual only for now, actions are below) */}
        <button className="text-slate-300 hover:text-slate-600 transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>

      {/* INFO METRICS */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs font-medium text-slate-500 mb-6">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-indigo-400" />
          <span>{exam.duration} phút</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-indigo-400" />
          <span>{exam.questionCount} câu hỏi</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-indigo-400" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={14} className="text-indigo-400" />
          <span>{exam.assignedClassIds?.length || 0} lớp</span>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100">
        {/* Primary Action */}
        <button
          onClick={() => onView?.(exam)}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-2 rounded-xl text-xs font-bold transition-colors"
        >
          <Play size={14} fill="currentColor" />
          Xem đề
        </button>

        {/* Secondary Actions */}
        <div className="flex gap-1">
          <button
            onClick={() => onAssign?.(exam)}
            title="Giao bài"
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
          >
            <Users size={16} />
          </button>

          <button
            onClick={() => onEdit?.(exam)}
            title="Chỉnh sửa"
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          >
            <Edit3 size={16} />
          </button>

          <button
            onClick={() => onToggleLock?.(exam)}
            title={exam.isLocked ? "Mở khóa" : "Khóa đề"}
            className={`p-2 rounded-lg transition-all ${
              exam.isLocked 
                ? 'text-red-400 hover:text-red-600 hover:bg-red-50' 
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            {exam.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
          </button>

          <button
            onClick={() => onDelete?.(exam.id)}
            title="Xóa đề"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamCard;
