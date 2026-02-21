import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, 
  Check, Loader2, Layout, Eye, EyeOff, Settings 
} from 'lucide-react';
import { supabase } from '../supabase';
import { Exam, User } from '../types';
import MathPreview from './MathPreview';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  user: User;
  exam: Exam | null;
  onClose: () => void;
}

// Đổi tên thành EditorQuestion để không đụng độ với type Question trong types.ts
interface EditorQuestion {
  id: string;
  text: string;
  options: string[]; 
  answer: string;    
  type: 'multiple_choice' | 'essay';
  score: number;
}

const ExamEditor: React.FC<Props> = ({ user, exam, onClose }) => {
  const { showToast } = useToast();
  
  // --- STATE MANAGEMENT ---
  const [title, setTitle] = useState(exam?.title || "Đề thi mới");
  const [questions, setQuestions] = useState<EditorQuestion[]>(() => {
    // Ép kiểu an toàn từ database
    return Array.isArray(exam?.questions) ? (exam?.questions as EditorQuestion[]) : [];
  });
  const [saving, setSaving] = useState(false);
  const [activeQId, setActiveQId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  // Auto Select câu hỏi đầu tiên khi mở
  useEffect(() => {
    if (questions.length > 0 && !activeQId) {
      setActiveQId(questions[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- CORE FUNCTIONS ---

  // 1. Lưu đề thi (Upsert)
  const handleSave = async () => {
    if (!title.trim()) return showToast("Vui lòng nhập tên đề thi!", "error");
    if (questions.length === 0) return showToast("Đề thi cần ít nhất 1 câu hỏi!", "warning");

    setSaving(true);
    try {
      const payload = {
        title,
        questions, 
        updated_at: new Date().toISOString(),
        teacher_id: user.id, // Sửa lại thành teacher_id cho khớp types.ts
        is_locked: true,
      };

      let error;
      if (exam?.id) {
        const res = await supabase.from('exams').update(payload).eq('id', exam.id);
        error = res.error;
      } else {
        const res = await supabase.from('exams').insert(payload);
        error = res.error;
      }

      if (error) throw error;
      showToast("Đã lưu đề thi thành công!", "success");
      
      if (!exam?.id) onClose(); 

    } catch (err) {
      console.error(err);
      showToast("Lỗi khi lưu dữ liệu. Vui lòng thử lại.", "error");
    } finally {
      setSaving(false);
    }
  };

  // 2. Thêm câu hỏi mới
  const addQuestion = () => {
    const newId = crypto.randomUUID();
    const newQ: EditorQuestion = {
      id: newId,
      text: "",
      type: 'multiple_choice',
      options: ["", "", "", ""],
      answer: "A",
      score: 1
    };
    setQuestions([...questions, newQ]);
    setActiveQId(newId);
    
    setTimeout(() => {
        const el = document.getElementById(`q-${newId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // 3. Xóa câu hỏi
  const deleteQuestion = (id: string) => {
    if (questions.length <= 1 && !window.confirm("Xóa câu hỏi cuối cùng?")) return;
    setQuestions(questions.filter(q => q.id !== id));
    if (activeQId === id) setActiveQId(null);
  };

  // 4. Update dữ liệu câu hỏi (Dùng Generics K để loại bỏ lỗi 'any')
  const updateQuestion = <K extends keyof EditorQuestion>(id: string, field: K, value: EditorQuestion[K]) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  // 5. Update nội dung đáp án (Options)
  const updateOption = (qId: string, index: number, val: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      const newOpts = [...q.options];
      newOpts[index] = val;
      return { ...q, options: newOpts };
    }));
  };

  // --- SMART PASTE IMAGE (CTRL + V) ---
  const handlePaste = async (e: React.ClipboardEvent, qId: string) => {
    // Chuyển DataTransferItemList thành Array để tránh lỗi iterability của TypeScript
    const items = Array.from(e.clipboardData.items);
    
    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;

        showToast("Đang tải ảnh lên...", "info");
        
        try {
          const fileName = `questions/${user.id}/${Date.now()}.png`;
          const { error: uploadError } = await supabase.storage
            .from('exam_assets')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('exam_assets')
            .getPublicUrl(fileName);

          const qIndex = questions.findIndex(q => q.id === qId);
          if (qIndex === -1) return;
          
          const currentText = questions[qIndex].text;
          const newText = `${currentText}\n\n![Minh họa](${publicUrl})\n`;
          
          updateQuestion(qId, 'text', newText);
          showToast("Đã dán ảnh thành công!", "success");

        } catch (err) {
          console.error(err);
          showToast("Lỗi upload ảnh. Kiểm tra lại Storage.", "error");
        }
      }
    }
  };

  // --- RENDER ---
  const activeQuestion = questions.find(q => q.id === activeQId);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col h-screen w-screen overflow-hidden font-sans">
      {/* 1. HEADER TOOLBAR */}
      <div className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm shrink-0 h-16">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20}/>
          </button>
          <div className="flex-1 max-w-2xl">
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-black text-slate-800 outline-none w-full bg-transparent placeholder-slate-300"
              placeholder="Nhập tên đề thi..."
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="text-xs font-medium text-slate-400 mr-2">
             {questions.length} câu hỏi • Tổng điểm: {questions.length}
           </div>
           
           <button 
             onClick={() => setShowPreview(!showPreview)}
             className={`p-2 rounded-xl transition-all ${showPreview ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}
             title="Bật/Tắt chế độ xem trước"
           >
             {showPreview ? <Layout size={20}/> : <EyeOff size={20}/>}
           </button>

           <button 
             onClick={handleSave} 
             disabled={saving}
             className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
           >
             {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
             Lưu Đề
           </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* A. SIDEBAR LIST (Danh sách câu hỏi) */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
           <div className="p-4 overflow-y-auto flex-1 space-y-2 custom-scrollbar">
              {questions.map((q, idx) => (
                <div 
                  key={q.id}
                  id={`q-${q.id}`}
                  onClick={() => setActiveQId(q.id)}
                  className={`p-3 rounded-xl cursor-pointer border transition-all relative group
                    ${activeQId === q.id 
                      ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                      : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'}`}
                >
                   <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${activeQId === q.id ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                        Câu {idx + 1}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteQuestion(q.id); }}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity"
                      >
                        <Trash2 size={14}/>
                      </button>
                   </div>
                   <p className="text-xs text-slate-500 line-clamp-2 font-medium">
                     {q.text || "Chưa có nội dung..."}
                   </p>
                </div>
              ))}
              
              <button 
                onClick={addQuestion}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold hover:border-indigo-400 hover:text-indigo-500 transition-all flex justify-center items-center gap-2 text-sm mt-4"
              >
                <Plus size={16}/> Thêm câu
              </button>
           </div>
        </div>

        {/* B. EDITOR AREA (Khu vực soạn thảo chính) */}
        <div className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden">
           {activeQuestion ? (
             <div className="flex h-full">
                {/* B1. INPUT COLUMN */}
                <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${showPreview ? 'w-1/2 border-r border-slate-200' : 'w-full'}`}>
                   <div className="p-6 overflow-y-auto h-full custom-scrollbar">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-700">Nội dung câu hỏi</h3>
                            <div className="flex gap-2">
                               <button 
                                 className="text-xs flex items-center gap-1 bg-slate-100 px-2 py-1 rounded hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                 title="Sử dụng LaTeX: $ công thức $"
                               >
                                 <code className="font-mono">LaTeX</code> hỗ trợ
                               </button>
                            </div>
                         </div>
                         
                         <textarea
                           value={activeQuestion.text}
                           onChange={(e) => updateQuestion(activeQuestion.id, 'text', e.target.value)}
                           onPaste={(e) => handlePaste(e, activeQuestion.id)}
                           placeholder="Nhập câu hỏi tại đây... (Dán ảnh bằng Ctrl+V)"
                           className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono text-sm leading-relaxed"
                         />
                         <p className="mt-2 text-xs text-slate-400 flex gap-2 items-center">
                           <ImageIcon size={12}/> Mẹo: Bạn có thể copy ảnh và nhấn Ctrl+V để dán trực tiếp vào đây.
                         </p>
                      </div>

                      {/* Options Editor */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                         <h3 className="font-bold text-slate-700 mb-4">Đáp án trắc nghiệm</h3>
                         <div className="space-y-3">
                           {activeQuestion.options.map((opt, i) => {
                             const label = ['A', 'B', 'C', 'D'][i];
                             const isCorrect = activeQuestion.answer === label;
                             return (
                               <div key={i} className="flex gap-3 items-start">
                                  <button
                                    onClick={() => updateQuestion(activeQuestion.id, 'answer', label)}
                                    className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center font-bold text-lg transition-all
                                      ${isCorrect ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                  >
                                    {label}
                                  </button>
                                  <div className="flex-1">
                                     <textarea
                                        value={opt}
                                        onChange={(e) => updateOption(activeQuestion.id, i, e.target.value)}
                                        placeholder={`Nội dung đáp án ${label}`}
                                        rows={2}
                                        className={`w-full p-3 rounded-xl border text-sm outline-none transition-all resize-none
                                          ${isCorrect ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-slate-50 focus:border-indigo-300'}`}
                                     />
                                  </div>
                               </div>
                             );
                           })}
                         </div>
                      </div>
                   </div>
                </div>

                {/* B2. PREVIEW COLUMN (Cột bên phải) */}
                <AnimatePresence>
                  {showPreview && (
                    <motion.div 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "50%", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="h-full bg-slate-100 overflow-y-auto border-l border-slate-200"
                    >
                       <div className="p-8 min-h-full flex flex-col items-center">
                          <div className="w-full max-w-2xl bg-white p-8 rounded shadow-sm min-h-[500px] border border-slate-200">
                             <div className="border-b border-slate-100 pb-4 mb-6">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Xem trước hiển thị</span>
                             </div>
                             
                             {/* Render Math Question */}
                             <div className="text-lg text-slate-800 mb-6 leading-relaxed">
                                <span className="font-bold text-indigo-600 mr-2">Câu {questions.findIndex(q => q.id === activeQId) + 1}.</span>
                                <MathPreview content={activeQuestion.text || "Nội dung câu hỏi sẽ hiện ở đây..."} />
                             </div>

                             {/* Render Math Options */}
                             <div className="grid grid-cols-1 gap-4">
                                {activeQuestion.options.map((opt, i) => (
                                  <div key={i} className="flex gap-3">
                                     <span className="font-bold text-slate-500 text-sm mt-1">{['A','B','C','D'][i]}.</span>
                                     <div className="text-slate-700 text-sm bg-slate-50 px-3 py-1 rounded border border-slate-100 w-full">
                                        <MathPreview content={opt || "..."} />
                                     </div>
                                  </div>
                                ))}
                             </div>
                          </div>
                          <p className="mt-4 text-xs text-slate-400">Đây là giao diện học sinh sẽ nhìn thấy khi làm bài.</p>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-slate-300">
                <Settings size={64} className="mb-4 text-slate-200"/>
                <p>Chọn câu hỏi để chỉnh sửa hoặc nhấn <strong className="text-slate-500">+ Thêm câu</strong></p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ExamEditor;
