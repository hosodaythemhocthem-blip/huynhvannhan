import React, { useState, useRef } from "react";
import { OnlineExam, QuestionType } from "../types";
import { 
  Upload, Sparkles, Loader2, Save, X, Trash2, 
  FileText, ClipboardPaste, CheckCircle2, AlertCircle
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import MathPreview from "./MathPreview";
import { geminiService } from "../services/geminiService";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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

  // === XỬ LÝ BÓC TÁCH FILE (WORD/PDF) ===
  const extractText = async (file: File): Promise<string> => {
    try {
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
      } else if (file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        return result.value;
      }
      return "";
    } catch (err) {
      throw new Error("Không thể đọc file. Hãy kiểm tra định dạng.");
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTopic(prev => prev + "\n" + text);
    } catch {
      setError("Hãy dùng Ctrl + V để dán.");
    }
  };

  const handleGenerate = async (rawInput: string) => {
    if (!rawInput.trim()) return setError("Hãy nhập nội dung hoặc tải file bài tập.");
    setLoading(true);
    setError("");
    try {
      const data = await geminiService.parseExamWithAI(rawInput);
      if (data && data.questions) {
        setPreviewExam(data);
      } else {
        throw new Error("AI không bóc tách được câu hỏi.");
      }
    } catch (err) {
      setError("Lumina AI đang bận xử lý toán học, Thầy thử lại sau giây lát nhé.");
    } finally {
      setLoading(false);
    }
  };

  const removeQuestion = (idx: number) => {
    if (previewExam) {
      const newQs = [...previewExam.questions];
      newQs.splice(idx, 1);
      setPreviewExam({ ...previewExam, questions: newQs });
    }
  };

  const handleSave = async () => {
    if (!previewExam || previewExam.questions.length === 0) return;
    setLoading(true);
    try {
      const newExam: OnlineExam = {
        id: `exam_${Date.now()}`,
        title: previewExam.title || 'Đề toán tạo bởi AI',
        description: `Đề thi AI bóc tách ngày ${new Date().toLocaleDateString()}`,
        teacherId: userId,
        questions: previewExam.questions.map((q: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          type: QuestionType.MCQ,
          text: q.text,
          points: 1,
          correctAnswer: q.correctAnswer || "A",
          choices: (q.options || []).map((opt: string, i: number) => ({
            id: `choice_${i}`,
            label: String.fromCharCode(65 + i),
            content: opt
          }))
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        duration: 45,
        isLocked: false,
        subject: "Toán học",
        grade: "12"
      };
      
      const { error: saveError } = await (supabase.from('exams') as any).insert(newExam);
      if (saveError) throw saveError;

      onGenerate(newExam);
      setPreviewExam(null);
      setTopic("");
      alert("Đã lưu đề vào Cloud vĩnh viễn!");
    } catch (err) {
      setError("Lỗi kết nối Supabase Cloud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 font-sans">
      <div className="bg-white rounded-[3.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Sparkles size={24} />
           </div>
           <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">AI Exam Extraction</h3>
        </div>

        <div className="relative">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Dán nội dung bài tập hoặc đề thô tại đây..."
            className="w-full px-8 py-8 rounded-[2.5rem] bg-slate-50 border-2 border-transparent focus:border-indigo-100 outline-none font-bold text-slate-700 shadow-inner min-h-[220px] transition-all"
          />
          <button 
            onClick={handlePaste}
            className="absolute top-4 right-4 p-3 bg-white text-indigo-600 rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-100"
            title="Dán từ bộ nhớ tạm"
          >
            <ClipboardPaste size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-rose-50 text-rose-600 rounded-2xl flex items-center gap-2 font-bold text-sm animate-pulse">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <div className="flex flex-wrap gap-4 mt-8">
           <button 
             onClick={() => fileRef.current?.click()} 
             className="px-8 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl"
           >
              <FileText size={22} /> NHẬP TỪ WORD/PDF
           </button>
           
           <input 
             ref={fileRef} type="file" hidden accept=".pdf,.docx,.doc" 
             onChange={async (e) => {
               const f = e.target.files?.[0];
               if(f) { 
                 setLoading(true); 
                 try {
                   const t = await extractText(f); 
                   handleGenerate(t); 
                 } catch(e: any) { setError(e.message); setLoading(false); }
               }
             }} 
           />

           <button 
             onClick={() => handleGenerate(topic)} 
             disabled={loading} 
             className="flex-1 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
           >
              {loading ? <Loader2 className="animate-spin" /> : <Wand2 />} BÓC TÁCH ĐỀ BẰNG AI
           </button>
        </div>
      </div>

      <AnimatePresence>
        {previewExam && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 gap-6">
              <div>
                <h4 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter leading-none">{previewExam.title}</h4>
                <p className="text-slate-400 font-bold mt-2 text-sm uppercase tracking-widest">Đã bóc tách thành công {previewExam.questions.length} câu hỏi</p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={() => setPreviewExam(null)} className="p-5 bg-slate-100 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all">
                  <X size={24} />
                </button>
                <button onClick={handleSave} className="flex-1 md:flex-none bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all">
                  <Save size={24} /> LƯU ĐỀ VĨNH VIỄN
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {previewExam.questions.map((q: any, idx: number) => (
                <motion.div 
                  key={idx} layout
                  className="group p-8 bg-white rounded-[3rem] border border-slate-100 relative hover:border-indigo-200 transition-all"
                >
                  <button 
                    onClick={() => removeQuestion(idx)}
                    className="absolute top-6 right-6 p-3 bg-rose-50 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="flex gap-4 mb-6">
                    <span className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500 text-sm">
                      {idx + 1}
                    </span>
                    <MathPreview content={q.text} className="text-lg font-bold text-slate-800 flex-1 pt-1" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-14">
                    {(q.options || []).map((opt: string, oIdx: number) => (
                      <div key={oIdx} className={`p-5 rounded-2xl flex items-center gap-4 transition-all ${q.correctAnswer === String.fromCharCode(65+oIdx) ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-transparent'}`}>
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${q.correctAnswer === String.fromCharCode(65+oIdx) ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                          {String.fromCharCode(65+oIdx)}
                        </span>
                        <MathPreview content={opt} className="font-bold text-slate-600" />
                        {q.correctAnswer === String.fromCharCode(65+oIdx) && <CheckCircle2 className="ml-auto text-emerald-500" size={18} />}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiExamGenerator;
