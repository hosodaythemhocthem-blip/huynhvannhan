// components/AiExamGenerator.tsx
import React, { useState, useRef } from "react";
import {
  Upload,
  Sparkles,
  Loader2,
  Save,
  Trash2,
  ClipboardPaste,
  X,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import MathPreview from "./MathPreview";
import { geminiService } from "../services/geminiService";
import { supabase } from "../supabase";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Question {
  text: string;
  options: string[];
  correctAnswer?: number;
}

interface PreviewExam {
  title: string;
  questions: Question[];
}

const AiExamGenerator: React.FC<{
  userId: string;
  onGenerate?: (data: PreviewExam) => void;
}> = ({ userId, onGenerate }) => {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewExam, setPreviewExam] = useState<PreviewExam | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ================= GENERATE ================= */
  const handleGenerate = async () => {
    if (!topic.trim() || loading) return;

    setLoading(true);

    try {
      const data = await geminiService.parseExamWithAI(
        topic.trim().slice(0, 10000)
      );

      if (
        data &&
        data.title &&
        Array.isArray(data.questions) &&
        data.questions.length > 0
      ) {
        setPreviewExam(data);
        onGenerate?.(data);
      } else {
        alert("AI chưa nhận diện được cấu trúc đề.");
      }
    } catch {
      alert("AI đang bận. Thầy thử lại nhé.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILE IMPORT ================= */
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File tối đa 5MB.");
      return;
    }

    setLoading(true);

    try {
      let text = "";

      if (file.type === "application/pdf") {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ");
        }
      } else {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        text = result.value;
      }

      setTopic(text.slice(0, 10000));
    } catch {
      alert("Không đọc được file.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= SAVE CLOUD ================= */
  const saveToCloud = async () => {
    if (!previewExam || loading) return;

    setLoading(true);

    try {
      const { error } = await supabase.from("exams").insert({
        teacher_id: userId,
        title: previewExam.title,
        questions: previewExam.questions,
      });

      if (error) throw error;

      alert("Đã lưu đề vĩnh viễn!");
      setPreviewExam(null);
      setTopic("");
    } catch {
      alert("Lỗi khi lưu đề.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE QUESTION ================= */
  const deleteQuestion = (index: number) => {
    if (!previewExam) return;

    const updated: PreviewExam = {
      ...previewExam,
      questions: previewExam.questions.filter((_, i) => i !== index),
    };

    setPreviewExam(updated);
  };

  /* ================= CLEAR ALL ================= */
  const clearAll = () => {
    if (!confirm("Xóa toàn bộ nội dung?")) return;
    setTopic("");
    setPreviewExam(null);
  };

  /* ================= CTRL + V ================= */
  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    setTopic((prev) => prev + text);
  };

  return (
    <div className="space-y-6">
      {/* INPUT */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
        <h3 className="text-2xl font-black italic mb-6">
          AI Exam Engine v8.0
        </h3>

        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full p-6 bg-slate-50 rounded-2xl min-h-[180px] outline-none shadow-inner"
          placeholder="Dán nội dung đề hoặc upload file..."
        />

        <div className="flex gap-3 mt-4 justify-end flex-wrap">
          <button
            onClick={() => fileRef.current?.click()}
            className="p-4 text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            <Upload size={20} />
          </button>

          <button
            onClick={handlePaste}
            className="p-4 text-indigo-600 hover:bg-indigo-50 rounded-xl"
          >
            <ClipboardPaste size={20} />
          </button>

          <button
            onClick={clearAll}
            className="p-4 text-rose-500 hover:bg-rose-50 rounded-xl"
          >
            <Trash2 size={20} />
          </button>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Sparkles />
            )}
            TRÍCH XUẤT ĐỀ
          </button>
        </div>

        <input
          type="file"
          hidden
          ref={fileRef}
          accept=".pdf,.doc,.docx"
          onChange={(e) =>
            e.target.files && handleFileUpload(e.target.files[0])
          }
        />
      </div>

      {/* PREVIEW */}
      {previewExam && (
        <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-t-4 border-indigo-600">
          <div className="flex justify-between mb-8 flex-wrap gap-4">
            <h4 className="text-xl font-black uppercase italic text-indigo-900">
              {previewExam.title}
            </h4>

            <button
              onClick={saveToCloud}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2"
            >
              <Save size={18} /> LƯU CLOUD
            </button>
          </div>

          <div className="space-y-6">
            {previewExam.questions.map((q, i) => (
              <div
                key={i}
                className="p-6 bg-slate-50 rounded-2xl relative group"
              >
                <button
                  onClick={() => deleteQuestion(i)}
                  className="absolute top-4 right-4 text-rose-500 opacity-40 hover:opacity-100"
                >
                  <X size={16} />
                </button>

                <MathPreview
                  content={`${i + 1}. ${q.text}`}
                  className="font-bold text-slate-800 mb-4"
                />

                <div className="grid grid-cols-2 gap-4">
                  {q.options?.map((opt, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-lg border text-sm"
                    >
                      <span className="font-black text-indigo-600 mr-2">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <MathPreview content={opt} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiExamGenerator;
