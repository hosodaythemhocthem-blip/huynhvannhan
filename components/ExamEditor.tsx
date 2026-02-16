import React, { useState, useEffect, useCallback } from "react";
import {
  Trash2,
  ClipboardPaste,
  Save,
  Plus,
  Loader2,
  X,
} from "lucide-react";
import { supabase } from "../supabase";
import MathPreview from "./MathPreview";
import { useToast } from "./Toast";
import { motion, AnimatePresence } from "framer-motion";
import { Exam, Question, QuestionType } from "../types";

const MotionDiv = motion.div;

interface Props {
  exam: Exam;
  onSave?: (exam: Exam) => void;
  onCancel?: () => void;
}

const ExamEditor: React.FC<Props> = ({ exam, onSave, onCancel }) => {
  const { showToast } = useToast();
  const [data, setData] = useState<Exam>({
    ...exam,
    questions: exam.questions || [],
  });
  const [saving, setSaving] = useState(false);

  /* =========================================================
     AUTO SAVE (3 GIÂY)
  ========================================================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 3000);

    return () => clearTimeout(timer);
  }, [data]);

  const handleAutoSave = async () => {
    try {
      await supabase.from("exams").upsert({
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // silent auto save
    }
  };

  /* =========================================================
     UPDATE QUESTION
  ========================================================= */
  const updateQuestion = useCallback(
    (idx: number, updates: Partial<Question>) => {
      const newQs = [...data.questions];
      newQs[idx] = { ...newQs[idx], ...updates };

      setData({
        ...data,
        questions: newQs,
        updatedAt: new Date().toISOString(),
      });
    },
    [data]
  );

  /* =========================================================
     REMOVE QUESTION
  ========================================================= */
  const removeQuestion = (idx: number) => {
    const newQs = data.questions.filter((_, i) => i !== idx);
    setData({ ...data, questions: newQs });
    showToast("Đã xóa câu hỏi", "info");
  };

  /* =========================================================
     PASTE HANDLER
  ========================================================= */
  const handlePaste = async (idx: number, field: "content" | number) => {
    try {
      const text = await navigator.clipboard.readText();

      if (field === "content") {
        updateQuestion(idx, { content: text });
      } else {
        const newOpts = [...data.questions[idx].options];
        newOpts[field] = text;
        updateQuestion(idx, { options: newOpts });
      }

      showToast("Đã dán nội dung!", "success");
    } catch {
      showToast("Không thể truy cập Clipboard", "error");
    }
  };

  /* =========================================================
     SAVE BUTTON
  ========================================================= */
  const handleSaveToCloud = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("exams").upsert({
        ...data,
        updatedAt: new Date().toISOString(),
      });

      if (error) throw error;

      showToast("Đã lưu vĩnh viễn!", "success");
      onSave?.(data);
    } catch (err: any) {
      showToast(err.message || "Lỗi lưu dữ liệu", "error");
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     ADD QUESTION
  ========================================================= */
  const addQuestion = () => {
    const newQ: Question = {
      id: `q_${Date.now()}`,
      type: QuestionType.MCQ,
      content: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      points: 0.25,
    };

    setData({
      ...data,
      questions: [...data.questions, newQ],
    });
  };

  return (
    <div className="max-w-5xl mx-auto pb-40 px-4">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10 bg-white p-6 rounded-3xl shadow sticky top-4 z-50">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full">
            <X />
          </button>
          <h2 className="text-xl font-black">Biên tập đề thi</h2>
        </div>

        <button
          onClick={handleSaveToCloud}
          disabled={saving}
          className="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
        >
          {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
          LƯU VĨNH VIỄN
        </button>
      </div>

      {/* QUESTIONS */}
      <div className="space-y-8">
        <AnimatePresence>
          {data.questions.map((q, idx) => (
            <MotionDiv
              key={q.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white p-8 rounded-3xl shadow relative"
            >
              {/* DELETE */}
              <button
                onClick={() => removeQuestion(idx)}
                className="absolute top-4 right-4 p-2 bg-red-100 text-red-500 rounded-xl"
              >
                <Trash2 size={18} />
              </button>

              <div className="mb-6">
                <textarea
                  value={q.content}
                  onChange={(e) =>
                    updateQuestion(idx, { content: e.target.value })
                  }
                  placeholder="Nhập nội dung câu hỏi ($...$ hỗ trợ LaTeX)"
                  className="w-full p-4 bg-gray-50 rounded-xl font-semibold"
                />

                <button
                  onClick={() => handlePaste(idx, "content")}
                  className="mt-2 text-indigo-600 text-sm flex items-center gap-1"
                >
                  <ClipboardPaste size={14} />
                  Dán nội dung
                </button>

                <div className="mt-4 p-4 bg-indigo-50 rounded-xl">
                  <MathPreview content={q.content || ""} />
                </div>
              </div>

              {/* OPTIONS */}
              <div className="grid md:grid-cols-2 gap-4">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuestion(idx, { correctAnswer: oIdx })
                      }
                      className={`w-8 h-8 rounded-full text-sm font-bold ${
                        q.correctAnswer === oIdx
                          ? "bg-green-500 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}
                    </button>

                    <input
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...q.options];
                        newOpts[oIdx] = e.target.value;
                        updateQuestion(idx, { options: newOpts });
                      }}
                      className="flex-1 p-3 bg-gray-50 rounded-lg"
                    />

                    <button
                      onClick={() => handlePaste(idx, oIdx)}
                      className="text-indigo-600"
                    >
                      <ClipboardPaste size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </MotionDiv>
          ))}
        </AnimatePresence>

        <button
          onClick={addQuestion}
          className="w-full py-10 border-2 border-dashed rounded-3xl font-bold text-gray-500"
        >
          <Plus size={20} className="inline mr-2" />
          Thêm câu hỏi mới
        </button>
      </div>
    </div>
  );
};

export default ExamEditor;
