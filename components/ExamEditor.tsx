import React, { useState, useEffect, useCallback } from "react";
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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (exam?.raw_content) {
      const parsed: Question[] = exam.raw_content
        .split(/\n+/)
        .filter(Boolean)
        .map((line, index) => ({
          id: crypto.randomUUID(),
          exam_id: exam.id,
          content: line,
          type: "essay",
          points: 1,
          order: index + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

      setQuestions(parsed);
    }
  }, [exam]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        exam_id: exam?.id || "",
        content: "",
        type: "essay",
        points: 1,
        order: prev.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  };

  const updateQuestion = (id: string, content: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, content, updated_at: new Date().toISOString() }
          : q
      )
    );
  };

  const deleteQuestion = (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa câu hỏi này?")) return;
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleImport = (text: string) => {
    const parsed: Question[] = text
      .split(/\n+/)
      .filter(Boolean)
      .map((line, index) => ({
        id: crypto.randomUUID(),
        exam_id: exam?.id || "",
        content: line,
        type: "essay",
        points: 1,
        order: index + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

    setQuestions(parsed);
  };

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);

      await examService.saveExam({
        id: exam?.id || crypto.randomUUID(),
        title,
        teacher_id: teacherId,
        description: null,
        is_locked: false,
        is_archived: false,
        file_url: null,
        raw_content: questions.map((q) => q.content).join("\n"),
        total_points: questions.reduce((sum, q) => sum + q.points, 0),
        version: 1,
      });

      alert("Đã lưu thành công!");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi lưu.");
    } finally {
      setSaving(false);
    }
  }, [title, questions, teacherId, exam]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (title || questions.length > 0) {
        handleSave();
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [title, questions, handleSave]);

  return (
    <div className="space-y-6">
      <ImportExamFromFile onImport={handleImport} />

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tiêu đề đề thi"
        className="border p-3 w-full rounded-lg"
      />

      {questions.map((q) => (
        <div key={q.id} className="border p-4 rounded-xl bg-gray-50 space-y-3">
          <textarea
            value={q.content}
            onChange={(e) => updateQuestion(q.id, e.target.value)}
            className="w-full border p-3 rounded"
            rows={3}
          />

          <div className="flex gap-3">
            <button
              onClick={() => deleteQuestion(q.id)}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              ❌ Xóa
            </button>

            <button
              onClick={() => navigator.clipboard.writeText(q.content)}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              📋 Copy
            </button>
          </div>

          <MathPreview content={q.content} />
        </div>
      ))}

      <button
        onClick={addQuestion}
        className="bg-green-600 text-white px-4 py-2 rounded-lg"
      >
        + Thêm câu hỏi
      </button>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
      >
        {saving ? "Đang lưu..." : "💾 Lưu đề"}
      </button>
    </div>
  );
};

export default ExamEditor;
