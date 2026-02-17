import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  Trash2,
  ClipboardPaste,
  Save,
  Plus,
  Loader2,
  X,
  Type,
  Sigma,
} from "lucide-react";
import MathPreview from "./MathPreview";
import { useToast } from "./Toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Exam,
  Question,
  QuestionType,
} from "../types";
import { ExamService } from "../services/exam.service";

/* ======================================================
   COMPONENT
====================================================== */

interface Props {
  exam: Exam;
  onSave?: (exam: Exam) => void;
  onCancel?: () => void;
}

const ExamEditor: React.FC<Props> = ({
  exam,
  onSave,
  onCancel,
}) => {
  const { showToast } = useToast();

  const [data, setData] = useState<Exam>({
    ...exam,
    questions: exam.questions ?? [],
  });

  const [saving, setSaving] =
    useState(false);

  const autosaveRef =
    useRef<NodeJS.Timeout | null>(null);

  /* ======================================================
     SMART AUTOSAVE (DEBOUNCE 3s)
  ====================================================== */
  useEffect(() => {
    if (autosaveRef.current) {
      clearTimeout(autosaveRef.current);
    }

    autosaveRef.current = setTimeout(() => {
      ExamService.saveExam(data);
    }, 3000);

    return () => {
      if (autosaveRef.current)
        clearTimeout(autosaveRef.current);
    };
  }, [data]);

  /* ======================================================
     UPDATE QUESTION SAFE
  ====================================================== */
  const updateQuestion = useCallback(
    (
      idx: number,
      updates: Partial<Question>
    ) => {
      setData((prev) => {
        const updated = [...prev.questions];

        const newVersion =
          (updated[idx].version ?? 1) + 1;

        updated[idx] = {
          ...updated[idx],
          ...updates,
          updatedAt:
            new Date().toISOString(),
          version: newVersion,
        };

        return {
          ...prev,
          questions: updated.map(
            (q, i) => ({
              ...q,
              order: i,
            })
          ),
        };
      });
    },
    []
  );

  /* ======================================================
     REMOVE QUESTION
  ====================================================== */
  const removeQuestion =
    async (idx: number) => {
      if (
        !window.confirm(
          "Xóa vĩnh viễn câu hỏi này?"
        )
      )
        return;

      const newQuestions =
        data.questions
          .filter((_, i) => i !== idx)
          .map((q, i) => ({
            ...q,
            order: i,
          }));

      const updatedExam = {
        ...data,
        questions: newQuestions,
      };

      setData(updatedExam);

      await ExamService.saveExam(
        updatedExam
      );

      showToast(
        "Đã xóa và đồng bộ!",
        "info"
      );
    };

  /* ======================================================
     PASTE HANDLER
  ====================================================== */
  const handlePaste =
    async (
      idx: number,
      field: "content" | number
    ) => {
      try {
        const text =
          await navigator.clipboard.readText();

        if (!text) return;

        if (field === "content") {
          updateQuestion(idx, {
            content: text,
          });
        } else {
          const question =
            data.questions[idx];

          if (
            question.type !==
            QuestionType.MCQ
          )
            return;

          const options = [
            ...question.options,
          ];

          options[field] =
            text.replace(
              /^[A-D][.:]\s*/,
              ""
            );

          updateQuestion(idx, {
            options,
          });
        }

        showToast(
          "Đã dán thành công",
          "success"
        );
      } catch {
        showToast(
          "Không truy cập được Clipboard",
          "error"
        );
      }
    };

  /* ======================================================
     ADD QUESTION
  ====================================================== */
  const addQuestion = () => {
    const newQ: Question = {
      id: `q_${crypto.randomUUID()}`,
      type: QuestionType.MCQ,
      content: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      points: 1,
      order: data.questions.length,
      isDeleted: false,
      version: 1,
      createdAt:
        new Date().toISOString(),
      updatedAt:
        new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        newQ,
      ],
    }));
  };

  /* ======================================================
     SAVE BUTTON
  ====================================================== */
  const handleSaveToCloud =
    async () => {
      setSaving(true);

      const result =
        await ExamService.saveExam(
          data
        );

      if (result) {
        showToast(
          "Đã lưu vĩnh viễn!",
          "success"
        );
        onSave?.(result);
      } else {
        showToast(
          "Lỗi lưu dữ liệu",
          "error"
        );
      }

      setSaving(false);
    };

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <div className="max-w-5xl mx-auto pb-40 px-4 font-sans text-slate-900">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10 bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-lg sticky top-4 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-full"
          >
            <X size={22} />
          </button>

          <div>
            <h2 className="text-xl font-extrabold text-indigo-600">
              {data.title}
            </h2>
            <p className="text-xs text-slate-500">
              {data.questions.length} câu hỏi
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveToCloud}
          disabled={saving}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          LƯU
        </button>
      </div>

      {/* QUESTIONS */}
      <div className="space-y-10">
        <AnimatePresence>
          {data.questions.map(
            (q, idx) => (
              <motion.div
                key={q.id}
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                }}
                className="bg-white p-8 rounded-3xl shadow border"
              >
                {/* INDEX */}
                <div className="flex justify-between mb-4">
                  <div className="font-bold text-indigo-600">
                    Câu {idx + 1}
                  </div>

                  <button
                    onClick={() =>
                      removeQuestion(idx)
                    }
                    className="text-red-500 hover:scale-110 transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* CONTENT */}
                <textarea
                  value={q.content}
                  onChange={(e) =>
                    updateQuestion(idx, {
                      content:
                        e.target.value,
                    })
                  }
                  placeholder="Nhập câu hỏi..."
                  className="w-full p-4 bg-slate-50 rounded-xl min-h-[120px]"
                />

                <button
                  onClick={() =>
                    handlePaste(
                      idx,
                      "content"
                    )
                  }
                  className="mt-2 text-indigo-600 text-sm flex items-center gap-1"
                >
                  <ClipboardPaste size={14} />
                  Dán nhanh
                </button>

                {/* MATH PREVIEW */}
                {q.content && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                    <MathPreview
                      content={q.content}
                    />
                  </div>
                )}

                {/* MCQ OPTIONS */}
                {q.type ===
                  QuestionType.MCQ &&
                  "options" in q && (
                    <div className="grid md:grid-cols-2 gap-4 mt-6">
                      {q.options.map(
                        (opt, oIdx) => (
                          <input
                            key={oIdx}
                            value={opt}
                            onChange={(e) => {
                              const newOpts =
                                [
                                  ...q.options,
                                ];
                              newOpts[
                                oIdx
                              ] =
                                e.target
                                  .value;
                              updateQuestion(
                                idx,
                                {
                                  options:
                                    newOpts,
                                }
                              );
                            }}
                            className="p-3 bg-slate-50 rounded-lg"
                          />
                        )
                      )}
                    </div>
                  )}
              </motion.div>
            )
          )}
        </AnimatePresence>

        {/* ADD */}
        <button
          onClick={addQuestion}
          className="w-full py-10 border-dashed border-4 border-slate-200 rounded-3xl text-slate-400 hover:border-indigo-400 hover:text-indigo-500"
        >
          <Plus size={28} />
          <div>Thêm câu hỏi</div>
        </button>
      </div>
    </div>
  );
};

export default ExamEditor;
