import React, { useState, useEffect, useRef } from "react";
import { Exam, Question, QuestionType } from "../types";
import { GoogleGenAI } from "@google/genai";
import {
  Upload,
  Sparkles,
  Loader2,
  Wand2,
  AlertCircle,
  Trash2,
  Save,
  FileText,
} from "lucide-react";

interface Props {
  onGenerate: (exam: Exam) => void;
}

const STORAGE_KEY = "ai_exam_draft";

const AiExamGenerator: React.FC<Props> = ({ onGenerate }) => {
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState<"10" | "11" | "12">("12");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ===============================
     LOAD DRAFT VĨNH VIỄN
  =============================== */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setTopic(parsed.topic || "");
      setGrade(parsed.grade || "12");
      setFileName(parsed.fileName || null);
    }
  }, []);

  /* ===============================
     LƯU VĨNH VIỄN
  =============================== */
  const handleSave = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ topic, grade, fileName })
    );
  };

  /* ===============================
     XÓA TOÀN BỘ
  =============================== */
  const handleClear = () => {
    setTopic("");
    setFileName(null);
    setError("");
    localStorage.removeItem(STORAGE_KEY);
  };

  /* ===============================
     UPLOAD FILE WORD / PDF
  =============================== */
  const handleFileUpload = async (file: File) => {
    setFileName(file.name);
    setLoading(true);
    setError("");

    try {
      const text = await file.text();

      const ai = new GoogleGenAI({
        apiKey: process.env.API_KEY,
      });

      const prompt = `
Trích xuất và chuẩn hóa đề thi từ nội dung sau.
Chỉ trả về JSON đúng format Exam.

${text}
`;

      const res = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" },
      });

      const clean = (res.text || "")
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const parsed: Exam = JSON.parse(clean);

      onGenerate(parsed);
    } catch (err: any) {
      console.error(err);
      setError("Không thể xử lý file. Kiểm tra định dạng PDF/DOCX.");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     SINH ĐỀ TỪ CHỦ ĐỀ
  =============================== */
  const handleGenerateFromTopic = async () => {
    if (!topic.trim()) {
      setError("Vui lòng nhập chủ đề Toán");
      return;
    }

    if (!process.env.API_KEY) {
      setError("Thiếu API_KEY cho Gemini");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.API_KEY,
      });

      const prompt = `
Bạn là giáo viên Toán THPT Việt Nam.
Soạn đề lớp ${grade} chủ đề "${topic}".
Chỉ trả JSON chuẩn Exam.
`;

      const res = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" },
      });

      const clean = (res.text || "")
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const parsed: Exam = JSON.parse(clean);

      const validTypes: QuestionType[] = [
        "multiple_choice",
        "true_false",
        "short_answer",
      ];

      const questions: Question[] = (parsed.questions || []).filter(
        (q: Question) => validTypes.includes(q.type)
      );

      if (!questions.length) {
        throw new Error("AI không sinh được câu hợp lệ");
      }

      onGenerate({
        title: parsed.title || "Đề thi AI",
        questions,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể sinh đề");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     UI
  =============================== */
  return (
    <div className="bg-white border rounded-2xl p-6 shadow-lg space-y-4 transition-all">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-indigo-600" size={20} />
          <h3 className="font-bold">AI Exam Generator PRO</h3>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="p-2 rounded-lg bg-green-100 hover:bg-green-200"
          >
            <Save size={16} />
          </button>

          <button
            onClick={handleClear}
            className="p-2 rounded-lg bg-red-100 hover:bg-red-200"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* INPUT */}
      <div className="flex gap-2">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="VD: Hàm số, tích phân..."
          className="flex-1 border rounded-xl px-4 py-2 text-sm"
        />
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value as any)}
          className="border rounded-xl px-3 text-sm"
        >
          <option value="10">Lớp 10</option>
          <option value="11">Lớp 11</option>
          <option value="12">Lớp 12</option>
        </select>
      </div>

      {/* BUTTONS */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerateFromTopic}
          disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
          Sinh từ chủ đề
        </button>

        <button
          onClick={() => fileRef.current?.click()}
          className="bg-slate-200 hover:bg-slate-300 rounded-xl px-4 flex items-center gap-2"
        >
          <Upload size={16} />
          Upload
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx"
          hidden
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />
      </div>

      {fileName && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <FileText size={14} />
          {fileName}
        </div>
      )}
    </div>
  );
};

export default AiExamGenerator;
