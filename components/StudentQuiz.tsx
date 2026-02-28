import React, { useState, useEffect } from 'react';
import { 
  Clock, AlertTriangle, Send, ChevronLeft, ChevronRight, 
  Menu, X, ClipboardPaste, Trash2
} from 'lucide-react';
import { Exam, Question, User } from '../types';
import MathPreview from './MathPreview';
import { useToast } from './Toast';
import { quizService } from '../services/quizService';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  exam: Exam;
  user: User;
  onClose: () => void;
}

const StudentQuiz: React.FC<Props> = ({ exam, user, onClose }) => {
  const { showToast } = useToast();
  
  // --- STATE ---
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState((exam as any).duration ? (exam as any).duration * 60 : 60 * 60); 
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 🚀 STATE MỚI: Cờ báo hiệu hết giờ để chống lỗi Closure
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  // --- INIT ---
  useEffect(() => {
    try {
      if (exam.raw_content) {
        const parsed = JSON.parse(exam.raw_content);
        if (Array.isArray(parsed)) setQuestions(parsed);
      }
    } catch (e) {
      console.error("Error parsing questions", e);
      showToast("Lỗi tải đề thi. Vui lòng báo giáo viên.", "error");
    }

    const storageKey = `quiz_draft_${exam.id}_${user.id}`;
    const savedAnswers = localStorage.getItem(storageKey);
    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers));
      showToast("Đã khôi phục bài làm trước đó!", "info");
    }
  }, [exam, user, showToast]);

  // --- TIMER ---
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimeUp(true); // 🚀 Bật cờ hết giờ thay vì gọi handleSubmit trực tiếp
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- AUTO SUBMIT KHI HẾT GIỜ ---
  // 🚀 Effect này luôn nhìn thấy state "answers" và "questions" mới nhất
  useEffect(() => {
    if (isTimeUp && !isSubmitting) {
      handleSubmit(true);
    }
  }, [isTimeUp]); // Chỉ chạy khi isTimeUp chuyển sang true

  // --- AUTO SAVE ---
  useEffect(() => {
    const storageKey = `quiz_draft_${exam.id}_${user.id}`;
    localStorage.setItem(storageKey, JSON.stringify(answers));
  }, [answers, exam.id, user.id]);

  // --- HANDLERS ---
  const handleSelectAnswer = (qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleClearAnswer = (qId: string) => {
    const newAnswers = { ...answers };
    delete newAnswers[qId];
    setAnswers(newAnswers);
    showToast("Đã xóa câu trả lời", "info");
  };

  const handlePaste = async (qId: string) => {
    try {
      const text = await navigator.clipboard.readText();
      const currentAnswer = answers[qId] || "";
      handleSelectAnswer(qId, currentAnswer + text);
      showToast("Đã dán nội dung", "success");
    } catch(e) { 
      showToast("Vui lòng cấp quyền Clipboard hoặc dùng phím Ctrl+V", "warning"); 
    }
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !window.confirm("Bạn chắc chắn muốn nộp bài? Hành động này không thể hoàn tác.")) return;

    setIsSubmitting(true);
    try {
      const score = quizService.gradeExam(questions, answers);
      
      const payload: any = {
        exam_id: exam.id,
        student_id: user.id,
        answers: answers,
        score: score,
      };
      
      if ((user as any).class_id) {
        payload.class_id = (user as any).class_id;
      }

      await quizService.submitExam(payload);

      localStorage.removeItem(`quiz_draft_${exam.id}_${user.id}`);
      showToast(autoSubmit ? "Hết giờ! Đã tự động nộp bài." : "Nộp bài thành công!", "success");
      onClose(); 

    } catch (err) {
      console.error(err);
      showToast("Lỗi nộp bài. Dữ liệu vẫn được lưu nháp trên máy của bạn.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (questions.length === 0) return <div className="p-10 text-center font-medium text-slate-600">Đang tải cấu trúc đề thi...</div>;

  const currentQ = questions[currentQIndex];
  const progress = Math.round((Object.keys(answers).length / questions.length) * 100);

  // ... (Giữ nguyên toàn bộ phần return giao diện của bạn ở dưới, không cần thay đổi gì cả)
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col h-screen w-screen overflow-hidden font-sans">
      {/* HEADER */}
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm h-16 shrink-0 z-20">
        <div className="flex items-center gap-3">
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-full lg:hidden transition-colors">
             <Menu size={20} className="text-slate-600"/>
           </button>
           <h2 className="font-bold text-slate-800 line-clamp-1 max-w-[200px] md:max-w-md">{exam.title}</h2>
        </div>

        <div className="flex items-center gap-4">
           {/* Timer */}
           <div className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-mono font-bold text-lg transition-colors ${timeLeft < 300 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
              <Clock size={18}/> {formatTime(timeLeft)}
           </div>
           
           <button 
             onClick={() => handleSubmit(false)}
             disabled={isSubmitting}
             className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-70"
           >
             {isSubmitting ? "Đang xử lý..." : "Nộp Bài"} <Send size={16}/>
           </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* SIDEBAR (Danh sách câu hỏi) */}
        <AnimatePresence>
          {(isSidebarOpen || window.innerWidth >= 1024) && (
            <motion.div 
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`absolute lg:static top-0 left-0 h-full w-72 bg-white border-r border-slate-200 z-10 flex flex-col shadow-2xl lg:shadow-none`}
            >
              <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                 <span className="font-bold text-xs uppercase text-slate-500">Tiến độ: {Object.keys(answers).length}/{questions.length}</span>
                 <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 hover:bg-slate-200 rounded-full"><X size={18}/></button>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1 grid grid-cols-5 gap-2 content-start">
                 {questions.map((q, idx) => {
                   const isAnswered = !!answers[q.id];
                   const isActive = idx === currentQIndex;
                   return (
                     <button
                       key={q.id}
                       onClick={() => { setCurrentQIndex(idx); if(window.innerWidth < 1024) setSidebarOpen(false); }}
                       className={`h-11 w-11 rounded-xl text-sm font-bold flex items-center justify-center transition-all shadow-sm hover:scale-105 active:scale-95
                         ${isActive ? 'bg-indigo-600 text-white ring-4 ring-indigo-600/20' : 
                           isAnswered ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-400' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300'}`}
                     >
                       {idx + 1}
                     </button>
                   )
                 })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN CONTENT (Khu vực làm bài) */}
        <div className="flex-1 flex flex-col bg-slate-50/80 overflow-hidden relative">
           
           {/* ProgressBar */}
           <div className="h-1.5 bg-slate-200 w-full">
              <div className="h-full bg-indigo-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
           </div>

           <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <motion.div 
                key={currentQIndex}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[450px] flex flex-col"
              >
                 
                 {/* Question Content */}
                 <div className="p-6 md:p-8 border-b border-slate-100 flex-1">
                    <div className="flex justify-between items-start mb-6">
                       <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider border border-indigo-100">
                          Câu hỏi {currentQIndex + 1}
                       </span>
                       <span className="text-sm font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                          {currentQ.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'} • {currentQ.points || 1} điểm
                       </span>
                    </div>
                    
                    <div className="text-lg text-slate-800 leading-relaxed font-medium">
                       <MathPreview content={currentQ.content} />
                    </div>
                 </div>

                 {/* Options / Answer Input */}
                 <div className="p-6 md:p-8 bg-slate-50/50 rounded-b-2xl">
                    {currentQ.type === 'multiple_choice' ? (
                       <div className="grid grid-cols-1 gap-4">
                          {currentQ.options?.map((opt, i) => {
                             const label = ['A','B','C','D'][i];
                             const isSelected = answers[currentQ.id] === label;
                             return (
                                <div 
                                  key={i}
                                  onClick={() => handleSelectAnswer(currentQ.id, label)}
                                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 group hover:shadow-md
                                     ${isSelected ? 'bg-indigo-50/50 border-indigo-500 shadow-sm' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                                >
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold transition-all shrink-0 shadow-sm
                                      ${isSelected ? 'bg-indigo-600 text-white scale-105' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                                      {label}
                                   </div>
                                   <div className="pt-2 text-slate-700 font-medium">
                                      <MathPreview content={opt} />
                                   </div>
                                </div>
                             )
                          })}
                       </div>
                    ) : (
                       <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">Bài làm của bạn:</p>
                            <button 
                              onClick={() => handlePaste(currentQ.id)}
                              className="text-sm bg-white border border-slate-200 shadow-sm hover:border-indigo-300 text-indigo-600 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all active:scale-95"
                            >
                               <ClipboardPaste size={16}/> Dán (Ctrl+V)
                            </button>
                          </div>
                          <textarea
                             value={answers[currentQ.id] || ""}
                             onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                             placeholder="Nhập câu trả lời của bạn vào đây..."
                             className="w-full h-48 p-5 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none transition-all text-slate-700 text-lg"
                          />
                       </div>
                    )}
                 </div>

                 <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end items-center rounded-b-2xl">
                    <button 
                      onClick={() => handleClearAnswer(currentQ.id)}
                      disabled={!answers[currentQ.id]}
                      className="text-slate-400 hover:text-rose-500 disabled:opacity-0 disabled:pointer-events-none text-sm font-bold flex items-center gap-1.5 transition-colors px-3 py-1.5 hover:bg-rose-50 rounded-lg"
                      title="Xóa câu trả lời này"
                    >
                       <Trash2 size={16}/> Xóa chọn
                    </button>
                 </div>
              </motion.div>
           </div>

           {/* Navigation Buttons */}
           <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-between items-center z-10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
              <button 
                onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))}
                disabled={currentQIndex === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <ChevronLeft size={20}/> Câu trước
              </button>

              <div className="hidden md:flex items-center gap-2 text-slate-500 font-bold bg-slate-100 px-4 py-2 rounded-xl">
                 <span className="text-indigo-600">{currentQIndex + 1}</span> / {questions.length}
              </div>

              <button 
                onClick={() => setCurrentQIndex(Math.min(questions.length - 1, currentQIndex + 1))}
                disabled={currentQIndex === questions.length - 1}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-slate-800 text-white hover:bg-indigo-600 disabled:opacity-40 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                Câu tiếp <ChevronRight size={20}/>
              </button>
           </div>

        </div>
      </div>
    </div>
  );
};

export default StudentQuiz;
