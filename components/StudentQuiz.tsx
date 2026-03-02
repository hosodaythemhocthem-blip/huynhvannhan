import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  Clock, Menu, CheckCircle, X, HelpCircle, Trophy, Home, ChevronLeft, ChevronRight, AlertCircle 
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
  
  // State xử lý nộp bài
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState<{score: number, total: number} | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null); // Lưu lỗi nếu có
  const [mounted, setMounted] = useState(false); // Để fix lỗi Portal trên Next.js/SSR

  // --- INIT ---
  useEffect(() => {
    setMounted(true); // Chỉ render Portal khi component đã mount
    fetchExamData();
  }, []);

  const fetchExamData = async () => {
    const examId = localStorage.getItem('lms_active_exam_id');
    if (!examId) {
      // showToast("Không tìm thấy ID bài thi.", "error"); // Tắt cái này để tránh spam nếu reload
      return;
    }

    try {
      const { data, error } = await supabase.from('exams').select('*').eq('id', examId).single();
      if (error || !data) throw error;

      setExam(data);
      setTimeLeft(data.duration ? data.duration * 60 : 45 * 60);

      // Parse questions an toàn
      let parsedQuestions: Question[] = [];
      if (data.questions && Array.isArray(data.questions)) parsedQuestions = data.questions;
      else if (data.content) {
          try {
              const parsed = JSON.parse(data.content);
              if (Array.isArray(parsed)) parsedQuestions = parsed;
          } catch (e) {}
      }
      // Sanitize ID
      const sanitized = parsedQuestions.map((q, index) => ({
          ...q, id: q.id || `q_${index}_${Date.now()}`
      }));
      setQuestions(sanitized);

      // Load bản nháp
      const savedAnswers = localStorage.getItem(`quiz_draft_${examId}_${user.id}`);
      if (savedAnswers) setAnswers(JSON.parse(savedAnswers));

    } catch (e) {
      console.error(e);
      showToast("Lỗi tải đề thi. Vui lòng tải lại trang.", "error");
    }
  };

  // --- TIMER ---
  useEffect(() => {
    if (!exam || isSubmitting || questions.length === 0 || resultData) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSafeSubmit(true); // Hết giờ tự nộp
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [exam, isSubmitting, questions.length, resultData]);

  // --- HÀM TÍNH ĐIỂM TẠI CHỖ (LOCAL GRADING) ---
  // Giúp tính điểm ngay lập tức mà không sợ lỗi từ Service
  const calculateLocalScore = () => {
    let correctCount = 0;
    questions.forEach(q => {
      if (q.type !== 'essay') {
        // So sánh đáp án (chấp nhận cả chữ hoa/thường)
        const userAns = (answers[q.id] || "").trim().toUpperCase();
        const correctAns = (q.correct_option || "").trim().toUpperCase();
        if (userAns && userAns === correctAns) {
          correctCount++;
        }
      }
    });
    // Quy đổi ra thang điểm 10
    const totalQ = questions.length;
    if (totalQ === 0) return 0;
    const score = (correctCount / totalQ) * 10;
    return Math.round(score * 100) / 100; // Làm tròn 2 số thập phân
  };

  // --- XỬ LÝ NỘP BÀI AN TOÀN ---
  const handleSafeSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !window.confirm("Bạn CHẮC CHẮN muốn nộp bài?")) return;

    setIsSubmitting(true);
    
    // 1. Tính điểm ngay lập tức (Ưu tiên hiển thị)
    const score = calculateLocalScore();
    const finalResult = { score: score, total: 10 };
    
    // 2. Cố gắng lưu vào Server (trong nền)
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
      
      // Nếu lưu thành công: Xóa draft
      if(exam) localStorage.removeItem(`quiz_draft_${exam.id}_${user.id}`);
      localStorage.removeItem('lms_active_exam_id');
      
    } catch (err: any) {
      console.error("Lỗi lưu bài:", err);
      // Nếu lỗi, vẫn hiện điểm nhưng kèm thông báo lỗi
      setSaveError(err.message || "Không thể lưu kết quả vào hệ thống.");
    } finally {
      // 3. LUÔN LUÔN hiện bảng kết quả dù có lỗi hay không
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
    if (str.includes('<img') || str.includes('<p>')) {
       return <div className="prose max-w-none [&>img]:mx-auto [&>img]:max-h-64" dangerouslySetInnerHTML={{ __html: str }} />;
    }
    return <MathPreview content={str} />;
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // --- RENDER ---
  if (!mounted) return null; // Chờ mount để dùng Portal
  if (!exam || questions.length === 0) return null; // Hoặc loading spinner

  const currentQ = questions[currentQIndex];

  const QuizInterface = (
    <div className="fixed inset-0 bg-slate-100 z-[999999] flex flex-col h-screen w-screen font-sans">
      
      {/* --- MÀN HÌNH KẾT QUẢ (OVERLAY) --- */}
      {resultData && (
        <div className="absolute inset-0 z-[1000000] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
             className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden"
           >
              {/* Trang trí */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>

              {saveError ? (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm flex gap-2 items-start text-left">
                  <AlertCircle className="shrink-0 mt-0.5" size={16}/>
                  <div>
                    <strong>Lưu ý quan trọng:</strong> Bài làm đã chấm xong nhưng <u>không lưu được vào hệ thống</u> (Lỗi mạng hoặc Server). 
                    <br/>👉 <strong>Vui lòng chụp lại màn hình này và gửi cho Giáo viên ngay.</strong>
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Trophy size={40} className="text-green-600" />
                </div>
              )}
              
              <h2 className="text-2xl font-bold text-slate-800 mb-1">Kết quả bài thi</h2>
              <p className="text-slate-500 text-sm mb-6">{exam.title}</p>

              <div className="bg-slate-50 rounded-xl p-6 mb-8">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">ĐIỂM SỐ</span>
                  <div className="flex items-end justify-center gap-2 leading-none">
                    <span className="text-6xl font-black text-indigo-600">{resultData.score}</span>
                    <span className="text-2xl font-bold text-slate-300 mb-2">/10</span>
                  </div>
              </div>

              <button 
                onClick={() => onTabChange('dashboard')}
                className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <Home size={18} /> Quay về Trang chủ
              </button>
           </motion.div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white h-16 px-4 flex items-center justify-between shadow-sm shrink-0 z-50">
         <div className="flex items-center gap-3 w-1/3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded"><Menu/></button>
            <h1 className="font-bold text-slate-700 truncate">{exam.title}</h1>
         </div>
         <div className="flex justify-center w-1/3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono font-bold border ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
              <Clock size={18}/> {formatTime(timeLeft)}
            </div>
         </div>
         <div className="flex justify-end w-1/3">
            <button 
              onClick={() => handleSafeSubmit(false)}
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Đang nộp...</>
              ) : "Nộp bài"}
            </button>
         </div>
      </div>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR */}
        <AnimatePresence>
          {(isSidebarOpen || window.innerWidth >= 1024) && (
            <motion.div 
               initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
               className="absolute lg:static top-0 left-0 h-full w-[260px] bg-white border-r z-40 flex flex-col shadow-xl lg:shadow-none"
            >
               <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                 <span className="font-bold text-slate-700 text-sm">Danh sách câu hỏi</span>
                 <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X size={18}/></button>
               </div>
               <div className="flex-1 overflow-y-auto p-2 grid grid-cols-5 gap-2 content-start pb-20">
                 {questions.map((q, idx) => (
                   <button key={q.id} onClick={() => {setCurrentQIndex(idx); setSidebarOpen(false)}}
                     className={`h-9 rounded text-xs font-bold border transition-all ${
                       idx === currentQIndex ? 'bg-indigo-600 text-white border-indigo-600' : 
                       answers[q.id] ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                     }`}
                   >
                     {idx + 1}
                   </button>
                 ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* MAIN QUESTION AREA */}
        <div className="flex-1 flex flex-col relative bg-slate-100/50">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
             <div className="max-w-3xl mx-auto space-y-6">
                {/* Câu hỏi */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[100px]">
                   <div className="mb-4 flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded text-xs font-bold uppercase">Câu {currentQIndex + 1}</span>
                      <span className="text-xs text-slate-400 font-medium ml-auto">ID: {currentQ.id}</span>
                   </div>
                   <div className="text-base sm:text-lg text-slate-800 leading-relaxed">
                      {renderRichContent(currentQ.content)}
                   </div>
                </div>

                {/* Đáp án */}
                <div className="grid gap-3">
                  {currentQ.options?.map((opt, i) => {
                     const label = ['A','B','C','D'][i];
                     const isSelected = answers[currentQ.id] === label;
                     return (
                       <div key={i} onClick={() => handleSelectAnswer(currentQ.id, label)}
                         className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all bg-white ${
                           isSelected ? 'border-indigo-500 bg-indigo-50/50' : 'border-transparent shadow-sm hover:border-indigo-200'
                         }`}
                       >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                            isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>{isSelected ? <CheckCircle size={16}/> : label}</div>
                          <div className="flex-1 text-slate-700">{renderRichContent(opt)}</div>
                       </div>
                     )
                  })}
                </div>
             </div>
          </div>

          {/* FOOTER NAV */}
          <div className="absolute bottom-0 inset-x-0 h-16 bg-white border-t flex items-center justify-between px-4 sm:px-8 z-30">
             <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(i => i - 1)} className="flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-50 font-medium">
               <ChevronLeft size={18}/> Trước
             </button>
             
             {/* Margin right để tránh nút Chat bong bóng */}
             <div className="mr-20">
               <button disabled={currentQIndex === questions.length - 1} onClick={() => setCurrentQIndex(i => i + 1)} className="flex items-center gap-1 px-5 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 font-bold shadow-lg shadow-slate-200">
                 Tiếp theo <ChevronRight size={18}/>
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
