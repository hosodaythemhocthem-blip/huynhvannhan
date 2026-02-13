// components/AiExamGenerator.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Exam } from "../types";
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
  X,
  ClipboardPaste
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import MathPreview from "./MathPreview";
import {
  loadDraft,
  saveDraft,
  clearDraft,
  saveGeneratedExam
} from "../services/supabaseExamService";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Props {
  onGenerate: (exam: Exam) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const CHUNK_SIZE = 6000;

const AiExamGenerator: React.FC<Props> = ({ onGenerate }) => {
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState<"10" | "11" | "12">("12");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewExam, setPreviewExam] = useState<Exam | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generatingRef = useRef(false);

  /* ================= LOAD DRAFT ================= */
  useEffect(() => {
    const init = async () => {
      try {
        const draft = await loadDraft();
        if (draft) {
          setTopic(draft.topic || "");
          setGrade(draft.grade || "12");
          setFileName(draft.file_name || null);
        }
      } catch (e) {
        console.error(e);
      }
    };
    init();
  }, []);

  /* ================= AUTO SAVE ================= */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      saveDraft(topic, grade, fileName);
    }, 700);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [topic, grade, fileName]);

  /* ================= SAFE JSON PARSE ================= */
  const safeParseJSON = (text: string) => {
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("AI trả về JSON không hợp lệ");
    }
  };

  /* ================= VALIDATE EXAM ================= */
  const validateExam = (data: any): Exam => {
    if (!data?.questions || !Array.isArray(data.questions)) {
      throw new Error("Cấu trúc đề thi không hợp lệ");
    }
    return data as Exam;
  };

  /* ================= SPLIT TEXT ================= */
  const splitChunks = (text: string) => {
    const arr = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      arr.push(text.slice(i, i + CHUNK_SIZE));
    }
    return arr;
  };

  /* ================= EXTRACT FILE ================= */
  const extractText = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File tối đa 10MB");
    }

    let text = "";

    if (file.type === "application/pdf") {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ") + "\n";
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

  /* ================= GEMINI CALL ================= */
  const generateFromText = async (inputText: string) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("Thiếu API KEY");

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
Bạn là giáo viên Toán THPT Việt Nam.
Chuẩn hóa nội dung sau thành JSON đúng chuẩn Exam.
Giữ nguyên công thức LaTeX $...$.
Chỉ trả JSON.

${inputText}
`;

    const res = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });

    const clean = (res.text || "")
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = safeParseJSON(clean);
    return validateExam(parsed);
  };

  /* ================= GENERATE ================= */
  const generateExam = async (input: string) => {
    if (generatingRef.current) return;
    generatingRef.current = true;

    setLoading(true);
    setError("");

    try {
      const exam = await generateFromText(input);
      setPreviewExam(exam);
      await saveGeneratedExam(exam);
      onGenerate(exam);
    } catch (err: any) {
      setError(err.message || "Không thể sinh đề");
    } finally {
      setLoading(false);
      generatingRef.current = false;
    }
  };

  /* ================= HANDLERS ================= */
  const handleGenerateFromTopic = () => {
    if (!topic.trim()) {
      setError("Vui lòng nhập chủ đề");
      return;
    }
    generateExam(`Soạn đề lớp ${grade} chủ đề "${topic}"`);
  };

  const handleFileUpload = async (file: File) => {
    setFileName(file.name);
    setError("");

    try {
      const text = await extractText(file);
      const chunks = splitChunks(text);

      let combined = "";
      for (const chunk of chunks) {
        combined += chunk + "\n";
      }

      generateExam(combined);
    } catch (err: any) {
      setError(err.message);
    }

    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClear = async () => {
    setTopic("");
    setFileName(null);
    setPreviewExam(null);
    setError("");
    await clearDraft();
  };

  /* ================= UI ================= */

  return (
    <div className="bg-white border rounded-3xl p-6 shadow-xl space-y-5 relative">

      {loading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-3xl z-50">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Sparkles className="text-indigo-600" size={20} />
          AI Exam Generator PRO MAX
        </h3>

        <div className="flex gap-2">
          <button
            onClick={() => saveDraft(topic, grade, fileName)}
            className="p-2 bg-green-100 hover:bg-green-200 rounded-xl"
          >
            <Save size={16} />
          </button>

          <button
            onClick={handleClear}
            className="p-2 bg-red-100 hover:bg-red-200 rounded-xl"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded-xl flex gap-2 items-center">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Nhập chủ đề..."
          className="flex-1 border rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500"
        />

        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value as any)}
          className="border rounded-xl px-3"
        >
          <option value="10">Lớp 10</option>
          <option value="11">Lớp 11</option>
          <option value="12">Lớp 12</option>
        </select>

        <button
          onClick={handleGenerateFromTopic}
          className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-700"
        >
          <Wand2 size={18} />
        </button>

        <button
          onClick={() => fileRef.current?.click()}
          className="bg-slate-200 px-4 rounded-xl hover:bg-slate-300"
        >
          <Upload size={16} />
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx"
          hidden
          onChange={(e) =>
            e.target.files?.[0] && handleFileUpload(e.target.files[0])
          }
        />
      </div>

      {fileName && (
        <div className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded-xl">
          <FileText size={14} />
          {fileName}
          <button onClick={() => setFileName(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {previewExam && (
        <div className="mt-6 space-y-4 border-t pt-4">
          <h4 className="font-semibold">Preview đề:</h4>

          {previewExam.questions.map((q, index) => (
            <div key={index} className="bg-slate-50 p-4 rounded-xl relative">
              <button
                onClick={() =>
                  setPreviewExam({
                    ...previewExam,
                    questions: previewExam.questions.filter((_, i) => i !== index)
                  })
                }
                className="absolute top-2 right-2 text-red-500"
              >
                <Trash2 size={14} />
              </button>

              <MathPreview math={q.question} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AiExamGenerator;
