import React, { useState, useRef } from "react";
import { OnlineExam, ExamQuestion } from "../types/examFormat";
import {
  Upload,
  Sparkles,
  Loader2,
  Wand2,
  AlertCircle,
  Trash2,
  Save,
  ClipboardPaste,
  CheckCircle2,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import MathPreview from "./MathPreview";
import { geminiService } from "../services/geminiService";
import { supabase } from "../supabase";
import { v4 as uuidv4 } from "uuid";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Props {
  userId: string;
  onGenerate: (exam: OnlineExam) => void;
}

const AiExamGenerator: React.FC<Props> = ({ userId, onGenerate }) => {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewExam, setPreviewExam] = useState<OnlineExam | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ================== FILE EXTRACT ==================
  const extractText = async (file: File): Promise<string> => {
    if (file.type === "application/pdf") {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((i: any) => i.str).join(" ") + "\n";
      }
      return text;
    }

    if (
      file.type.includes("wordprocessingml") ||
      file.type.includes("msword")
    ) {
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value;
    }

    throw new Error("Chỉ hỗ trợ PDF và Word");
  };

  // ================== GENERATE ==================
  const handleGenerate = async (rawInput: string) => {
    if (!rawInput.trim()) {
      setError("Vui lòng nhập nội dung đề thi.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const aiData = await geminiService.parseExamWithAI(rawInput);

      if (!aiData?.questions?.length) {
        throw new Error("AI không trả về dữ liệu hợp lệ.");
      }

      const exam: OnlineExam = {
        id: uuidv4(),
        title: aiData.title || "Đề thi AI tạo",
        subject: "Toán học",
        grade: "12",
        questions: aiData.questions.map((q: any, index: number): ExamQuestion => ({
          id: uuidv4(),
          order: index + 1,
          type: q.type === "essay" ? "essay" : "multiple_choice",
          content: q.text,
          choices: q.options?.map((opt: string) => ({
            id: uuidv4(),
            content: opt,
          })),
          correctAnswer: q.correctAnswer,
          maxScore: q.points || 1,
        })),
        createdBy: userId,
        createdAt: Date.now(),
        durationMinutes: 60,
        shuffleQuestions: false,
      };

      setPreviewExam(exam);
    } catch (err) {
      setError("AI Lumina đang bận. Thử lại nhé.");
    } finally {
      setLoading(false);
    }
  };

  // ================== FILE UPLOAD ==================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const text = await extractText(file);
      await handleGenerate(text);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================== SAVE SUPABASE ==================
  const handleSave = async () => {
    if (!previewExam) return;

    setLoading(true);

    try {
      const { error } = await supabase.from("exams").insert({
        id: previewExam.id,
        title: previewExam.title,
        description: JSON.stringify(previewExam.questions),
        teacher_id: userId,
        file_url: null,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      alert("Đề thi đã lưu vĩnh viễn vào Supabase.");
      onGenerate(previewExam);
      setPreviewExam(null);
      setTopic("");
    } catch (err) {
      alert("Lỗi lưu Supabase.");
    } finally {
      setLoading(false);
    }
  };

  // ================== DELETE QUESTION ==================
  const deleteQuestion = (idx: number) => {
    if (!previewExam) return;
    if (!confirm("Xóa câu hỏi này?")) return;

    const updated = { ...previewExam };
    updated.questions.splice(idx, 1);
    setPreviewExam(updated);
  };

  // ================== UI ==================
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl p-8 shadow-xl">
        <div className="flex justify-between mb-6">
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <Sparkles size={24} /> AI Tạo Đề
          </h3>

          <button
            onClick={() => fileRef.current?.click()}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl flex gap-2 items-center"
          >
            <Upload size={18} /> Upload Word/PDF
          </button>

          <input
            hidden
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
          />
        </div>

        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Dán đề thi vào đây..."
          className="w-full border rounded-xl p-4 min-h-[160px]"
        />

        <button
          onClick={() => handleGenerate(topic)}
          disabled={loading}
          className="mt-4 bg-indigo-600 text-white px-8 py-3 rounded-xl flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
          Tạo đề
        </button>

        {error && (
          <div className="mt-4 text-rose-600 flex gap-2 items-center">
            <AlertCircle size={18} /> {error}
          </div>
        )}
      </div>

      {previewExam && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-xl font-bold">{previewExam.title}</h4>
            <button
              onClick={handleSave}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl flex gap-2 items-center"
            >
              <Save size={18} /> Lưu vĩnh viễn
            </button>
          </div>

          {previewExam.questions.map((q, idx) => (
            <div key={q.id} className="bg-white p-6 rounded-2xl shadow">
              <div className="flex justify-between mb-4">
                <strong>Câu {idx + 1}</strong>
                <button onClick={() => deleteQuestion(idx)}>
                  <Trash2 size={16} />
                </button>
              </div>

              <MathPreview content={q.content} />

              {q.choices?.map((c, i) => (
                <div key={c.id} className="mt-2 flex gap-2">
                  <span>{String.fromCharCode(65 + i)}.</span>
                  <MathPreview content={c.content} />
                  {q.correctAnswer === c.id && (
                    <CheckCircle2 size={16} className="text-green-600" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AiExamGenerator;
