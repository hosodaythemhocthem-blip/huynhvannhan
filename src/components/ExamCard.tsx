import React from "react";

export interface Exam {
  id: string;
  title: string;
  subject?: string;
  questionCount: number;
}

interface ExamCardProps {
  exam: Exam;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="border rounded-xl p-4 shadow hover:shadow-md transition bg-white">
      <h3 className="font-bold text-lg mb-1">{exam.title}</h3>

      {exam.subject && (
        <p className="text-sm text-gray-500">
          Môn: {exam.subject}
        </p>
      )}

      <p className="text-sm mt-2">
        Số câu hỏi: <b>{exam.questionCount}</b>
      </p>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onEdit?.(exam.id)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
        >
          Sửa
        </button>

        <button
          onClick={() => onDelete?.(exam.id)}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm"
        >
          Xóa
        </button>
      </div>
    </div>
  );
};

export default ExamCard;
