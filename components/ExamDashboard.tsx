import React, { useMemo, useState } from "react";
import { Plus, FileText, Sparkles, Search } from "lucide-react";
import { Exam } from "../types";
import ExamCard from "./ExamCard";
import ImportExamFromFile from "./ImportExamFromFile";
import AiExamGenerator from "./AiExamGenerator";

interface Props {
  exams: Exam[];
  onCreate: () => void;
  onAdd: (exam: Exam) => void;
  onEdit: (exam: Exam) => void;
  onDelete: (id: string) => void;
  onView?: (exam: Exam) => void;
}

const ExamDashboard: React.FC<Props> = ({
  exams,
  onCreate,
  onAdd,
  onEdit,
  onDelete,
  onView,
}) => {
  const [search, setSearch] = useState("");
  const [loading] = useState(false);

  const filteredExams = useMemo(() => {
    if (!search.trim()) return exams;
    return exams.filter((exam) =>
      exam.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [exams, search]);

  const hasExams = filteredExams?.length > 0;

  const handleDelete = (id: string) => {
    const confirmDelete = window.confirm(
      "Bạn có chắc muốn xoá đề thi này? Hành động không thể hoàn tác."
    );
    if (confirmDelete) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* ACTION BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-md border border-slate-200">
        
        <button
          onClick={onCreate}
          className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg transition-all duration-200 active:scale-95"
        >
          <Plus size={20} className="group-hover:rotate-90 transition" />
          Soạn đề thủ công
        </button>

        <ImportExamFromFile />

        <AiExamGenerator onGenerate={onAdd} />

        <div className="flex items-center gap-2 ml-auto bg-slate-100 px-4 py-2 rounded-xl w-full lg:w-72">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm đề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>
      </div>

      {/* SUMMARY */}
      <div className="text-sm text-slate-500">
        Tổng số đề:{" "}
        <span className="font-semibold text-slate-700">
          {filteredExams.length}
        </span>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-48 bg-slate-100 animate-pulse rounded-3xl"
            />
          ))}
        </div>
      ) : !hasExams ? (
        <div className="flex flex-col items-center justify-center text-slate-400 py-28 border-2 border-dashed border-slate-200 rounded-[40px] bg-gradient-to-br from-slate-50 to-white transition-all">
          
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md mb-6">
            <FileText size={48} className="text-slate-300" />
          </div>

          <p className="font-extrabold text-xl text-slate-600">
            Chưa có đề thi nào
          </p>

          <p className="text-sm opacity-60 mt-2 text-center max-w-md leading-relaxed">
            Bắt đầu bằng cách soạn đề thủ công, import Word/PDF
            hoặc để AI hỗ trợ tạo đề chỉ trong vài giây.
          </p>

          <button
            onClick={onCreate}
            className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition shadow-md"
          >
            <Sparkles size={18} />
            Tạo đề ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredExams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onView={onView}
              onEdit={() => onEdit(exam)}
              onDelete={() => handleDelete(exam.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamDashboard;
