
import React, { useState } from "react";
import { Exam, Question, QuestionType } from "../types.ts";
import { GoogleGenAI } from "@google/genai";
// Updated import to parseExamFile to match services/geminiService.ts
import { parseExamFile } from "../services/geminiService.ts";
import { Upload, Sparkles, FileText, BrainCircuit, Loader2, Wand2, AlertCircle } from "lucide-react";

interface Props {
  onGenerate: (exam: Exam) => void;
}

const AiExamGenerator: React.FC<Props> = ({ onGenerate }) => {
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState<"10" | "11" | "12">("12");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"topic" | "file">("topic");

  const handleGenerateFromTopic = async () => {
    if (!topic.trim()) {
      setError("Vui lòng nhập chủ đề Toán");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
Bạn là giáo viên Toán THPT Việt Nam. Hãy sinh 1 đề thi Toán lớp ${grade} chuẩn Bộ GD 2025 về: "${topic}".
YÊU CẦU:
- Trả về JSON thuần, KHÔNG markdown.
- Công thức LaTeX dùng $...$.
- Đủ 3 phần: Phần I (Trắc nghiệm), Phần II (Đúng/Sai), Phần III (Trả lời ngắn).
`;

      const res = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      // Added safety check for res.text
      const jsonStr = res.text || "{}";
      const data = JSON.parse(jsonStr.replace(/```json/g, "").replace(/```/g, "").trim());
      processAndEmitExam(data);
    } catch (e) {
      setError("AI không thể sinh đề. Thử lại sau!");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const b64 = (reader.result as string).split(",")[1];
        // Updated to use parseExamFile instead of parseExamFileMultimodal
        const data = await parseExamFile(b64, file.type);
        processAndEmitExam(data);
      } catch (err) {
        setError("Lỗi nạp file: AI không nhận diện được cấu trúc đề.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const processAndEmitExam = (data: any) => {
    const questions: Question[] = (data.questions || []).map((q: any, index: number) => ({
      id: q.id || `Q${index + 1}`,
      type: q.type as QuestionType,
      section: q.section,
      text: q.text,
      options: q.options || [],
      subQuestions: q.subQuestions || [],
      correctAnswer: q.correctAnswer,
      points: q.points ?? (q.section === 1 ? 0.25 : q.section === 2 ? 1.0 : 0.5),
    }));

    const exam: Exam = {
      id: `AI_${Date.now()}`,
      title: data.title || `Đề AI – ${topic}`,
      createdAt: new Date().toLocaleDateString("vi-VN"),
      questionCount: questions.length,
      isLocked: false,
      duration: 90,
      questions,
    };

    onGenerate(exam);
    setTopic("");
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-xl shadow-indigo-50/50 space-y-6 relative overflow-hidden group">
      {/* Background Decor */}
      <div className="absolute -top-10 -right-10 text-indigo-50 group-hover:text-indigo-100/50 transition-colors pointer-events-none">
        <BrainCircuit size={160} />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Wand2 size={24} />
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-800 italic tracking-tight">AI Exam Genius</h3>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">Chuẩn THPT 2025</p>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setMode("topic")}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === "topic" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}
            >
              Sinh đề
            </button>
            <button 
              onClick={() => setMode("file")}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === "file" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}
            >
              Nạp file
            </button>
          </div>
        </div>

        {mode === "topic" ? (
          <div className="space-y-4">
            <input
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-[20px] px-6 py-4 font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300 shadow-inner"
              placeholder="VD: Hàm số mũ – Logarit"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-3">
              {(["10", "11", "12"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`py-3 rounded-xl font-black text-xs transition-all border-2 ${grade === g ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400"}`}
                >
                  Lớp {g}
                </button>
              ))}
            </div>
            <button
              onClick={handleGenerateFromTopic}
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} className="text-indigo-400" />}
              {loading ? "AI đang biên soạn..." : "Sinh đề bằng AI"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-indigo-100 rounded-[32px] bg-indigo-50/30 cursor-pointer hover:bg-indigo-50/50 transition-all group/upload">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm mb-4 group-hover/upload:scale-110 transition-transform">
                  {loading ? <Loader2 className="animate-spin" /> : <Upload size={32} />}
                </div>
                <p className="mb-2 text-sm text-indigo-600 font-black italic tracking-tight">
                  {loading ? "AI đang đọc đề..." : "Tải lên đề Word / PDF"}
                </p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hỗ trợ nhận diện công thức Toán</p>
              </div>
              <input type="file" className="hidden" accept=".docx,.doc,.pdf" onChange={handleFileUpload} disabled={loading} />
            </label>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in fade-in zoom-in-95">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiExamGenerator;
