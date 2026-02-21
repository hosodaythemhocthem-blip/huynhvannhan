import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Clock, CheckCircle, AlertTriangle, Save, ChevronLeft, ChevronRight, 
  Menu, X, Send 
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
  const [timeLeft, setTimeLeft] = useState(exam.duration ? exam.duration * 60 : 60 * 60); // Mặc định 60 phút nếu ko có duration
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- INIT ---
  useEffect(() => {
    // Parse câu hỏi từ exam.raw_content
    try {
      if (exam.raw_content) {
        const parsed = JSON.parse(exam.raw_content);
        if (Array.isArray(parsed)) setQuestions(parsed);
      }
    } catch (e) {
      console.error("Error parsing questions", e);
      showToast("Lỗi tải đề thi. Vui lòng báo giáo viên.", "error");
    }

    // Load bài làm nháp từ LocalStorage (Auto-restore)
    const savedAnswers = localStorage.getItem(`quiz_draft_${exam.id}_${user.id}`);
    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers));
      showToast("Đã khôi phục bài làm trước đó!", "info");
    }
  }, [exam, user]);

  // --- TIMER ---
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true); // Auto submit khi hết giờ
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- AUTO SAVE ---
  useEffect(() => {
    localStorage.setItem(`quiz_draft_${exam.id}_${user.id}`, JSON.stringify(answers));
  }, [answers, exam.id, user.id]);

  // --- HANDLERS ---
  const handleSelectAnswer = (qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleClearAnswer = (qId: string) => {
    const newAnswers = { ...answers };
    delete newAnswers[qId];
    setAnswers(newAnswers);
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !confirm("Bạn chắc chắn muốn nộp bài? Hành động này không thể hoàn tác.")) return;

    setIsSubmitting(true);
    try {
      // 1. Chấm điểm sơ bộ (Client side - chỉ tham khảo, Server nên chấm lại)
      const score = quizService.gradeExam(questions, answers);
      
      // 2. Gửi về Server
      await quizService.submitExam({
        exam_id: exam.id,
        student_id: user.id,
        answers: answers,
        score: score, // Lưu ý: thực tế nên để Backend tính score để bảo mật
        class_id: user.class_id // Nếu có
      });

      // 3. Cleanup
      localStorage.removeItem(`quiz_draft_${exam.id}_${user.id}`);
      showToast(autoSubmit ? "Hết giờ! Đã tự động nộp bài." : "Nộp bài thành công!", "success");
      onClose(); // Quay về dashboard

    } catch (err) {
      console.error(err);
      showToast("Lỗi nộp bài. Vui lòng thử lại hoặc chụp ảnh bài làm gửi giáo viên.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format thời gian MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentQIndex];
  const progress = Math.round((Object.keys(answers).length / questions.length) * 100);

  if (questions.length === 0) return <div className="p-10 text-center">Đang tải đề thi...</div>;

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col h-screen w-screen overflow-hidden">
      
      {/* HEADER */}
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm h-16 shrink-0 z-20">
        <div className="flex items-center gap-3">
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-full lg:hidden">
             <Menu size={20}/>
           </button>
           <h2 className="font-bold text-slate-800 line-clamp-1 max-w-[200px] md:max-w-md">{exam.title}</h2>
        </div>

        <div className="flex items-center gap-4">
           {/* Timer */}
           <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-lg ${timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
              <Clock size={18}/> {formatTime(timeLeft)}
           </div>
           
           <button 
             onClick={() => handleSubmit(false)}
             disabled={isSubmitting}
             className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
           >
             {isSubmitting ? "Đang nộp..." : "Nộp Bài"} <Send size={16}/>
           </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* SIDEBAR (Danh sách câu hỏi) */}
        <AnimatePresence>
          {(isSidebarOpen || window.innerWidth >= 1024) && (
            <motion.div 
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              className={`absolute lg:static top-0 left-0 h-full w-72 bg-white border-r border-slate-200 z-10 flex flex-col shadow-xl lg:shadow-none transition-all duration-300`}
            >
              <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                 <span className="font-bold text-xs uppercase text-slate-500">Tiến độ: {Object.keys(answers).length}/{questions.length}</span>
                 <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X size={18}/></button>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1 grid grid-cols-5 gap-2 content-start">
                 {questions.map((q, idx) => {
                   const isAnswered = !!answers[q.id];
                   const isActive = idx === currentQIndex;
                   return (
                     <button
                       key={q.id}
                       onClick={() => { setCurrentQIndex(idx); setSidebarOpen(false); }}
                       className={`h-10 w-10 rounded-lg text-sm font-bold flex items-center justify-center transition-all
                         ${isActive ? 'bg-indigo-600 text-white ring-2 ring-indigo-300' : 
                           isAnswered ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                     >
                       {idx + 1}
                     </button>
                   )
                 })}
              </div>
              
              <div className="p-4 border-t bg-slate-50 text-xs text-slate-400 text-center">
                 Mẹo: Nhấn vào số câu để chuyển nhanh
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN CONTENT (Khu vực làm bài) */}
        <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden relative">
           
           {/* ProgressBar */}
           <div className="h-1 bg-slate-200 w-full">
              <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
           </div>

           <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col">
                 
                 {/* Question Content */}
                 <div className="p-6 md:p-8 border-b border-slate-100 flex-1">
                    <div className="flex justify-between items-start mb-4">
                       <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                          Câu {currentQIndex + 1}
                       </span>
                       <span className="text-xs font-bold text-slate-400">
                          {currentQ.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'} • {currentQ.points} điểm
                       </span>
                    </div>
                    
                    <div className="text-lg text-slate-800 leading-relaxed font-medium">
                       <MathPreview content={currentQ.content} />
                    </div>
                 </div>

                 {/* Options / Answer Input */}
                 <div className="p-6 md:p-8 bg-slate-50/50 rounded-b-2xl">
                    {currentQ.type === 'multiple_choice' ? (
                       <div className="grid grid-cols-1 gap-3">
                          {currentQ.options?.map((opt, i) => {
                             const label = ['A','B','C','D'][i];
                             const isSelected = answers[currentQ.id] === label;
                             return (
                                <div 
                                  key={i}
                                  onClick={() => handleSelectAnswer(currentQ.id, label)}
                                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-4 group
                                    ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'}`}
                                >
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors shrink-0
                                      ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-500 group-hover:border-indigo-400'}`}>
                                      {label}
                                   </div>
                                   <div className="pt-1 text-slate-700">
                                      <MathPreview content={opt} />
                                   </div>
                                </div>
                             )
                          })}
                       </div>
                    ) : (
                       <div className="space-y-2">
                          <p className="text-sm font-bold text-slate-500 uppercase">Bài làm của bạn:</p>
                          <textarea
                             value={answers[currentQ.id] || ""}
                             onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                             placeholder="Nhập câu trả lời..."
                             className="w-full h-40 p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none"
                          />
                          {/* Nút Paste (Ctrl+V) */}
                          <button 
                            onClick={async () => {
                               try {
                                 const text = await navigator.clipboard.readText();
                                 handleSelectAnswer(currentQ.id, (answers[currentQ.id] || "") + text);
                               } catch(e) { alert("Vui lòng dùng Ctrl+V"); }
                            }}
                            className="text-xs text-indigo-600 font-bold hover:underline"
                          >
                             Dán từ Clipboard
                          </button>
                       </div>
                    )}
                 </div>

                 {/* Action Bar dưới cùng */}
                 <div className="p-4 border-t bg-white flex justify-between items-center rounded-b-2xl">
                    <button 
                      onClick={() => handleClearAnswer(currentQ.id)}
                      className="text-slate-400 hover:text-rose-500 text-sm font-medium flex items-center gap-1 transition-colors"
                      title="Xóa câu trả lời"
                    >
                       <AlertTriangle size={14}/> Xóa chọn
                    </button>
                 </div>
              </div>
           </div>

           {/* Navigation Buttons */}
           <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center z-10">
              <button 
                onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))}
                disabled={currentQIndex === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={20}/> Câu trước
              </button>

              <div className="hidden md:block text-slate-400 text-sm font-bold">
                 Câu {currentQIndex + 1} / {questions.length}
              </div>

              <button 
                onClick={() => setCurrentQIndex(Math.min(questions.length - 1, currentQIndex + 1))}
                disabled={currentQIndex === questions.length - 1}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-slate-900 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-md"
              >
                Câu sau <ChevronRight size={20}/>
              </button>
           </div>

        </div>
      </div>
    </div>
  );
};

export default StudentQuiz;
