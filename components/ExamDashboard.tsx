import React from "react";
import { Plus, FileText } from "lucide-react";
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
  onAdd: (exam: Exam) => void;     // Nhận đề từ AI
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
      <div className="flex flex-wrap items-start gap-4">
        {/* Soạn đề thủ công */}
        <button
          onClick={onCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          <Plus size={20} />
          Soạn đề thủ công
        </button>

        {/* Import Word / PDF */}
        <ImportExamFromFile />

        {/* AI Generator */}
        <AiExamGenerator onGenerate={onAdd} />
      </div>

      {/* =========================
          EXAM LIST
      ========================= */}
      {!hasExams ? (
        /* EMPTY STATE */
        <div className="flex flex-col items-center justify-center text-slate-400 py-24 border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50/50">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
            <FileText size={40} className="text-slate-300" />
          </div>

          <p className="font-black text-lg text-slate-500">
            Chưa có đề thi nào
          </p>
          <p className="text-sm font-medium opacity-60 mt-1 text-center max-w-md">
            Hãy bắt đầu bằng cách soạn đề thủ công, import từ file Word/PDF
            hoặc để AI hỗ trợ biên soạn.
          </p>
        </div>
      ) : (
        /* GRID */
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
      )}
    </div>
  );
};

export default ExamDashboard;
