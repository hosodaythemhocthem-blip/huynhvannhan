
import React from 'react';
import { Trash2, Calendar, Key, Eye, UserPlus, Lock, Unlock, Users } from 'lucide-react';
import { Exam } from '../types';
import MathPreview from './MathPreview';

interface ExamCardProps {
  exam: Exam;
  onEdit: (id: string) => void;
  onView: (exam: Exam) => void;
  onDelete: (id: string) => void;
  onToggleLock: (id: string) => void;
  onAssign: (exam: Exam) => void;
}

const ExamCard: React.FC<ExamCardProps> = ({ exam, onEdit, onView, onDelete, onToggleLock, onAssign }) => {
  const assignedCount = exam.assignedClassIds?.length || 0;

  return (
    <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-8 flex flex-col gap-6 hover:shadow-xl transition-all group">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1.5 flex-1 pr-4">
          <h3 className="text-2xl font-black text-slate-800 leading-tight">
            <MathPreview math={exam.title} />
          </h3>
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
            <Calendar size={14} />
            {exam.createdAt}
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleLock(exam.id); }}
          className={`w-12 h-12 rounded-[18px] flex items-center justify-center transition-all ${exam.isLocked ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-slate-800 border border-slate-100'}`}
        >
          {exam.isLocked ? <Lock size={20} /> : <Lock size={20} className="fill-current" />}
        </button>
      </div>

      {/* Info Boxes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50/50 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-50">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Câu hỏi</span>
          <span className="text-xl font-black text-slate-700">{exam.questionCount}</span>
        </div>
        <div className="bg-slate-50/50 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-50">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời gian</span>
          <span className="text-xl font-black text-slate-700">{exam.duration || 15}p</span>
        </div>
      </div>

      {/* Assigned Info */}
      <div className="flex items-center justify-between px-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Giao cho:</span>
          <span className={`text-[11px] font-black uppercase tracking-widest ${assignedCount > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
            {assignedCount === 0 ? 'CHƯA GIAO' : assignedCount === 1 ? '1 LỚP HỌC' : `${assignedCount} LỚP HỌC`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
           <Key size={12} className="rotate-45" />
           <span className="text-[10px] font-black uppercase tracking-widest">{exam.id}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <button 
          onClick={() => onEdit(exam.id)}
          className="py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black hover:bg-slate-50 transition-all text-[11px] uppercase tracking-widest"
        >
          Sửa đề
        </button>
        <button 
          onClick={() => onAssign(exam)}
          className={`py-4 border rounded-2xl font-black transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 ${assignedCount > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-blue-50 hover:text-blue-600'}`}
        >
          <UserPlus size={16} /> Giao bài
        </button>
        <button 
          onClick={() => onView(exam)}
          className="col-span-1 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all text-[11px] uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
        >
          <Eye size={18} /> Xem thử
        </button>
        <button 
          onClick={() => onDelete(exam.id)}
          className="col-span-1 py-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-100 flex items-center justify-center gap-2"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default ExamCard;
