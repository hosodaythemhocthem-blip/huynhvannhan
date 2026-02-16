import React, { useState, useRef } from "react";
import { 
  Upload, Sparkles, Loader2, Zap, Save, Trash2, 
  X, FileText, CheckCircle2, ClipboardPaste, AlertCircle 
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { supabase } from "../supabase";
import { geminiService } from "../services/geminiService";
import MathPreview from "./MathPreview";
import { useToast } from "./Toast";

// Worker PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Props {
  teacherId: string;
  onCreated?: (exam: any) => void;
}

const ImportExamFromFile: React.FC<Props> = ({ teacherId, onCreated }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [parsingAI, setParsingAI] = useState(false);
  const [parsedExam, setParsedExam] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      let rawText = "";
      if (file.type === "application/pdf") {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          rawText += text.items.map((item: any) => item.str).join(" ") + "\n";
        }
      } else {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        rawText = result.value;
      }

      // Gửi sang AI để bóc tách cấu trúc
      setParsingAI(true);
      const aiExam = await geminiService.parseExamWithAI(rawText);
      
      if (aiExam) {
        setParsedExam({
          ...aiExam,
          title: aiExam.title || file.name.replace(/\.[^/.]+$/, ""),
          teacher_id: teacherId,
          created_at: new Date().toISOString()
        });
        showToast("AI đã bóc tách đề thi thành công!", "success");
      }
    } catch (err) {
      showToast("Lỗi xử lý file hoặc AI từ chối nội dung.", "error");
    } finally {
      setLoading(false);
      setParsingAI(false);
    }
  };

  const handleSaveVinhVien = async () => {
    if (!parsedExam) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase.from('exams') as any).insert([parsedExam]).select();
      if (error) throw error;
      
      showToast("Đã lưu đề thi vĩnh viễn lên Cloud!", "success");
      if (onCreated) onCreated(data[0]);
      setParsedExam(null);
    } catch (err) {
      showToast("Lỗi khi lưu vào Supabase.", "error");
    } finally {
      setLoading(false);
    }
  };

  const removeQuestion = (idx: number) => {
    const newQs = parsedExam.questions.filter((_: any, i: number) => i !== idx);
    setParsedExam({ ...parsedExam, questions: newQs });
  };

  return (
    <div className="w-full">
      {!parsedExam ? (
        <div 
          onClick={() => fileRef.current?.click()}
          className="group cursor-pointer border-4 border-dashed border-slate-700 rounded-[3rem] p-16 flex flex-col items-center justify-center transition-all hover:border-indigo-500 hover:bg-indigo-500/5"
        >
          <div className="w-24 h-24 bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-600 transition-all">
            {loading ? <Loader2 className="animate-spin text-white" size={40} /> : <FileText className="text-slate-400 group-hover:text-white" size={40} />}
          </div>
          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">Tải đề Word/PDF lên</h3>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">Hệ thống AI sẽ tự động trích xuất công thức Toán</p>
          <input type="file" hidden ref={fileRef} accept=".pdf,.docx" onChange={handleFileUpload} />
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-2xl">
            <div>
              <h4 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">{parsedExam.title}</h4>
              <p className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest mt-1">AI trích xuất: {parsedExam.questions.length} câu hỏi</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setParsedExam(null)} className="p-5 bg-slate-100 text-slate-500 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all">
                <X size={24} />
              </button>
              <button onClick={handleSaveVinhVien} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-xl">
                <Save size={20} /> Lưu vĩnh viễn
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
            {parsedExam.questions.map((q: any, idx: number) => (
              <div key={idx} className="bg-white p-10 rounded-[3rem] border border-slate-100 relative group">
                <button 
                  onClick={() => removeQuestion(idx)}
                  className="absolute top-8 right-8 p-3 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={20} />
                </button>
                <div className="flex gap-6 mb-6">
                  <span className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-xs">#{idx + 1}</span>
                  <div className="flex-1">
                    <MathPreview content={q.text} className="text-lg font-bold text-slate-800 leading-relaxed" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-16">
                  {q.options.map((opt: string, oIdx: number) => (
                    <div key={oIdx} className={`p-4 rounded-2xl border-2 flex items-center gap-4 ${q.correctAnswer === oIdx ? 'border-emerald-500 bg-emerald-50' : 'border-slate-50 bg-slate-50'}`}>
                      <span className="font-black text-indigo-600 text-sm">{String.fromCharCode(65 + oIdx)}.</span>
                      <MathPreview content={opt} className="text-sm font-bold text-slate-600" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading Overlay cho AI */}
      {parsingAI && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-40 h-40 mx-auto mb-8">
              <div className="absolute inset-0 border-8 border-indigo-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-8 border-t-indigo-500 rounded-full animate-spin"></div>
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" size={48} />
            </div>
            <h2 className="text-white text-3xl font-black italic uppercase tracking-tighter mb-2">Lumina AI v6.0</h2>
            <p className="text-indigo-400 font-bold uppercase tracking-[0.4em] animate-pulse">Đang giải mã công thức Toán học...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportExamFromFile;
