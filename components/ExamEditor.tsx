import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { Save, PlusCircle, Trash2 } from "lucide-react";
import { Exam, Question } from "../types";

interface Props {
  exam?: Exam;
  onSave: (exam: Exam) => void;
  onCancel: () => void;
}

const createEmptyQuestion = (): Question => ({
  id: crypto.randomUUID(),
  content: "",
  type: "text",
  points: 1,
});

const ExamEditor: React.FC<Props> = ({
  exam,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState(exam?.title || "");
  const [description, setDescription] = useState(
    exam?.description || ""
  );
  const [questions, setQuestions] = useState<Question[]>(
    exam?.questions || [createEmptyQuestion()]
  );
  const [isSaving, setIsSaving] = useState(false);

  // ✅ FIX: Không dùng NodeJS.Timeout
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // =============================
  // AUTOSAVE (client only)
  // =============================
  const triggerAutosave = useCallback(() => {
    if (autosaveRef.current) {
      clearTimeout(autosaveRef.current);
    }

    autosaveRef.current = setTimeout(() => {
      handleSave();
    }, 1500);
  }, [title, description, questions]);

  useEffect(() => {
    triggerAutosave();
    return () => {
      if (autosaveRef.current) {
        clearTimeout(autosaveRef.current);
      }
    };
  }, [title, description, questions, triggerAutosave]);

  // =============================
  // SAVE
  // =============================
  const handleSave = () => {
    if (!title.trim()) return;

    setIsSaving(true);

    const updatedExam: Exam = {
      id: exam?.id || crypto.randomUUID(),
      title,
      description,
      questions,
      createdAt: exam?.createdAt || new Date().toISOString(),
    };

    onSave(updatedExam);
    setIsSaving(false);
  };

  // =============================
  // QUESTION HANDLERS
  // =============================
  const updateQuestion = (id: string, value: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, content: value } : q
      )
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) =>
      prev.length > 1 ? prev.filter((q) => q.id !== id) : prev
    );
  };

  // =============================
  // UI
  // =============================
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {exam ? "Chỉnh sửa đề" : "Tạo đề mới"}
        </h2>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border"
          >
            Hủy
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl"
          >
            <Save size={18} />
            {isSaving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>

      {/* TITLE */}
      <div className="space-y-2">
        <label className="font-medium">Tiêu đề</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border rounded-xl"
          placeholder="Nhập tiêu đề đề thi..."
        />
      </div>

      {/* DESCRIPTION */}
      <div className="space-y-2">
        <label className="font-medium">Mô tả</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 border rounded-xl"
          placeholder="Mô tả đề thi..."
        />
      </div>

      {/* QUESTIONS */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Câu hỏi</h3>

          <button
            onClick={addQuestion}
            className="flex items-center gap-2 text-indigo-600"
          >
            <PlusCircle size={18} />
            Thêm câu hỏi
          </button>
        </div>

        {questions.map((q, index) => (
          <div
            key={q.id}
            className="p-4 border rounded-2xl bg-slate-50 space-y-3"
          >
            <div className="flex justify-between">
              <span className="font-medium">
                Câu {index + 1}
              </span>

              <button
                onClick={() => deleteQuestion(q.id)}
                className="text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <textarea
              value={q.content}
              onChange={(e) =>
                updateQuestion(q.id, e.target.value)
              }
              className="w-full p-3 border rounded-xl"
              placeholder="Nhập nội dung câu hỏi..."
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamEditor;
