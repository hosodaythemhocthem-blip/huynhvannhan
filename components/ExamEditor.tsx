import React, { useState, useEffect } from "react";
import { 
  Trash2, ClipboardPaste, Save, Plus, CheckCircle2, 
  Loader2, Sparkles, X, ChevronRight, LayoutGrid, Info 
} from "lucide-react";
import { supabase } from "../supabase";
import MathPreview from "./MathPreview";
import { useToast } from "./Toast";
import { motion, AnimatePresence } from "framer-motion";
import { Exam, Question } from "../types";

// Tránh lỗi JSX tag
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

  // Tự động cuộn lên đầu khi mở trình soạn thảo
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const updateQuestion = (idx: number, updates: Partial<Question>) => {
    const newQs = [...data.questions];
    newQs[idx] = { ...newQs[idx], ...updates };
    setData({ ...data, questions: newQs, updatedAt: new Date().toISOString() });
  };

  const handlePaste = async (idx: number, field: 'text' | number) => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      
      if (field === 'text') {
        updateQuestion(idx, { content: (data.questions[idx].content || "") + text });
      } else {
        const options = [...(data.questions[idx].options || [])];
        options[field] = text;
        updateQuestion(idx, { options });
      }
      showToast("Đã dán và đồng bộ dữ liệu!", "success");
    } catch (e) { 
      showToast("Hãy nhấn Ctrl+V trực tiếp vào ô nhập liệu.", "info"); 
    }
  };

  const deleteQuestion = (idx: number) => {
    if (confirm("Thầy có chắc chắn muốn xóa VĨNH VIỄN câu hỏi này khỏi Cloud?")) {
      const newQs = data.questions.filter((_, i) => i !== idx);
      setData({ ...data, questions: newQs });
      showToast("Đã xóa câu hỏi.", "info");
    }
  };

  const handleSaveToCloud = async () => {
    if (data.questions.length === 0) {
      showToast("Đề thi chưa có câu hỏi nào!", "error");
      return;
    }
    setSaving(true);
    try {
      // Sử dụng hàm upsert đã được sửa lỗi chaining ở supabase.ts
      await supabase.from('exams').upsert(data);
      showToast("Đã lưu trữ vĩnh viễn lên Cloud!", "success");
      onSave?.(data);
    } catch (err) {
      showToast("Lỗi đồng bộ. Thầy vui lòng kiểm tra kết nối.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-32">
      {/* Menu điều khiển Pro */}
      <header className="flex justify-between items-center bg-slate-900/95 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 sticky top-4 z-50 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
             <Sparkles size={24} />
          </div>
          <div className="hidden md:block">
            <h3 className="text-xl font-black text-white italic tracking-tight">NhanLMS <span className="text-indigo-500">Editor</span></h3>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Cấu hình Cloud v5.9</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="px-6 py-3 text-slate-400 font-bold hover:text-white transition-all text-xs uppercase">Hủy bỏ</button>
          <button 
            onClick={handleSaveToCloud} 
            disabled={saving} 
            className="px-8 py-4 bg-indigo-600 text-white rounded-[1.2rem] font-black flex items-center gap-3 shadow-xl hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
            <span className="hidden sm:inline">LƯU VĨNH VIỄN</span>
          </button>
        </div>
      </header>

      {/* Danh sách câu hỏi */}
      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {data.questions.map((q, idx) => (
            <MotionDiv 
              layout 
              key={q.id || idx}
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, x: -50 }}
              className="bg-slate-900 border border-white/5 rounded-[3.5rem] p-8 md:p-12 shadow-2xl relative group"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 bg-white text-slate-900 rounded-xl flex items-center justify-center font-black text-xl">
                    {idx + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Câu hỏi toán học</span>
                    <span className="text-xs text-slate-500 font-bold">Loại: Trắc nghiệm 4 lựa chọn</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => deleteQuestion(idx)} className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all" title="Xóa vĩnh viễn">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Khu vực nhập nội dung */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nội dung (Hỗ trợ Latex)</label>
                    <button onClick={() => handlePaste(idx, 'text')} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[10px] font-bold">
                      <ClipboardPaste size={14} /> DÁN NHANH
                    </button>
                  </div>
                  <textarea
                    value={q.content}
                    onChange={(e) => updateQuestion(idx, { content: e.target.value })}
                    className="w-full p-6 bg-white/5 border-2 border-transparent focus:border-indigo-500 rounded-[2rem] font-bold text-white outline-none transition-all text-base min-h-[180px] shadow-inner"
                    placeholder="VD: Cho hàm số $y=f(x)$ có đạo hàm..."
                  />
                </div>

                {/* Khu vực xem trước */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest px-4">Xem trước hiển thị</label>
                  <div className="p-6 bg-indigo-500/5 rounded-[2rem] border border-indigo-500/10 min-h-[180px] flex items-center justify-center text-center">
                    <MathPreview content={q.content || "*Chưa có nội dung câu hỏi*"} className="text-xl text-slate-300 font-medium" />
                  </div>
                </div>
              </div>

              {/* Đáp án */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/5">
                {q.options.map((option, oIdx) => {
                  const label = String.fromCharCode(65 + oIdx);
                  const isCorrect = q.correctAnswer === oIdx;
                  return (
                    <div key={oIdx} className="relative group/opt">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-indigo-500 text-xs">{label}.</div>
                      <input
                        value={option}
                        onChange={(e) => {
                          const newOpts = [...q.options];
                          newOpts[oIdx] = e.target.value;
                          updateQuestion(idx, { options: newOpts });
                        }}
                        className={`w-full pl-12 pr-12 py-4 rounded-[1.5rem] border-2 transition-all font-bold text-sm outline-none
                          ${isCorrect ? 'border-emerald-500/50 bg-emerald-500/10 text-white' : 'border-white/5 bg-white/5 text-slate-400 focus:border-indigo-500'}`}
                        placeholder={`Đáp án ${label}`}
                      />
                      <button 
                        onClick={() => updateQuestion(idx, { correctAnswer: oIdx })}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all
                          ${isCorrect ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-600 hover:text-indigo-400'}`}
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </MotionDiv>
          ))}
        </AnimatePresence>

        {/* Nút thêm câu hỏi siêu to */}
        <button
          onClick={() => {
            const newQ: Question = { 
              id: `q_${Date.now()}`, 
              content: "", 
              options: ["", "", "", ""], 
              correctAnswer: 0,
              explanation: ""
            };
            setData({...data, questions: [...data.questions, newQ]});
          }}
          className="w-full py-16 border-4 border-dashed border-white/5 rounded-[3rem] text-slate-500 hover:text-indigo-500 hover:bg-indigo-500/5 hover:border-indigo-500/20 transition-all font-black flex flex-col items-center justify-center gap-4 group"
        >
          <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <Plus size={32} />
          </div>
          <span className="text-lg uppercase tracking-widest italic">Thêm câu hỏi mới</span>
        </button>
      </div>
    </div>
  );
};

export default ExamEditor;
