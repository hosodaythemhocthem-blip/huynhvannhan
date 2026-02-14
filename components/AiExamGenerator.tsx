
import React, { useState, useRef } from "react";
import { Exam } from "../types";
import { 
  Upload, Sparkles, Loader2, Wand2, AlertCircle, Trash2, 
  Save, FileText, X, ClipboardPaste, CheckCircle2 
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import MathPreview from "./MathPreview";
import { parseExamWithAI } from "../services/geminiService";
import { supabase } from "../supabase";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface Props {
  userId: string;
  onGenerate: (exam: Exam) => void;
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
    } else {
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value;
    }
  };

  const handleGenerate = async (rawInput: string) => {
    if (!rawInput.trim()) return setError("Hãy nhập nội dung hoặc chọn file.");
    setLoading(true);
    setError("");
    try {
      const data = await parseExamWithAI(rawInput);
      setPreviewExam(data);
    } catch (err) {
      setError("AI gặp khó khăn khi xử lý nội dung này. Thầy hãy thử dán nội dung văn bản trực tiếp nhé.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const text = await extractText(file);
      await handleGenerate(text);
    } catch (err) {
      setError("Không thể đọc file PDF/Word này.");
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!previewExam) return;
    try {
      const { data, error } = await supabase.from('exams').insert({
        title: previewExam.title || 'Đề thi mới',
        subject: previewExam.subject || 'Toán học',
        questions: previewExam.questions,
        created_by: userId,
        created_at: new Date().toISOString()
      }).select().single();
      
      if (error) throw error;
      alert("Đã lưu đề thi thành công vào hệ thống!");
      onGenerate(data as Exam);
      setPreviewExam(null);
      setTopic("");
    } catch (err) {
      alert("Lỗi kết nối database Supabase.");
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTopic(prev => prev + (prev ? "\n" : "") + text);
    } catch (err) {
      alert("Thầy hãy nhấn Ctrl+V trực tiếp vào ô nhập liệu nhé.");
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-2xl border border-white/50 rounded-[3rem] p-10 shadow-2xl relative animate-in fade-in zoom-in duration-500">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-indigo-200">
            <Sparkles className="text-white" size={32} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">AI Soạn Đề Pro</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Trợ lý đặc biệt của Thầy Nhẫn</p>
          </div>
        </div>
        {previewExam && (
          <div className="flex gap-3">
            <button onClick={handleSave} className="flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100">
              <Save size={20} /> Lưu Vĩnh Viễn
            </button>
            <button onClick={() => setPreviewExam(null)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
              <Trash2 size={24} />
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-5 mb-10">
        <div className="flex-1 relative group">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Thầy dán nội dung đề bài tại đây..."
            className="w-full px-10 py-8 rounded-[2rem] bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700 shadow-inner min-h-[120px] resize-none"
          />
          <button onClick={handlePaste} className="absolute right-6 top-6 p-3 bg-white text-slate-400 rounded-xl hover:text-indigo-600 shadow-sm border border-slate-100 transition-all">
            <ClipboardPaste size={20} />
          </button>
        </div>
        
        <div className="flex flex-col gap-3">
          <button onClick={() => handleGenerate(topic)} disabled={loading} className="w-24 h-24 bg-indigo-600 text-white rounded-[2rem] flex flex-col items-center justify-center hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={32} /> : <Wand2 size={32} />}
            <span className="text-[10px] font-black uppercase mt-1">Tạo Đề</span>
          </button>
          <button onClick={() => fileRef.current?.click()} className="w-24 h-24 bg-slate-900 text-white rounded-[2rem] flex flex-col items-center justify-center hover:bg-black transition-all shadow-xl">
            <Upload size={32} />
            <span className="text-[10px] font-black uppercase mt-1">Up File</span>
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" hidden onChange={handleFileUpload} />
      </div>

      {error && (
        <div className="mb-8 p-6 bg-rose-50 text-rose-600 rounded-[1.5rem] flex items-center gap-4 border border-rose-100 animate-pulse font-bold">
          <AlertCircle size={24} /> {error}
        </div>
      )}

      {previewExam && (
        <div className="space-y-8 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
          <div className="p-8 bg-indigo-50/50 rounded-[2rem] border border-indigo-100">
             <h4 className="text-xl font-black text-indigo-900 mb-2">{previewExam.title}</h4>
             <p className="text-sm font-bold text-indigo-400 uppercase tracking-widest">{previewExam.subject}</p>
          </div>
          {previewExam.questions?.map((q: any, idx: number) => (
            <div key={idx} className="group p-10 bg-white rounded-[2.5rem] border border-slate-100 hover:border-indigo-400 transition-all shadow-sm relative overflow-hidden">
              <div className="flex justify-between mb-6">
                <span className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">{idx + 1}</span>
                <button onClick={() => {
                  const newQs = [...previewExam.questions];
                  newQs.splice(idx, 1);
                  setPreviewExam({...previewExam, questions: newQs});
                }} className="p-3 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 size={20} />
                </button>
              </div>
              <MathPreview content={q.text} className="mb-8 font-bold text-slate-800 text-xl leading-relaxed" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {q.options.map((opt: string, i: number) => (
                  <div key={i} className={`p-6 rounded-2xl border-2 transition-all ${q.correctAnswer === String.fromCharCode(65+i) ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-slate-50 border-slate-50 text-slate-600'}`}>
                    <span className="font-black mr-3 opacity-60">{String.fromCharCode(65+i)}.</span>
                    <MathPreview content={opt} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AiExamGenerator;
