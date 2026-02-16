import React, { useState, useEffect } from "react";
import { 
  Trash2, ClipboardPaste, Save, Plus, CheckCircle2, 
  Loader2, Sparkles, X, ChevronRight, LayoutGrid, Info,
  PlusCircle, RefreshCcw, Type, Trash
} from "lucide-react";
import { supabase } from "../supabase";
import MathPreview from "./MathPreview";
import { useToast } from "./Toast";
import { motion, AnimatePresence } from "framer-motion";
import { Exam, Question, QuestionType } from "../types";

const MotionDiv = motion.div as any;

interface Props {
  exam: Exam;
  onSave?: (exam: Exam) => void;
  onCancel?: () => void;
}

const ExamEditor: React.FC<Props> = ({ exam, onSave, onCancel }) => {
  const { showToast } = useToast();
  const [data, setData] = useState<Exam>({ ...exam });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const updateQuestion = (idx: number, updates: Partial<Question>) => {
    const newQs = [...(data.questions || [])];
    newQs[idx] = { ...newQs[idx], ...updates };
    setData({ ...data, questions: newQs, updatedAt: new Date().toISOString() });
  };

  const removeQuestion = (idx: number) => {
    const newQs = data.questions.filter((_, i) => i !== idx);
    setData({ ...data, questions: newQs });
    showToast("Đã xóa câu hỏi", "info");
  };

  const handlePaste = async (idx: number, field: 'content' | number) => {
    try {
      const text = await navigator.clipboard.readText();
      if (field === 'content') {
        updateQuestion(idx, { content: text });
      } else {
        const newOpts = [...data.questions[idx].options];
        newOpts[field] = text;
        updateQuestion(idx, { options: newOpts });
      }
      showToast("Đã dán nội dung!", "success");
    } catch (err) {
      showToast("Không thể truy cập Clipboard", "error");
    }
  };

  const handleSaveToCloud = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('exams')
        .upsert({
          ...data,
          updatedAt: new Date().toISOString()
        });

      if (error) throw error;
      showToast("Đã lưu đề thi vĩnh viễn lên Cloud!", "success");
      if (onSave) onSave(data);
    } catch (err: any) {
      showToast(err.message || "Lỗi lưu dữ liệu", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-40 px-4">
      {/* Header Soạn Thảo */}
      <div className="flex justify-between items-center mb-12 bg-white/80 backdrop-blur-md p-6 rounded-[2rem] sticky top-4 z-50 shadow-xl border border-indigo-50">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-3 hover:bg-slate-100 rounded-full transition-all">
            <X size={24} />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Biên tập đề thi</h2>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Tự động đồng bộ Supabase</p>
          </div>
        </div>
        <button 
          onClick={handleSaveToCloud}
          disabled={saving}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          LƯU VĨNH VIỄN
        </button>
      </div>

      <div className="space-y-8">
        <AnimatePresence>
          {data.questions.map((q, idx) => (
            <MotionDiv
              key={q.id || idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 group relative"
            >
              {/* Nút Xóa Câu Hỏi */}
              <button 
                onClick={() => removeQuestion(idx)}
                className="absolute -right-4 -top-4 p-4 bg-rose-50 text-rose-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-rose-500 hover:text-white"
              >
                <Trash2 size={20} />
              </button>

              <div className="flex items-start gap-6 mb-8">
                <span className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg">
                  {idx + 1}
                </span>
                <div className="flex-1 space-y-4">
                  <div className="relative">
                    <textarea
                      value={q.content}
                      onChange={(e) => updateQuestion(idx, { content: e.target.value })}
                      placeholder="Nhập nội dung câu hỏi (hỗ trợ LaTeX $...$)"
                      className="w-full p-6 bg-slate-50 border-none rounded-[2rem] font-bold text-slate-700 min-h-[120px] focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    />
                    <button 
                      onClick={() => handlePaste(idx, 'content')}
                      className="absolute right-4 bottom-4 p-3 bg-white text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm transition-all"
                      title="Dán từ Clipboard (Ctrl+V)"
                    >
                      <ClipboardPaste size={18} />
                    </button>
                  </div>
                  
                  {/* Preview công thức Toán */}
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                    <p className="text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-widest">Xem trước công thức:</p>
                    <MathPreview content={q.content || "*Chưa có nội dung*"} className="text-slate-800" />
                  </div>
                </div>
              </div>

              {/* Danh sách Đáp án */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-3">
                    <button 
                      onClick={() => updateQuestion(idx, { correctAnswer: oIdx })}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${
                        q.correctAnswer === oIdx ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}
                    </button>
                    <div className="flex-1 relative flex items-center">
                      <input
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...q.options];
                          newOpts[oIdx] = e.target.value;
                          updateQuestion(idx, { options: newOpts });
                        }}
                        className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-sm focus:ring-2 focus:ring-indigo-200"
                        placeholder={`Đáp án ${String.fromCharCode(65 + oIdx)}...`}
                      />
                      <button 
                        onClick={() => handlePaste(idx, oIdx)}
                        className="absolute right-2 p-2 text-slate-300 hover:text-indigo-600"
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
          onClick={() => {
            const newQ: Question = { 
              id: `q_${Date.now()}`, 
              type: QuestionType.MCQ,
              content: "", 
              options: ["", "", "", ""], 
              correctAnswer: 0,
              points: 0.25
            };
            setData({...data, questions: [...data.questions, newQ]});
          }}
          className="w-full py-12 border-4 border-dashed border-slate-200 rounded-[3rem] text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-white transition-all font-black flex flex-col items-center justify-center gap-4 group"
        >
          <div className="p-4 bg-slate-100 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
            <Plus size={32} />
          </div>
          <span className="uppercase tracking-[0.3em] text-xs">Thêm câu hỏi mới</span>
        </button>
      </div>
    </div>
  );
};

export default ExamEditor;
