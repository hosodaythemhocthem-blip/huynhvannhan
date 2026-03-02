import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  Clock, Menu, CheckCircle, X, Trophy, Home, ChevronLeft, ChevronRight, AlertCircle 
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
  const [resultData, setResultData] = useState<{score: number, total: number} | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchExamData();
  }, []);

  const fetchExamData = async () => {
    const examId = localStorage.getItem('lms_active_exam_id');
    if (!examId) return;

    try {
      const { data, error } = await supabase.from('exams').select('*').eq('id', examId).single();
      if (error || !data) throw error;

      setExam(data);
      setTimeLeft(data.duration ? data.duration * 60 : 45 * 60);

      // Xử lý questions
      let parsedQuestions: Question[] = [];
      if (data.questions && Array.isArray(data.questions)) parsedQuestions = data.questions;
      else if (data.content) {
          try {
              const parsed = JSON.parse(data.content);
              if (Array.isArray(parsed)) parsedQuestions = parsed;
          } catch (e) {}
      }

      // QUAN TRỌNG: Tạo ID ổn định (Stable ID) để không bị lỗi 0 điểm
      const sanitized = parsedQuestions.map((q, index) => ({
          ...q, 
          // Nếu không có ID thực, dùng index làm ID. Tuyệt đối KHÔNG dùng Date.now() ở đây
          id: q.id || `fixed_q_${index}` 
      }));
      setQuestions(sanitized);

      // Load bản nháp
      const savedAnswers = localStorage.getItem(`quiz_draft_${examId}_${user.id}`);
      if (savedAnswers) setAnswers(JSON.parse(savedAnswers));

    } catch (e) {
      console.error(e);
      showToast("Lỗi tải đề thi.", "error");
    }
  };

  // --- TIMER ---
  useEffect(() => {
    if (!exam || isSubmitting || questions.length === 0 || resultData) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSafeSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [exam, isSubmitting, questions.length, resultData]);

  // --- HÀM TÍNH ĐIỂM (LOGIC ĐÃ SỬA) ---
  const calculateLocalScore = () => {
    console.log("--- BẮT ĐẦU CHẤM ĐIỂM ---");
    let correctCount = 0;
    
    questions.forEach((q, idx) => {
      if (q.type !== 'essay') {
        const userAns = (answers[q.id] || "").trim().toUpperCase();
        const correctAns = (q.correct_option || "").trim().toUpperCase();
        
        // Debug trong Console F12 để xem tại sao sai/đúng
        console.log(`Câu ${idx+1} (ID: ${q.id}): Chọn [${userAns}] - Đáp án đúng [${correctAns}] -> ${userAns === correctAns ? "ĐÚNG" : "SAI"}`);

        if (userAns && userAns === correctAns) {
          correctCount++;
        }
      }
    });

    const totalQ = questions.length;
    const score = totalQ === 0 ? 0 : (correctCount / totalQ) * 10;
    console.log(`Tổng câu đúng: ${correctCount}/${totalQ} -> Điểm: ${score}`);
    return Math.round(score * 100) / 100;
  };

  const handleSafeSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !window.confirm("Nộp bài ngay?")) return;
    setIsSubmitting(true);
    
    // 1. Tính điểm
    const score = calculateLocalScore();
    const finalResult = { score: score, total: 10 };
    
    // 2. Lưu Server
    try {
      const payload: any = {
        exam_id: exam?.id,
        student_id: user.id,
        answers: answers,
        score: score,
        completed_at: new Date().toISOString()
      };
      if ((user as any).class_id) payload.class_id = (user as any).class_id;

      await quizService.submitExam(payload);
      
      if(exam) localStorage.removeItem(`quiz_draft_${exam.id}_${user.id}`);
      localStorage.removeItem('lms_active_exam_id');
      setSaveError(null); // Reset lỗi nếu thành công

    } catch (err: any) {
      console.error("Lỗi lưu Supabase:", err);
      setSaveError("Lỗi hệ thống: Không lưu được vào lịch sử (nhưng vẫn có điểm).");
    } finally {
      setResultData(finalResult);
      setIsSubmitting(false);
    }
  };

  const handleSelectAnswer = (qId: string, value: string) => {
    const newAnswers = { ...answers, [qId]: value };
    setAnswers(newAnswers);
    if(exam) localStorage.setItem(`quiz_draft_${exam.id}_${user.id}`, JSON.stringify(newAnswers));
  };

  const renderRichContent = (content: any) => {
    if (!content) return <span className="text-slate-400 italic">...</span>;
    let str = typeof content === 'string' ? content : content?.text || "";
    // Xử lý ảnh base64 hoặc ảnh thường
    if (str.includes('<img') || str.includes('<p>')) {
       return <div className="prose max-w-none [&>img]:mx-auto [&>img]:max-h-64 [&>img]:object-contain" dangerouslySetInnerHTML={{ __html: str }} />;
    }
    return <MathPreview content={str} />;
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (!mounted || !exam) return null;

  const currentQ = questions[currentQIndex];

  const QuizInterface = (
    <div className="fixed inset-0 bg-slate-100 z-[999999] flex flex-col h-screen w-screen font-sans">
      
      {/* RESULT OVERLAY */}
      {resultData && (
        <div className="absolute inset-0 z-[1000000] bg-slate-900/95 backdrop-blur flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-10 max-w-md w-full text-center relative">
              
              {saveError ? (
                <div className="mb-6 bg-red-50 border border-red-100 p-3 rounded-lg flex gap-3 text-left">
                  <AlertCircle className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-600">
                    <strong>Lưu ý:</strong> {saveError} <br/>
                    Hãy chụp màn hình này gửi giáo viên để xác nhận điểm số.
                  </p>
                </div>
              ) : (
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <Trophy className="text-green-600" size={40} />
                </div>
              )}

              <h2 className="text-3xl font-bold text-slate-800 mb-2">Kết Quả</h2>
              <div className="py-8">
                 <span className="text-7xl font-black text-indigo-600 tracking-tighter">{resultData.score}</span>
                 <span className="text-2xl text-slate-400 font-medium">/10</span>
              </div>

              <button 
                onClick={() => onTabChange('dashboard')}
                className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold hover:bg-slate-700 transition-all flex justify-center items-center gap-2"
              >
                <Home size={20}/> Về trang chủ
              </button>
           </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white h-16 px-4 flex items-center justify-between shadow-sm shrink-0 z-50">
         <div className="flex items-center gap-3 w-1/3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded"><Menu/></button>
            <h1 className="font-bold text-slate-700 truncate hidden sm:block">{exam.title}</h1>
         </div>
         <div className="flex justify-center w-1/3">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono font-bold border ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-100 text-slate-700'}`}>
              <Clock size={18}/> {formatTime(timeLeft)}
            </div>
         </div>
         <div className="flex justify-end w-1/3">
            <button onClick={() => handleSafeSubmit(false)} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold shadow transition-all">
              {isSubmitting ? "..." : "Nộp bài"}
            </button>
         </div>
      </div>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden relative">
        <AnimatePresence>
          {(isSidebarOpen || window.innerWidth >= 1024) && (
            <motion.div 
               initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
               className="absolute lg:static top-0 left-0 h-full w-[260px] bg-white border-r z-40 flex flex-col shadow-xl lg:shadow-none"
            >
               <div className="p-4 border-b flex justify-between items-center bg-slate-50 font-bold text-slate-700">
                 Danh sách câu <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X size={18}/></button>
               </div>
               <div className="flex-1 overflow-y-auto p-2 grid grid-cols-5 gap-2 content-start pb-20">
                 {questions.map((q, idx) => (
                   <button key={q.id} onClick={() => {setCurrentQIndex(idx); setSidebarOpen(false)}}
                     className={`h-9 rounded text-xs font-bold border transition-all ${
                       idx === currentQIndex ? 'bg-indigo-600 text-white border-indigo-600' : 
                       answers[q.id] ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-white text-slate-500 border-slate-200'
                     }`}
                   >
                     {idx + 1}
                   </button>
                 ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex-1 flex flex-col relative bg-slate-50">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
             <div className="max-w-3xl mx-auto space-y-6">
                {/* QUESTION CARD */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
                   <div className="mb-4 flex gap-2">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded text-xs font-bold uppercase">Câu {currentQIndex + 1}</span>
                   </div>
                   <div className="text-lg text-slate-800 leading-relaxed font-medium">
                      {renderRichContent(currentQ.content)}
                   </div>
                </div>

                {/* OPTIONS */}
                <div className="grid gap-3">
                  {currentQ.options?.map((opt, i) => {
                     const label = ['A','B','C','D'][i];
                     const isSelected = answers[currentQ.id] === label;
                     return (
                       <div key={i} onClick={() => handleSelectAnswer(currentQ.id, label)}
                         className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all bg-white ${
                           isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-transparent shadow-sm hover:border-indigo-200'
                         }`}
                       >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                            isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>{isSelected ? <CheckCircle size={16}/> : label}</div>
                          <div className="flex-1 text-slate-700 text-lg">{renderRichContent(opt)}</div>
                       </div>
                     )
                  })}
                </div>
             </div>
          </div>

          <div className="absolute bottom-0 inset-x-0 h-20 bg-white border-t flex items-center justify-between px-6 z-30">
             <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(i => i - 1)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold disabled:opacity-50">
               <ChevronLeft size={20}/> Trước
             </button>
             <div className="mr-20">
               <button disabled={currentQIndex === questions.length - 1} onClick={() => setCurrentQIndex(i => i + 1)} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 font-bold shadow-lg disabled:opacity-50">
                 Tiếp theo <ChevronRight size={20}/>
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
  return ReactDOM.createPortal(QuizInterface, document.body);
};

export default StudentQuiz;
