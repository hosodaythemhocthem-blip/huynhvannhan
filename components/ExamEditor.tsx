import React, { useState, useEffect } from "react";
import { Exam, Question } from "../types";
import MathPreview from "./MathPreview";
import ImportExamFromFile from "./ImportExamFromFile";
import { examService } from "../services/exam.service";

interface Props {
  exam?: Exam;
  teacherId: string;
}

const ExamEditor: React.FC<Props> = ({ exam, teacherId }) => {
  const [title, setTitle] = useState(exam?.title || "");
  const [duration, setDuration] = useState(exam?.duration || 45);
  const [questions, setQuestions] = useState<Question[]>(
    exam?.questions || []
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      handleSave();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [title, duration, questions]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        content: "",
        points: 1,
      },
    ]);
  };

  const updateQuestion = (id: string, content: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, content } : q
      )
    );
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleImport = (text: string) => {
    const parsed = text.split(/\n+/).map((line, index) => ({
      id: crypto.randomUUID(),
      content: line,
      points: 1,
    }));

    setQuestions(parsed);
  };

  const handleSave = async () => {
    await examService.saveExam({
      id: exam?.id || crypto.randomUUID(),
      title,
      duration,
      teacher_id: teacherId,
      questions,
    });
  };

  return (
    <div className="space-y-6">
      <ImportExamFromFile onImport={handleImport} />

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tiêu đề đề thi"
        className="border p-2 w-full rounded"
      />

      <input
        type="number"
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
        className="border p-2 w-32 rounded"
      />

      {questions.map((q, index) => (
        <div key={q.id} className="border p-4 rounded bg-gray-50">
          <textarea
            value={q.content}
            onChange={(e) => updateQuestion(q.id, e.target.value)}
            className="w-full border p-2 rounded"
          />

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => deleteQuestion(q.id)}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              🗑 Xóa
            </button>

            <button
              onClick={() => navigator.clipboard.writeText(q.content)}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              📋 Ctrl+V
            </button>
          </div>

          <div className="mt-3">
            <MathPreview content={q.content} />
          </div>
        </div>
      ))}

      <button
        onClick={addQuestion}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        + Thêm câu hỏi
      </button>
    </div>
  );
};

export default ExamEditor;
