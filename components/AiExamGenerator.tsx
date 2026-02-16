import React, { useState, useRef } from "react";
import { Upload, Sparkles, Loader2, Save, X, Trash2, ClipboardPaste } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import MathPreview from "./MathPreview";
import { geminiService } from "../services/geminiService";
import { supabase } from "../supabase";

const AiExamGenerator: React.FC<{ userId: string, onGenerate: any }> = ({ userId, onGenerate }) => {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewExam, setPreviewExam] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async (text: string) => {
    setLoading(true);
    try {
      const data = await geminiService.parseExamWithAI(text);
      if (data) setPreviewExam(data);
    } catch (err) { alert("AI bận, Thầy thử lại nhé!"); }
    finally { setLoading(false); }
  };

  const saveToCloud = async () => {
    if (!previewExam) return;
    setLoading(true);
    const newExam = {
      title: previewExam.title,
      teacher_id: userId,
      questions: previewExam.questions,
      created_at: new Date().toISOString()
    };
    const { error } = await (supabase.from('exams').insert(newExam) as any);
    if (!error) {
      alert("Đã lưu đề vĩnh viễn!");
      setPreviewExam(null);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
        <h3 className="text-2xl font-black italic mb-6">AI Exam Engine v6.0</h3>
        <textarea value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full p-6 bg-slate-50 rounded-2xl min-h-[150px] outline-none border-none shadow-inner" placeholder="Dán nội dung đề thô tại đây..." />
        <div className="flex gap-4 mt-4 justify-end">
          <button onClick={() => setTopic("")} className="p-4 text-rose-500 hover:bg-rose-50 rounded-xl"><Trash2 size={20}/></button>
          <button onClick={() => handleGenerate(topic)} disabled={loading} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} TRÍCH XUẤT ĐỀ
          </button>
        </div>
      </div>
      {previewExam && (
        <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-t-4 border-indigo-600 animate-in slide-in-from-bottom-10">
          <div className="flex justify-between mb-8">
            <h4 className="text-xl font-black uppercase italic text-indigo-900">{previewExam.title}</h4>
            <button onClick={saveToCloud} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2"><Save size={18}/> LƯU CLOUD</button>
          </div>
          <div className="space-y-6">
            {previewExam.questions.map((q: any, i: number) => (
              <div key={i} className="p-6 bg-slate-50 rounded-2xl relative group">
                <MathPreview content={`${i+1}. ${q.text}`} className="font-bold text-slate-800 mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  {q.options.map((opt: string, idx: number) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-slate-100 text-sm">
                      <span className="font-black text-indigo-600 mr-2">{String.fromCharCode(65+idx)}.</span>
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
