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
  X
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import {
  loadDraft,
  saveDraft,
  clearDraft
} from "../services/supabaseExamService";

interface Props {
  onGenerate: (exam: Exam) => void;
}

const AiExamGenerator: React.FC<Props> = ({ onGenerate }) => {
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState<"10" | "11" | "12">("12");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* LOAD VĨNH VIỄN */
  useEffect(() => {
    const init = async () => {
      const draft = await loadDraft();
      if (draft) {
        setTopic(draft.topic || "");
        setGrade(draft.grade || "12");
        setFileName(draft.file_name || null);
      }
    };
    init();
  }, []);

  /* AUTO SAVE */
  useEffect(() => {
    saveDraft(topic, grade, fileName);
  }, [topic, grade, fileName]);

  /* CLEAR */
  const handleClear = async () => {
    setTopic("");
    setFileName(null);
    setError("");
    await clearDraft();
  };

  /* FILE PARSER */
  const extractText = async (file: File) => {
    if (file.size > 10_000_000) {
      throw new Error("File tối đa 10MB");
    }

    let text = "";

    if (file.type === "application/pdf") {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ");
      }
    }

    else if (file.type.includes("wordprocessingml")) {
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      text = result.value;
    }

    else {
      throw new Error("Chỉ hỗ trợ PDF hoặc DOCX");
    }

    return text;
  };

  /* UPLOAD FILE */
  const handleFileUpload = async (file: File) => {
    setFileName(file.name);
    setLoading(true);
    setError("");

    try {
      const text = await extractText(file);

      const ai = new GoogleGenAI({
        apiKey: process.env.API_KEY!,
      });

      const prompt = `
Trích xuất và chuẩn hóa đề thi từ nội dung sau.
Chỉ trả JSON đúng format Exam.

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
      setError("Không thể xử lý file PDF/DOCX.");
    } finally {
      setLoading(false);
    }
  };

  /* GENERATE */
  const handleGenerateFromTopic = async () => {
    if (!topic.trim()) {
      setError("Vui lòng nhập chủ đề");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.API_KEY!,
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

      onGenerate(parsed);

    } catch (err: any) {
      setError(err.message || "Không thể sinh đề");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-2xl p-6 shadow-xl space-y-4 relative">

      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <Loader2 className="animate-spin text-indigo-600" size={28} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-indigo-600" size={20} />
          <h3 className="font-bold">AI Exam Generator PRO</h3>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => saveDraft(topic, grade, fileName)}
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

      <div className="flex gap-2">
        <button
          onClick={handleGenerateFromTopic}
          disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 flex items-center justify-center gap-2"
        >
          <Wand2 size={18} />
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
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        />
      </div>

      {fileName && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <FileText size={14} />
          {fileName}
          <button onClick={() => setFileName(null)}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AiExamGenerator;
