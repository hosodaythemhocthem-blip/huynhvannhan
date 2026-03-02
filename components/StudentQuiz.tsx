import React, { useState, useEffect } from 'react';
import { 
  Clock, AlertTriangle, Send, ChevronLeft, ChevronRight, 
  Menu, X, ClipboardPaste, Trash2, Home
} from 'lucide-react';
import { Exam, Question, User } from '../types';
import MathPreview from './MathPreview';
import { useToast } from './Toast';
import { quizService } from '../services/quizService';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';

interface Props {
  user: User;
  onTabChange: (tab: string) => void;
}

const StudentQuiz: React.FC<Props> = ({ user, onTabChange }) => {
  const { showToast } = useToast();
  
  // --- STATE ---
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  // Thêm state loading riêng biệt để kiểm soát vòng quay
  const [isLoading, setIsLoading] = useState(true);

  // --- INIT: TẢI ĐỀ THI ---
  useEffect(() => {
    const fetchExamData = async () => {
      setIsLoading(true);
      const examId = localStorage.getItem('lms_active_exam_id');
      
      if (!examId) {
        showToast("Không tìm thấy mã đề thi.", "error");
        onTabChange('dashboard');
        return;
      }

      try {
        console.log("Đang tải đề thi ID:", examId);
        
        // 1. Tải dữ liệu từ DB
        const { data, error } = await supabase
          .from('exams')
          .select('*')
          .eq('id', examId)
          .single();

        if (error || !data) throw error;

        setExam(data);
        setTimeLeft(data.duration ? data.duration * 60 : 45 * 60);

        // 2. Xử lý câu hỏi (Quan trọng: Xử lý cả trường hợp NULL)
        let parsedQuestions: Question[] = [];
        
        // Ưu tiên lấy từ cột questions (JSON)
        if (data.questions && Array.isArray(data.questions)) {
          parsedQuestions = data.questions;
        } 
        // Nếu không có, thử lấy từ content/raw_content (String JSON)
        else if (data.raw_content || data.content) {
            try {
                const contentStr = data.raw_content || data.content;
                const parsed = JSON.parse(contentStr);
                if (Array.isArray(parsed)) parsedQuestions = parsed;
            } catch (e) {
                console.error("Lỗi parse nội dung đề thi", e);
            }
        }

        setQuestions(parsedQuestions);

        // 3. Khôi phục bài làm dang dở
        const storageKey = `quiz_draft_${examId}_${user.id}`;
        const savedAnswers = localStorage.getItem(storageKey);
        if (savedAnswers) {
          try {
            setAnswers(JSON.parse(savedAnswers));
            showToast("Đã khôi phục bài làm trước đó!", "info");
          } catch(e) {}
        }

      } catch (e) {
        console.error("Lỗi tải đề thi", e);
        showToast("Lỗi tải đề thi. Vui lòng thử lại.", "error");
        // Không redirect ngay để user đọc lỗi
      } finally {
        setIsLoading(false); // Tắt loading dù thành công hay thất bại
      }
    };

    fetchExamData();
  }, [user.id, onTabChange]);

  // --- TIMER ---
  useEffect(() => {
    if (isLoading || !exam || isSubmitting || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimeUp(true); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [exam, isSubmitting, isLoading, questions.length]);

  // --- AUTO SUBMIT ---
  useEffect(() => {
    if (isTimeUp && !isSubmitting && exam && questions.length > 0) {
      handleSubmit(true);
    }
  }, [isTimeUp]);

  // --- AUTO SAVE ---
  useEffect(() => {
    if (exam) {
      const storageKey = `quiz_draft_${exam.id}_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(answers));
    }
  }, [answers, exam, user.id]);

  // --- HANDLERS ---
  const handleSelectAnswer = (qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleClearAnswer = (qId: string) => {
    const newAnswers = { ...answers };
    delete newAnswers[qId];
    setAnswers(newAnswers);
  };

  const handlePaste = async (qId: string) => {
    try {
      const text = await navigator.clipboard.readText();
      const currentAnswer = answers[qId] || "";
      handleSelectAnswer(qId, currentAnswer + text);
      showToast("Đã dán nội dung", "success");
    } catch(e) { 
      showToast("Dùng phím Ctrl+V để dán", "warning"); 
    }
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!exam) return;
    if (!autoSubmit && !window.confirm("Bạn chắc chắn muốn nộp bài?")) return;

    setIsSubmitting(true);
    try {
      // Tính điểm (nếu trắc nghiệm)
      const score = quizService.gradeExam(questions, answers);
      
      const payload: any = {
        exam_id: exam.id,
        student_id: user.id,
        answers: answers,
        score: score,
        completed_at: new Date().toISOString()
      };
      
      if ((user as any).class_id) {
        payload.class_id = (user as any).class_id;
      }

      // Lưu kết quả
      await quizService.submitExam(payload);

      // Xóa draft
      localStorage.removeItem(`quiz_draft_${exam.id}_${user.id}`);
      localStorage.removeItem('lms_active_exam_id'); // Xóa ID đề thi đang làm
      
      showToast(autoSubmit ? "Hết giờ! Đã nộp bài." : "Nộp bài thành công!", "success");
      onTabChange('dashboard'); 

    } catch (err) {
      console.error(err);
      showToast("Lỗi nộp bài. Vui lòng thử lại!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExit = () => {
      if(confirm("Bạn muốn thoát? Bài làm sẽ được lưu nháp.")) {
          localStorage.removeItem('lms_active_exam_id'); // Xóa trạng thái đang làm để không bị kẹt
          onTabChange('dashboard');
      }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- RENDER 1: LOADING ---
  if (isLoading) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-50 z-50">
            <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"/>
                <p className="text-slate-500 font-bold">Đang tải đề thi...</p>
            </div>
        </div>
      );
  }

  // --- RENDER 2: ERROR / EMPTY STATE (QUAN TRỌNG ĐỂ FIX LỖI TREO) ---
  // Nếu tải xong mà không có câu hỏi -> Hiển thị lỗi thay vì treo
  if (!exam || questions.length === 0) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50 p-4">
            <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Đề thi chưa sẵn sàng</h2>
            <p className="text-slate-500 text-center max-w-md mb-8">
                Giáo viên chưa nhập câu hỏi cho đề thi này hoặc dữ liệu bị lỗi.
                <br/>(ID: {localStorage.getItem('lms_active_exam_id')})
            </p>
            <button 
                onClick={() => {
                    localStorage.removeItem('lms_active_exam_id'); // Xóa key để thoát kẹt
                    onTabChange('dashboard');
                }}
                className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 flex items-center gap-2"
            >
                <Home size={20}/> Quay về Trang chủ
            </button>
        </div>
      );
  }

  // --- RENDER 3: GIAO DIỆN LÀM BÀI (Chỉ chạy khi có dữ liệu) ---
  const currentQ = questions[currentQIndex];
  // Phòng hờ trường hợp index vượt quá giới hạn khi render lại
  if (!currentQ) return null; 

  const progress = Math.round((Object.keys(answers).length / questions.length) * 100);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col h-screen w-screen overflow-hidden font-sans">
      {/* HEADER */}
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm h-16 shrink-0 z-20">
        <div className="flex items-center gap-3">
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-full lg:hidden transition-colors">
             <Menu size={20} className="text-slate-600"/>
           </button>
           <button onClick={handleExit} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-colors hidden md:block" title="Thoát">
             <X size={24}/>
           </button>
           <h2 className="font-bold text-slate-800 line-clamp-1 max-w-[150px] md:max-w-md">{exam.title}</h2>
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
             {isSubmitting ? "Đang nộp..." : "Nộp Bài"} <Send size={16}/>
           </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* SIDEBAR */}
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
                       key={q.id || idx}
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

        {/* MAIN CONTENT */}
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
