import React, { useState, useEffect } from "react";
import { 
  Trash2, ClipboardPaste, Save, Plus, CheckCircle2, 
  Loader2, Sparkles, X, ChevronRight, LayoutGrid, Info,
  PlusCircle, RefreshCcw, Type
} from "lucide-react";
import { supabase } from "../supabase";
import MathPreview from "./MathPreview";
import { useToast } from "./Toast";
import { motion, AnimatePresence } from "framer-motion";
import { OnlineExam, Question } from "../types";

// Khắc phục lỗi Build Vercel cho Framer Motion
const MotionDiv = motion.div as any;

interface Props {
  exam: OnlineExam;
  onSave?: (exam: OnlineExam) => void;
  onCancel?: () => void;
}

const ExamEditor: React.FC<Props> = ({ exam, onSave, onCancel }) => {
  const { showToast } = useToast();
  const [data, setData] = useState<OnlineExam>({ ...exam });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const updateQuestion = (idx: number, updates: Partial<Question>) => {
    const newQs = [...(data.questions || [])];
    newQs[idx] = { ...newQs[idx], ...updates };
    setData({ ...data, questions: newQs });
  };

  const handlePaste = async (idx: number, field: 'text' | number) => {
    try {
      const text = await navigator.clipboard.readText();
      if (field === 'text') {
        updateQuestion(idx, { text });
      } else {
        const newOptions = [...(data.questions[idx].options || [])];
        newOptions[field] = text;
        updateQuestion(idx, { options: newOptions });
      }
      showToast("Đã dán nội dung thành công!", "success");
    } catch (err) {
      showToast("Không thể truy cập bộ nhớ tạm!", "error");
    }
  };

  const addQuestion = () => {
    const newQ: Question = {
      id: `q_${Date.now()}`,
      text: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: ""
    };
    setData({ ...data, questions: [...(data.questions || []), newQ] });
  };

  const removeQuestion = (idx: number) => {
    if (confirm("Thầy Nhẫn muốn xóa câu hỏi này vĩnh viễn?")) {
      const newQs = data.questions.filter((_, i) => i !== idx);
      setData({ ...data, questions: newQs });
    }
  };

  const handleSaveVinhVien = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase.from('exams') as any)
        .upsert({ 
          ...data, 
          updated_at: new Date().toISOString(),
          teacher_id: "huynhvannhan@gmail.com" // Email định danh của Thầy
        });

      if (error) throw error;
      showToast("Đã lưu đề thi vĩnh viễn lên Supabase!", "success");
      if (onSave) onSave(data);
    } catch (err) {
      showToast("Lỗi đồng bộ dữ liệu Cloud.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Thanh công cụ cố định */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
            <X size={24} className="text-slate-400" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter leading-none">
              Trình soạn đề Elite v6.0
            </h2>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Đang chỉnh sửa: {data.title}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSaveVinhVien}
            disabled={saving}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl flex items-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
            Lưu vĩnh viễn
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-12 px-6 space-y-8">
        {/* Thông tin chung */}
        <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Tiêu đề đề thi</label>
              <input 
                value={data.title}
                onChange={(e) => setData({...data, title: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-[1.5rem] px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 transition-all"
              />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Thời gian (Phút)</label>
              <input 
                type="number"
                value={data.duration}
                onChange={(e) => setData({...data, duration: parseInt(e.target.value)})}
                className="w-full bg-slate-50 border-none rounded-[1.5rem] px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 transition-all"
              />
           </div>
        </section>

        {/* Danh sách câu hỏi */}
        <AnimatePresence>
          {data.questions.map((q, idx) => (
            <MotionDiv
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 relative group"
            >
              <div className="flex justify-between items-start mb-8">
                <span className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black italic">
                  #{idx + 1}
                </span>
                <button 
                  onClick={() => removeQuestion(idx)}
                  className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              {/* Nội dung câu hỏi */}
              <div className="space-y-4 mb-10">
                <div className="relative group/input">
                  <textarea
                    value={q.text}
                    onChange={(e) => updateQuestion(idx, { text: e.target.value })}
                    placeholder="Nhập câu hỏi (Hỗ trợ LaTeX: $...$)"
                    className="w-full bg-slate-50 border-none rounded-[2rem] p-8 font-bold text-slate-700 min-h-[120px] focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                  <button 
                    onClick={() => handlePaste(idx, 'text')}
                    className="absolute right-4 top-4 p-3 bg-white text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm opacity-0 group-hover/input:opacity-100 transition-all"
                  >
                    <ClipboardPaste size={18} />
                  </button>
                </div>
                <div className="px-8 py-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                   <MathPreview content={q.text || "Xem trước công thức toán học tại đây..."} className="text-sm font-medium text-indigo-900" />
                </div>
              </div>

              {/* Lựa chọn đáp án */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="relative group/opt">
                    <div className={`flex items-center gap-4 p-2 rounded-[1.5rem] border-2 transition-all ${q.correctAnswer === oIdx ? 'border-emerald-500 bg-emerald-50' : 'border-slate-50 bg-slate-50'}`}>
                      <button 
                        onClick={() => updateQuestion(idx, { correctAnswer: oIdx })}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${q.correctAnswer === oIdx ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300'}`}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </button>
                      <input 
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...q.options];
                          newOpts[oIdx] = e.target.value;
                          updateQuestion(idx, { options: newOpts });
                        }}
                        className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-slate-600 text-sm"
                        placeholder={`Đáp án ${String.fromCharCode(65 + oIdx)}`}
                      />
                      <button 
                        onClick={() => handlePaste(idx, oIdx)}
                        className="p-2 text-slate-300 hover:text-indigo-600"
                      >
                        <ClipboardPaste size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </MotionDiv>
          ))}
        </AnimatePresence>

        <button
          onClick={addQuestion}
          className="w-full py-12 border-4 border-dashed border-slate-200 rounded-[3rem] text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-white transition-all font-black flex flex-col items-center justify-center gap-4"
        >
          <div className="p-4 bg-slate-100 rounded-2xl group-hover:bg-indigo-600 transition-all">
            <Plus size={32} />
          </div>
          <span className="uppercase tracking-[0.2em] text-xs">Thêm câu hỏi mới</span>
        </button>
      </div>
    </div>
  );
};

export default ExamEditor;
