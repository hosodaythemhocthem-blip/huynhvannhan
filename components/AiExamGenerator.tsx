import React, { useState, useRef } from "react";
import { OnlineExam, QuestionType } from "../types";
import { 
  Upload, Sparkles, Loader2, Wand2, AlertCircle, Trash2, 
  Save, FileText, X, ClipboardPaste, CheckCircle2
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import MathPreview from "./MathPreview";
import { geminiService } from "../services/geminiService";
import { supabase } from "../supabase";

interface Props {
  userId: string;
  onGenerate: (exam: OnlineExam) => void;
}

const AiExamGenerator: React.FC<Props> = ({ userId, onGenerate }) => {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewExam, setPreviewExam] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const extractText = async (file: File): Promise<string> => {
    if (file.type === "application/pdf") {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ") + "\n";
      }
      return text;
    } else if (file.name.endsWith(".docx")) {
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value;
    }
    return "";
  };

  const handleGenerate = async (rawInput: string) => {
    if (!rawInput.trim()) return setError("Hãy nhập nội dung bài tập.");
    setLoading(true);
    setError("");
    try {
      const data = await geminiService.parseExamWithAI(rawInput);
      if (data && data.questions) {
        setPreviewExam(data);
      }
    } catch (err) {
      setError("AI đang bận, thử lại sau nhé.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!previewExam) return;
    setLoading(true);
    try {
      const newExam: OnlineExam = {
        id: String(Date.now()),
        title: previewExam.title || 'Đề thi mới từ AI',
        description: `Tạo bởi AI vào ${new Date().toLocaleDateString()}`,
        teacherId: userId,
        questions: previewExam.questions.map((q: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          type: QuestionType.MCQ,
          text: q.text,
          points: 1,
          correctAnswer: q.correctAnswer || "A",
          choices: (q.options || []).map((opt: string, i: number) => ({
            id: `c${i}`,
            label: String.fromCharCode(65 + i),
            content: opt
          }))
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        duration: 60,
        isLocked: false,
        subject: "Toán học",
        grade: "12"
      };
      
      await (supabase.from('exams') as any).insert(newExam);
      onGenerate(newExam);
      setPreviewExam(null);
      setTopic("");
    } catch (err) {
      setError("Lỗi lưu trữ Cloud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl relative">
        <h3 className="text-3xl font-black text-slate-900 mb-8 italic">AI Exam Generator</h3>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Dán nội dung bài tập tại đây..."
          className="w-full px-8 py-6 rounded-[2rem] bg-slate-50 border-none outline-none font-bold text-slate-700 shadow-inner min-h-[150px]"
        />
        <div className="flex gap-4 mt-6 justify-end">
           <button onClick={() => fileRef.current?.click()} className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-2">
              <Upload size={20} /> Word/PDF
           </button>
           <input ref={fileRef} type="file" hidden accept=".pdf,.docx" onChange={async (e) => {
             const f = e.target.files?.[0];
             if(f) { setLoading(true); const t = await extractText(f); handleGenerate(t); }
           }} />
           <button onClick={() => handleGenerate(topic)} disabled={loading} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-indigo-100">
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} TẠO ĐỀ AI
           </button>
        </div>
      </div>

      {previewExam && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8">
          <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm">
            <h4 className="text-2xl font-black text-slate-800 italic">{previewExam.title}</h4>
            <button onClick={handleSave} className="bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl flex items-center gap-3">
              <Save size={24} /> LƯU ĐỀ VĨNH VIỄN
            </button>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {previewExam.questions.map((q: any, idx: number) => (
              <div key={idx} className="p-8 bg-white rounded-[3rem] border border-slate-100">
                <MathPreview content={q.text} className="text-lg font-bold mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(q.options || []).map((opt: string, oIdx: number) => (
                    <div key={oIdx} className="p-5 rounded-2xl bg-slate-50 flex items-center gap-4">
                      <span className="font-black text-indigo-600">{String.fromCharCode(65+oIdx)}.</span>
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
