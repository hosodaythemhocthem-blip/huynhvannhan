import { Plus, Upload, Sparkles, FileText } from 'lucide-react';
import { Exam } from '../types';
import ExamCard from './ExamCard';
import ImportExamFromFile from './ImportExamFromFile';
import AiExamGenerator from './AiExamGenerator';

interface Props {
  exams: Exam[];
  onCreate: () => void;
  onEdit: (exam: Exam) => void;
  onDelete: (id: string) => void;
  onView: (exam: Exam) => void;
}

export default function ExamDashboard({
  exams,
  onCreate,
  onEdit,
  onDelete,
  onView
}: Props) {
  return (
    <div className="space-y-6">
      {/* ACTION BAR */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onCreate}
          className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow"
        >
          <Plus size={18} /> Soạn đề
        </button>

        <ImportExamFromFile />

        <AiExamGenerator />
      </div>

      {/* LIST */}
      {exams.length === 0 ? (
        <div className="text-center text-slate-400 py-20">
          <FileText size={40} className="mx-auto mb-4" />
          Chưa có đề thi nào
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map(exam => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onEdit={() => onEdit(exam)}
              onDelete={onDelete}
              onView={onView}
              onToggleLock={() => {}}
              onAssign={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}
