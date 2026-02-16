
import React, { useState, useRef } from "react";
// Fix: Import OnlineExam and MathQuestion from unified format
import { OnlineExam, MathQuestion } from "../examFo";
import { 
  Upload, Sparkles, Loader2, Wand2, AlertCircle, Trash2, 
  Save, FileText, X, ClipboardPaste, CheckCircle2, ChevronDown, ChevronUp
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import MathPreview from "./MathPreview";
import { geminiService } from "../services/geminiService";
import { supabase } from "../supabase";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface Props {
  userId: string;
  // Fix: Use OnlineExam type consistently
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
    } else if (file.type.includes("word") || file.name.endsWith(".docx")) {
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value;
    }
    return "";
  };

  const handleGenerate = async (rawInput: string) => {
    if (!rawInput.trim()) return setError("Thầy hãy nhập nội dung bài tập hoặc dán đề vào đây nhé.");
    setLoading(true);
    setError("");
    try {
      const data = await geminiService.parseExamWithAI(rawInput);
      if (data && data.questions) {
        setPreviewExam(data);
      } else {
        throw new Error("AI không trả về kết quả hợp lệ.");
      }
    } catch (err) {
      setError("AI Lumina đang bận hoặc nội dung quá phức tạp. Thầy hãy thử chia nhỏ nội dung nhé.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const text = await extractText(file);
      if (!text) throw new Error("Không thể đọc được văn bản từ file này.");
      await handleGenerate(text);
    } catch (err: any) {
      setError(err.message || "Lỗi xử lý file.");
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!previewExam) return;
    setLoading(true);
    try {
      // Fix: Conform to OnlineExam interface including the mandatory updatedAt field
      const newExam: OnlineExam = {
        id: Date.now().toString(),
        title: previewExam.title || 'Đề thi mới từ AI',
        description: `Tạo bởi Thầy Nhẫn qua AI vào ${new Date().toLocaleDateString()}`,
        teacherId: userId,
        questions: previewExam.questions.map((q: any) => ({
          ...q,
          id: Math.random().toString(36).substr(2, 9),
          points: q.points || 1,
          type: q.type || 'MCQ'
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        duration: 60,
        isLocked: false,
        subject: "Toán học",
        grade: "12"
      };
      
      await supabase.from('exams').insert(newExam);
      alert("Tuyệt vời! Đề thi đã được lưu vĩnh viễn vào hệ thống NhanLMS.");
      onGenerate(newExam);
      setPreviewExam(null);
      setTopic("");
    } catch (err) {
      alert("Lỗi lưu trữ Supabase. Thầy hãy kiểm tra kết nối mạng nhé.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasteToQuestion = async (idx: number) => {
    try {
      const text = await navigator.clipboard.readText();
      const newQuestions = [...previewExam.questions];
      newQuestions[idx].text += " " + text;
      setPreviewExam({ ...previewExam, questions: newQuestions });
    } catch (err) {
      alert("Lỗi truy cập Clipboard.");
    }
  };

  const deleteQuestion = (idx: number) => {
    if (confirm("Xóa vĩnh viễn câu hỏi này khỏi đề thi đang soạn?")) {
      const newQuestions = [...previewExam.questions];
      newQuestions.splice(idx, 1);
      setPreviewExam({ ...previewExam, questions: newQuestions });
    }
  };

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <div className="bg-white/90 backdrop-blur-2xl border border-white/50 rounded-[3rem] p-8 md:p-12 shadow-2xl relative animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-200 animate-float">
              <Sparkles className="text-white" size={36} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Trình Tạo Đề Thầy Nhẫn Pro</h3>
              <p className="text-sm font-bold text-indigo-500 uppercase tracking-[0.2em] mt-1">Sức mạnh Gemini 3 Flash & Supabase</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={() => fileRef.current?.click()} className="flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl group">
                <Upload size={20} className="group-hover:-translate-y-1 transition-transform" />
                <span>Tải Word/PDF</span>
             </button>
             <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt" hidden onChange={handleFileUpload} />
          </div>
        </div>

        <div className="relative group">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Dán nội dung bài tập, yêu cầu hoặc đề thi thô tại đây. AI Lumina sẽ xử lý tất cả, kể cả các công thức toán phức tạp..."
            className="w-full px-10 py-8 rounded-[2.5rem] bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white outline-none transition-all font-medium text-slate-700 shadow-inner min-h-[200px] text-lg leading-relaxed"
          />
          <div className="absolute right-6 bottom-6 flex gap-2">
            <button 
              onClick={async () => setTopic(await navigator.clipboard.readText())}
              className="p-3 bg-white text-slate-400 rounded-xl hover:text-indigo-600 shadow-sm border border-slate-100 transition-all flex items-center gap-2 text-xs font-bold"
            >
              <ClipboardPaste size={16} /> Dán nội dung
            </button>
            <button 
              onClick={() => handleGenerate(topic)} 
              disabled={loading || !topic.trim()} 
              className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
              TẠO ĐỀ NGAY
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-8 p-6 bg-rose-50 text-rose-600 rounded-[1.5rem] flex items-center gap-4 border border-rose-100 animate-pulse font-bold">
            <AlertCircle size={24} /> {error}
          </div>
        )}
      </div>

      {/* Preview Section */}
      {previewExam && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div>
              <h4 className="text-2xl font-black text-slate-800">{previewExam.title}</h4>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                <i className="fas fa-layer-group mr-2"></i> {previewExam.questions.length} Câu hỏi đã sẵn sàng
              </p>
            </div>
            <button onClick={handleSave} className="bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-emerald-700 hover:-translate-y-2 transition-all flex items-center gap-3">
              <Save size={24} /> LƯU ĐỀ VĨNH VIỄN
            </button>
          </div>

          <div className="grid grid-cols-1 gap-8 pb-32">
            {previewExam.questions.map((q: any, idx: number) => (
              <div key={idx} className="group p-10 bg-white rounded-[3rem] border border-slate-100 hover:border-indigo-200 transition-all shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-all"></div>
                
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                    <span className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                      {idx + 1}
                    </span>
                    <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-tighter">
                      Trắc nghiệm
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handlePasteToQuestion(idx)}
                      className="p-4 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                      title="Dán thêm nội dung vào câu này"
                    >
                      <ClipboardPaste size={20} />
                    </button>
                    <button 
                      onClick={() => deleteQuestion(idx)}
                      className="p-4 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="mb-10">
                  <MathPreview content={q.text} className="text-xl font-bold text-slate-800 leading-relaxed mb-8" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt: string, oIdx: number) => (
                      <div 
                        key={oIdx} 
                        className={`relative p-6 rounded-2xl border-2 transition-all flex items-center gap-4
                          ${q.correctAnswer === String.fromCharCode(65+oIdx) 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
                            : 'bg-slate-50 border-transparent text-slate-600 hover:border-slate-200'}`}
                      >
                        <span className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-black text-xs">
                          {String.fromCharCode(65+oIdx)}
                        </span>
                        <MathPreview content={opt} />
                        {q.correctAnswer === String.fromCharCode(65+oIdx) && (
                          <CheckCircle2 size={18} className="absolute right-6 text-indigo-600" />
                        )}
                      </div>
                    ))}
                  </div>
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
