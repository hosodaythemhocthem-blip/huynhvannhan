
import React, { useState } from "react";
import { Trash2, ClipboardPaste, Save, Plus, CheckCircle2, Loader2, Sparkles, X, ChevronRight, LayoutGrid } from "lucide-react";
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

  const updateQuestion = (idx: number, updates: Partial<Question>) => {
    const newQs = [...data.questions];
    newQs[idx] = { ...newQs[idx], ...updates };
    setData({ ...data, questions: newQs });
  };

  const handlePaste = async (idx: number, field: 'text' | number) => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      
      if (field === 'text') {
        updateQuestion(idx, { text: (data.questions[idx].text || "") + text });
      } else {
        const choices = [...(data.questions[idx].choices || [])];
        if (choices[field]) choices[field].content = text;
        updateQuestion(idx, { choices });
      }
      showToast("Đã dán nội dung từ Clipboard!", "success");
    } catch (e) { 
      showToast("Vui lòng cho phép quyền truy cập Clipboard hoặc dùng Ctrl+V.", "info"); 
    }
  };

  const deleteQuestion = (idx: number) => {
    if (confirm("Thầy có chắc chắn muốn xóa VĨNH VIỄN câu hỏi này?")) {
      const newQs = data.questions.filter((_, i) => i !== idx);
      setData({ ...data, questions: newQs });
      showToast("Đã xóa câu hỏi.", "info");
    }
  };

  const handleSaveToCloud = async () => {
    setSaving(true);
    try {
      await supabase.from('exams').upsert(data);
      showToast("Đã lưu trữ vĩnh viễn lên Supabase Cloud!", "success");
      onSave?.(data);
    } catch (err) {
      showToast("Lỗi đồng bộ dữ liệu.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-32 animate-in fade-in duration-700">
      <header className="flex justify-between items-center bg-slate-900/95 backdrop-blur-2xl p-8 rounded-[3.5rem] border border-white/10 sticky top-4 z-50 shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20">
             <Sparkles size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-tighter italic">NhanLMS Editor Pro</h3>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">Hệ thống soạn đề thông minh</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="px-8 py-4 text-slate-400 font-black hover:text-white transition-all uppercase text-xs">Thoát</button>
          <button onClick={handleSaveToCloud} disabled={saving} className="px-10 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black flex items-center gap-3 shadow-2xl hover:bg-indigo-500 transition-all active:scale-95">
            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />} LƯU ĐỀ VĨNH VIỄN
          </button>
        </div>
      </header>

      <div className="space-y-12">
        <AnimatePresence mode="popLayout">
          {data.questions.map((q, idx) => (
            <MotionDiv 
              layout key={q.id || idx}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, x: -20 }}
              className="bg-slate-900 border border-white/5 rounded-[4rem] p-10 md:p-14 shadow-2xl relative group hover:border-indigo-500/30 transition-all"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <span className="w-14 h-14 bg-white text-slate-900 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl">#{idx + 1}</span>
                  <div className="px-6 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-500/20">Trắc nghiệm</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handlePaste(idx, 'text')} className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Dán nhanh (Ctrl+V)"><ClipboardPaste size={20} /></button>
                  <button onClick={() => deleteQuestion(idx)} className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm" title="Xóa vĩnh viễn"><Trash2 size={20} /></button>
                </div>
              </div>

              <div className="space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nội dung câu hỏi</label>
                    <textarea
                      value={q.text}
                      onChange={(e) => updateQuestion(idx, { text: e.target.value })}
                      className="w-full p-8 bg-white/5 border-2 border-transparent focus:border-indigo-500 focus:bg-white/10 rounded-[2.5rem] font-bold text-white outline-none transition-all text-lg min-h-[220px] shadow-inner"
                      placeholder="Nhập đề bài... Sử dụng $...$ cho công thức Toán."
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-4">Xem trước LaTeX</label>
                    <div className="p-8 bg-indigo-500/5 rounded-[2.5rem] border border-indigo-500/20 border-dashed overflow-y-auto min-h-[220px] max-h-[400px]">
                       <MathPreview content={q.text || "*Chưa có nội dung*"} className="text-2xl text-slate-200 font-medium leading-relaxed" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                  {(q.choices || q.options || []).map((choice: any, oIdx: number) => {
                    const label = String.fromCharCode(65 + oIdx);
                    const content = typeof choice === 'string' ? choice : choice.content;
                    
                    return (
                      <div key={oIdx} className="relative group/opt">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-indigo-500 text-sm">{label}.</div>
                        <input
                          value={content}
                          onChange={(e) => {
                            const newChoices = [...(data.questions[idx].choices || [])];
                            if (newChoices[oIdx]) {
                              newChoices[oIdx].content = e.target.value;
                            } else {
                              // Khởi tạo nếu chưa có
                              if (!data.questions[idx].choices) data.questions[idx].choices = [{id:'a', label:'A', content:''}, {id:'b', label:'B', content:''}, {id:'c', label:'C', content:''}, {id:'d', label:'D', content:''}];
                              data.questions[idx].choices![oIdx].content = e.target.value;
                            }
                            updateQuestion(idx, { choices: data.questions[idx].choices });
                          }}
                          className={`w-full pl-14 pr-24 py-5 rounded-[1.8rem] border-2 transition-all font-bold text-base outline-none
                            ${q.correctAnswer === label ? 'border-emerald-500 bg-emerald-500/10 text-white' : 'border-white/5 bg-white/5 text-slate-300 focus:border-indigo-500'}`}
                          placeholder={`Lựa chọn ${label}`}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 items-center">
                          <button onClick={() => handlePaste(idx, oIdx)} className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"><ClipboardPaste size={18} /></button>
                          <button onClick={() => updateQuestion(idx, { correctAnswer: label })} className={`p-2 transition-all ${q.correctAnswer === label ? 'text-emerald-500 scale-125' : 'text-slate-600 hover:text-slate-400'}`}><CheckCircle2 size={22} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </MotionDiv>
          ))}
        </AnimatePresence>

        <button
          onClick={() => {
            const newQ: Question = { 
              id: `q_${Date.now()}`, 
              type: QuestionType.MCQ, 
              text: "", 
              choices: [
                {id:'a', label:'A', content:''},
                {id:'b', label:'B', content:''},
                {id:'c', label:'C', content:''},
                {id:'d', label:'D', content:''}
              ], 
              correctAnswer: "A", 
              points: 1 
            };
            setData({...data, questions: [...data.questions, newQ]});
          }}
          className="w-full py-20 border-4 border-dashed border-white/5 rounded-[4rem] text-slate-500 hover:text-indigo-500 hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all font-black flex flex-col items-center justify-center gap-6 group"
        >
           <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
              <Plus size={48} strokeWidth={3} />
           </div>
           <span className="text-2xl tracking-tighter uppercase italic">Thêm câu hỏi Toán học mới</span>
        </button>
      </div>
    </div>
  );
};

export default ExamEditor;
