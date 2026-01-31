import React from "react";
import { Plus, FileText, LayoutGrid } from "lucide-react";
import { Exam } from "../types";
import ExamCard from "./ExamCard";
import ImportExamFromFile from "./ImportExamFromFile";
import AiExamGenerator from "./AiExamGenerator";

/* =========================
   PROPS
========================= */
interface Props {
  exams: Exam[];
  onCreate: () => void;
  onAdd: (exam: Exam) => void; // Nhận đề từ AI hoặc File
  onEdit: (exam: Exam) => void;
  onDelete: (id: string) => void;
  onView?: (exam: Exam) => void;
}

/* =========================
   COMPONENT
========================= */
const ExamDashboard: React.FC<Props> = ({
  exams,
  onCreate,
  onAdd,
  onEdit,
  onDelete,
  onView,
}) => {
  const hasExams = exams.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* =========================
          ACTION BAR
      ========================= */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          {/* Tạo đề thủ công */}
          <button
            onClick={onCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            <Plus size={20} />
            Soạn đề thủ công
          </button>

          {/* Import Word / PDF */}
          <ImportExamFromFile />
        </div>

        {/* AI Generator */}
        <div className="w-full md:w-auto">
          <AiExamGenerator onGenerate={onAdd} />
        </div>
      </div>

      {/* =========================
          EXAM LIST
      ========================= */}
      {!hasExams ? (
        /* EMPTY STATE */
        <div className="flex flex-col items-center justify-center text-slate-400 py-24 border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50/50 hover:bg-slate-50 transition-colors">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 border border-slate-100">
            <FileText size={40} className="text-slate-300" />
          </div>

          <h3 className="font-black text-xl text-slate-600 mb-2">
            Chưa có đề thi nào
          </h3>
          <p className="text-sm font-medium opacity-60 max-w-md text-center">
            Hệ thống chưa ghi nhận đề thi nào. Hãy bắt đầu bằng cách tạo thủ công,
            tải file lên hoặc dùng{" "}
            <span className="text-indigo-500 font-bold">AI Genius</span> để biên soạn.
          </p>
        </div>
      ) : (
        /* LIST */
        <div>
          <div className="flex items-center gap-2 mb-4 text-slate-400 font-bold text-xs uppercase tracking-widest">
            <LayoutGrid size={14} />
            Danh sách đề thi ({exams.length})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onView={onView}
                onEdit={() => onEdit(exam)}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamDashboard;
