
import React, { useState, useRef } from "react";
import { Upload, Sparkles, Loader2, Zap } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { supabase } from "../supabase";
import { geminiService } from "../services/geminiService";
import MathPreview from "./MathPreview";
import { useToast } from "./Toast";
import { Exam, QuestionType } from "../types";

interface Props {
  teacherId: string;
  onCreated?: (exam: Exam) => void;
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
      let content = "";
      if (file.type === "application/pdf") {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          content += text.items.map((s: any) => s.str).join(" ") + "\n";
        }
      } else {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        content = result.value;
      }
      
      setParsingAI(true);
      const aiResult = await geminiService.parseExamWithAI(content);
      setParsedExam(aiResult);
      showToast("Lumina AI đã trích xuất xong đề thi!", "success");
    } catch (err) {
      showToast("Lỗi xử lý tệp hoặc AI không phản hồi.", "error");
    } finally {
      setLoading(false);
      setParsingAI(false);
    }
  };

  const saveToCloud = async () => {
    if (!parsedExam) return;
    setLoading(true);
    try {
      const exam: Exam = {
        id: `exam_${Date.now()}`,
        title: parsedExam.title || "Đề thi mới từ AI",
        description: "Tự động trích xuất bởi Lumina AI 3.0",
        teacherId,
        questions: parsedExam.questions.map((q: any, idx: number) => ({
          id: `q_${idx}_${Date.now()}`,
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
        subject: "Toán học",
        grade: "12",
        isLocked: false
      };
      await supabase.from('exams').insert(exam);
      showToast("Đã lưu đề vĩnh viễn vào hệ thống!", "success");
      onCreated?.(exam);
      setParsedExam(null);
    } catch (err) {
      showToast("Lỗi lưu trữ Cloud.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {!parsedExam ? (
        <div 
          className="bg-indigo-50/5 border-4 border-dashed border-indigo-500/20 rounded-[4rem] p-24 text-center hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all cursor-pointer group shadow-inner"
          onClick={() => fileRef.current?.click()}
        >
          <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl group-hover:scale-110 transition-transform">
             {loading ? <Loader2 className="animate-spin text-white" size={40} /> : <Upload className="text-white" size={40} />}
          </div>
          <h4 className="text-3xl font-black text-white tracking-tighter italic">Kéo thả hoặc Chọn tệp</h4>
          <p className="text-slate-400 font-bold mt-4 text-lg">Thầy hãy chọn tệp .pdf hoặc .docx, Lumina AI sẽ lo phần KaTeX!</p>
          <input ref={fileRef} type="file" hidden accept=".pdf,.docx" onChange={handleFileUpload} />
        </div>
      ) : (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-1000">
           <div className="flex justify-between items-center bg-slate-900 p-10 rounded-[3.5rem] border border-white/10 shadow-2xl">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Zap size={32} /></div>
                 <div>
                    <h4 className="font-black text-3xl text-white tracking-tighter italic">{parsedExam.title}</h4>
                    <p className="text-indigo-400 font-bold uppercase tracking-widest text-[10px] mt-1">Lumina AI Drafting Phase</p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setParsedExam(null)} className="px-8 py-4 bg-white/5 text-slate-400 rounded-2xl font-black text-xs uppercase hover:text-rose-500 transition-all">Hủy bỏ</button>
                 <button onClick={saveToCloud} className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-indigo-50 active:scale-95 transition-all">LƯU ĐỀ VĨNH VIỄN</button>
              </div>
           </div>
           
           <div className="grid grid-cols-1 gap-8">
              {parsedExam.questions.map((q: any, i: number) => (
                <div key={i} className="bg-slate-900 p-12 rounded-[4rem] border border-white/5 shadow-sm relative group hover:border-indigo-500/20 transition-all">
                   <span className="w-12 h-12 bg-white text-slate-900 rounded-xl flex items-center justify-center font-black text-xl mb-10 shadow-lg">#{i+1}</span>
                   <MathPreview content={q.text} className="text-2xl font-bold text-slate-100 leading-relaxed mb-12" />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(q.options || []).map((opt: string, idx: number) => (
                        <div key={idx} className={`p-6 rounded-2xl border-2 transition-all flex items-center gap-5 ${q.correctAnswer === String.fromCharCode(65+idx) ? 'border-emerald-500 bg-emerald-500/10 text-white' : 'border-white/5 bg-white/5 text-slate-400'}`}>
                           <span className="font-black text-indigo-500 text-xl">{String.fromCharCode(65+idx)}.</span>
                           <MathPreview content={opt} className="font-bold" />
                        </div>
                      ))}
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {parsingAI && (
        <div className="fixed inset-0 bg-[#020617]/95 backdrop-blur-3xl z-[100] flex items-center justify-center">
           <div className="text-center space-y-12 max-w-lg px-8">
              <div className="relative">
                 <div className="w-48 h-48 border-[12px] border-white/5 border-t-indigo-500 rounded-full animate-spin mx-auto shadow-[0_0_80px_rgba(79,70,229,0.2)]"></div>
                 <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" size={64} />
              </div>
              <div>
                <p className="text-white font-black text-5xl tracking-tighter italic mb-4">Lumina AI 4.0</p>
                <p className="text-indigo-400 font-bold uppercase tracking-[0.5em] animate-pulse">Đang trích xuất đề Toán học...</p>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed italic">Thầy hãy chờ trong giây lát, AI đang chuyển đổi các ký tự toán học sang LaTeX chuẩn.</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default ImportExamFromFile;
