import React, { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Save, Undo2 } from "lucide-react";
import { Exam, Question } from "../types";
import { examService } from "../services/exam.service";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

interface Props {
  exam: Exam;
}

const ExamEditor: React.FC<Props> = ({ exam }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [history, setHistory] = useState<Question[][]>([]);
  const [saving, setSaving] = useState(false);

  /* =========================
     LOAD QUESTIONS
  ========================= */
  useEffect(() => {
    const load = async () => {
      const data = await examService.getQuestions(exam.id);
      setQuestions(data);
    };
    load();
  }, [exam.id]);

  /* =========================
     AUTO SAVE
  ========================= */
  const saveAll = async () => {
    setSaving(true);
    for (const q of questions) {
      if (!q.id) {
        await examService.addQuestion({
          exam_id: exam.id,
          content: q.content,
          type: "multiple",
        });
      }
    }
    setSaving(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      saveAll();
    }, 1500);

    return () => clearTimeout(timer);
  }, [questions]);

  /* =========================
     ADD QUESTION
  ========================= */
  const addQuestion = () => {
    setHistory((prev) => [...prev, questions]);
    setQuestions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        exam_id: exam.id,
        content: "",
        type: "multiple",
        created_at: new Date().toISOString(),
      },
    ]);
  };

  /* =========================
     DELETE QUESTION
  ========================= */
  const deleteQuestion = async (id: string) => {
    if (!window.confirm("Xóa câu hỏi này?")) return;

    setHistory((prev) => [...prev, questions]);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    await examService.deleteQuestion(id);
  };

  /* =========================
     UPDATE CONTENT
  ========================= */
  const updateContent = (id: string, value: string) => {
    setHistory((prev) => [...prev, questions]);
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, content: value } : q))
    );
  };

  /* =========================
     UNDO
  ========================= */
  const undo = () => {
    if (history.length === 0) return;
    const prevState = history[history.length - 1];
    setQuestions(prevState);
    setHistory((prev) => prev.slice(0, -1));
  };

  /* =========================
     PASTE HANDLER
  ========================= */
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>, id: string) => {
      const html = e.clipboardData.getData("text/html");
      if (html) {
        e.preventDefault();
        updateContent(id, html);
      }
    },
    []
  );

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-700">
          Chỉnh sửa: {exam.title}
        </h2>

        <div className="flex items-center gap-3">
          <button
            onClick={undo}
            className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Undo2 size={18} />
            Undo
          </button>

          <button
            onClick={saveAll}
            className="bg-green-600 text-white px-5 py-2 rounded-xl flex items-center gap-2 shadow"
          >
            <Save size={18} />
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>

      {/* QUESTION LIST */}
      <div className="space-y-6">
        {questions.map((q, index) => (
          <div
            key={q.id}
            className="bg-white p-6 rounded-2xl shadow border border-slate-200"
          >
            <div className="flex justify-between mb-3">
              <span className="font-bold text-slate-600">
                Câu {index + 1}
              </span>

              <button
                onClick={() => deleteQuestion(q.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <textarea
              value={q.content}
              onChange={(e) => updateContent(q.id, e.target.value)}
              onPaste={(e) => handlePaste(e, q.id)}
              placeholder="Nhập nội dung câu hỏi (hỗ trợ LaTeX: \\frac{a}{b})"
              className="w-full min-h-[120px] p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-400 outline-none"
            />

            {/* MATH PREVIEW */}
            <div className="mt-4 bg-slate-50 p-4 rounded-xl">
              <BlockMath math={q.content} />
            </div>
          </div>
        ))}
      </div>

      {/* ADD BUTTON */}
      <button
        onClick={addQuestion}
        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition"
      >
        <Plus size={20} />
        Thêm câu hỏi
      </button>
    </div>
  );
};

export default ExamEditor;
