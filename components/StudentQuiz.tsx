import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  Clock, AlertTriangle, ChevronLeft, ChevronRight, 
  Menu, CheckCircle, X, HelpCircle, Trophy, Home, ArrowRight
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
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // THÊM STATE ĐỂ LƯU KẾT QUẢ
  const [resultData, setResultData] = useState<{score: number, total: number} | null>(null);

  // --- RENDER CONTENT ---
  const renderRichContent = (content: any) => {
    if (!content) return <span className="text-slate-400 italic text-sm">Không có nội dung</span>;
    let contentStr = typeof content === 'string' ? content : content?.text || JSON.stringify(content);
    if (contentStr.includes('<img') || contentStr.includes('<p>') || contentStr.includes('<div>')) {
      return (
        <div 
          className="prose max-w-none [&>img]:max-w-full [&>img]:h-auto [&>img]:rounded-lg [&>img]:block [&>img]:mx-auto [&>p]:mb-2"
          dangerouslySetInnerHTML={{ __html: contentStr }} 
        />
      );
    }
    return <MathPreview content={contentStr} />;
  };

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchExamData = async () => {
      setIsLoading(true);
      const examId = localStorage.getItem('lms_active_exam_id');
      if (!examId) {
        showToast("Không tìm thấy bài thi.", "error");
        onTabChange('dashboard');
        return;
      }
      try {
        const { data, error } = await supabase.from('exams').select('*').eq('id', examId).single();
        if (error || !data) throw error;

        setExam(data);
        setTimeLeft(data.duration ? data.duration * 60 : 45 * 60);

        let parsedQuestions: Question[] = [];
        if (data.questions && Array.isArray(data.questions)) parsedQuestions = data.questions;
        else if (data.content) {
            try {
                const parsed = JSON.parse(data.content);
                if (Array.isArray(parsed)) parsedQuestions = parsed;
            } catch (e) {}
        }
        const sanitized = parsedQuestions.map((q, index) => ({
            ...q, id: q.id || `q_${index}_${Date.now()}`, options: q.options || []
        }));
        setQuestions(sanitized);

        const savedAnswers = localStorage.getItem(`quiz_draft_${examId}_${user.id}`);
        if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
      } catch (e) {
        console.error(e);
        showToast("Lỗi tải đề thi.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchExamData();
  }, [user.id, onTabChange]);

  // --- TIMER ---
  useEffect(() => {
    if (isLoading || !exam || isSubmitting || questions.length === 0 || resultData) return;
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
  }, [exam, isSubmitting, isLoading, questions.length, resultData]);

  useEffect(() => { if (isTimeUp && !isSubmitting && !resultData) handleSubmit(true); }, [isTimeUp]);

  // --- HANDLERS ---
  const handleSelectAnswer = (qId: string, value: string) => {
    const newAnswers = { ...answers, [qId]: value };
    setAnswers(newAnswers);
    if(exam) localStorage.setItem(`quiz_draft_${exam.id}_${user.id}`, JSON.stringify(newAnswers));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!exam) return;
    if (!autoSubmit && !window.confirm("Bạn chắc chắn muốn nộp bài?")) return;

    setIsSubmitting(true);
    try {
      console.log("Bắt đầu chấm điểm..."); // Debug log
      const score = quizService.gradeExam(questions, answers);
      console.log("Điểm số tính được:", score); // Debug log

      const payload: any = {
        exam_id: exam.id, student_id: user.id, answers: answers, score: score,
        completed_at: new Date().toISOString()
      };
      if ((user as any).class_id) payload.class_id = (user as any).class_id;

      await quizService.submitExam(payload);
      
      // Clear storage
      localStorage.removeItem(`quiz_draft_${exam.id}_${user.id}`);
      localStorage.removeItem('lms_active_exam_id');
      
      // QUAN TRỌNG: KHÔNG CHUYỂN TRANG, MÀ HIỆN KẾT QUẢ
      setResultData({ score: score, total: 10 }); // Giả sử thang điểm 10
      setIsSubmitting(false);

    } catch (err) {
      console.error("Lỗi nộp bài:", err);
      showToast("Lỗi nộp bài. Vui lòng thử lại!", "error");
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    // Hàm này chạy khi người dùng bấm "Về trang chủ" sau khi xem điểm
    onTabChange('dashboard');
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (isLoading) return <div className="p-10 text-center">Đang tải đề thi...</div>;
  if (!exam || questions.length === 0) return <div className="p-10 text-center">Đề thi lỗi.</div>;

  const currentQ = questions[currentQIndex];

  // --- GIAO DIỆN CHÍNH (PORTAL) ---
  const QuizInterface = (
    <div className="fixed inset-0 bg-slate-100 z-[999999] flex flex-col h-screen w-screen font-sans">
      
      {/* 1. MÀN HÌNH KẾT QUẢ (HIỆN LÊN SAU KHI NỘP) */}
      {resultData && (
        <div className="absolute inset-0 z-[1000000] bg-white flex flex-col items-center justify-center p-4 animate-fade-in">
           <motion.div 
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 sm:p-12 max-w-md w-full text-center"
           >
              <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy size={48} className="text-yellow-600" />
              </div>
              
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Hoàn thành bài thi!</h2>
              <p className="text-slate-500 mb-8">Hệ thống đã ghi nhận kết quả của bạn.</p>

              <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-200">
                  <span className="block text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Điểm số của bạn</span>
                  <span className="block text-5xl font-black text-indigo-600">{resultData.score} <span className="text-2xl text-slate-400">/ 10</span></span>
              </div>

              <button 
                onClick={handleFinish}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Home size={20} /> Về trang chủ
              </button>
           </motion.div>
        </div>
      )}

      {/* 2. HEADER */}
      <div className="bg-white px-4 h-16 shrink-0 flex items-center justify-between shadow-md relative z-50">
        <div className="flex items-center gap-3 w-1/3">
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg lg:hidden"><Menu size={24}/></button>
           <h1 className="font-bold text-slate-800 truncate max-w-[150px] sm:max-w-xs">{exam.title}</h1>
        </div>
        <div className="flex justify-center w-1/3">
           <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xl font-bold border-2 ${
             timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white text-indigo-700 border-indigo-100'
           }`}>
              <Clock size={22}/> {formatTime(timeLeft)}
           </div>
        </div>
        <div className="flex justify-end w-1/3">
           <button 
             onClick={() => handleSubmit(false)} 
             disabled={isSubmitting} 
             className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all"
           >
             {isSubmitting ? "Đang nộp..." : "Nộp bài"}
           </button>
        </div>
      </div>

      {/* 3. BODY */}
      <div className="flex flex-1 overflow-hidden relative">
        <AnimatePresence>
          {(isSidebarOpen || window.innerWidth >= 1024) && (
            <motion.div 
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              className="absolute lg:static top-0 left-0 h-full bg-white border-r z-40 w-[280px] flex flex-col shadow-2xl lg:shadow-none"
            >
              <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                  <span className="font-bold text-slate-700">Danh sách câu</span>
                  <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X size={20}/></button>
              </div>
              <div className="p-3 grid grid-cols-5 gap-2 overflow-y-auto content-start flex-1 pb-20">
                 {questions.map((q, idx) => (
                     <button
                       key={q.id}
                       onClick={() => { setCurrentQIndex(idx); setSidebarOpen(false); }}
                       className={`h-10 rounded-md text-sm font-bold border transition-all ${
                         idx === currentQIndex ? 'bg-indigo-600 text-white' : 
                         answers[q.id] ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white text-slate-600'
                       }`}
                     >
                       {idx + 1}
                     </button>
                 ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col bg-slate-100 relative overflow-hidden w-full">
           <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-32">
              <div className="max-w-4xl mx-auto space-y-6">
                 <div className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8 min-h-[120px] text-lg">
                    <div className="mb-4 font-bold text-indigo-700">Câu {currentQIndex + 1}:</div>
                    {renderRichContent(currentQ.content)}
                 </div>
                 <div className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8">
                    {currentQ.type !== 'essay' ? (
                       <div className="grid gap-4">
                          {currentQ.options?.map((opt, i) => {
                             const label = ['A','B','C','D'][i];
                             const isSelected = answers[currentQ.id] === label;
                             return (
                                <div key={i} onClick={() => handleSelectAnswer(currentQ.id, label)}
                                  className={`flex items-center gap-5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-indigo-300'
                                  }`}
                                >
                                     <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${isSelected ? 'bg-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                                       {isSelected ? <CheckCircle size={20}/> : label}
                                     </div>
                                     <div className="flex-1 font-medium text-slate-700 text-lg">{renderRichContent(opt)}</div>
                                </div>
                             )
                          })}
                       </div>
                    ) : (
                       <textarea
                          value={answers[currentQ.id] || ""}
                          onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                          className="w-full h-56 p-5 rounded-xl border focus:ring-4 focus:border-indigo-500 text-lg"
                          placeholder="Nhập câu trả lời..."
                       />
                    )}
                 </div>
              </div>
           </div>

           <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4 h-20 flex justify-between items-center shadow-lg z-30">
              <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(i => i - 1)} className="flex gap-2 px-6 py-3 rounded-lg bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50">
                <ChevronLeft/> Trước
              </button>
              <div className="mr-24 sm:mr-32"> 
                <button disabled={currentQIndex === questions.length - 1} onClick={() => setCurrentQIndex(i => i + 1)} className="flex gap-2 px-8 py-3 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 disabled:opacity-50 shadow-lg">
                  Sau <ChevronRight/>
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
