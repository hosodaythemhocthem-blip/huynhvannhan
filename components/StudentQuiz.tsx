import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom'; // QUAN TRỌNG: Thêm thư viện này để dùng Portal
import { 
  Clock, AlertTriangle, ChevronLeft, ChevronRight, 
  Menu, CheckCircle, X, HelpCircle
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
            ...q,
            id: q.id || `q_${index}_${Date.now()}`,
            options: q.options || []
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

  useEffect(() => { if (isTimeUp && !isSubmitting) handleSubmit(true); }, [isTimeUp]);

  // --- HANDLERS ---
  const handleSelectAnswer = (qId: string, value: string) => {
    const newAnswers = { ...answers, [qId]: value };
    setAnswers(newAnswers);
    if(exam) localStorage.setItem(`quiz_draft_${exam.id}_${user.id}`, JSON.stringify(newAnswers));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!exam) return;
    if (!autoSubmit && !window.confirm("Bạn muốn nộp bài và kết thúc thi?")) return;

    setIsSubmitting(true);
    try {
      const score = quizService.gradeExam(questions, answers);
      const payload: any = {
        exam_id: exam.id, student_id: user.id, answers: answers, score: score,
        completed_at: new Date().toISOString()
      };
      if ((user as any).class_id) payload.class_id = (user as any).class_id;

      await quizService.submitExam(payload);
      localStorage.removeItem(`quiz_draft_${exam.id}_${user.id}`);
      localStorage.removeItem('lms_active_exam_id');
      
      showToast(`Đã nộp bài! Điểm số: ${score}`, "success");
      onTabChange('dashboard'); 
    } catch (err) {
      showToast("Lỗi nộp bài.", "error");
      setIsSubmitting(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // --- CONTENT PHỤ (LOADING/ERROR) ---
  if (isLoading) return <div className="p-10 text-center">Đang tải đề thi...</div>;
  if (!exam || questions.length === 0) return (
    <div className="p-10 text-center">
      <h2 className="text-xl font-bold text-red-500">Đề thi bị lỗi</h2>
      <button onClick={() => onTabChange('dashboard')} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded">Quay lại</button>
    </div>
  );

  const currentQ = questions[currentQIndex];

  // --- PHẦN CHÍNH: SỬ DỤNG PORTAL ĐỂ "THOÁT LY" KHỎI PARENT ---
  // Toàn bộ giao diện này sẽ được gắn thẳng vào body, đè lên tất cả mọi thứ khác
  const QuizInterface = (
    <div className="fixed inset-0 bg-slate-100 z-[999999] flex flex-col h-screen w-screen font-sans">
      
      {/* HEADER: SIÊU ĐƠN GIẢN - KHÔNG AVATAR */}
      <div className="bg-white px-4 h-16 shrink-0 flex items-center justify-between shadow-md relative z-50">
        
        {/* TRÁI: Menu & Tên đề */}
        <div className="flex items-center gap-3 w-1/3">
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg lg:hidden">
             <Menu size={24} className="text-slate-700"/>
           </button>
           <div className="flex flex-col">
             <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Đang làm bài thi</span>
             <h1 className="font-bold text-slate-800 truncate max-w-[150px] sm:max-w-xs" title={exam.title}>{exam.title}</h1>
           </div>
        </div>

        {/* GIỮA: ĐỒNG HỒ */}
        <div className="flex justify-center w-1/3">
           <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xl font-bold border-2 shadow-sm ${
             timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white text-indigo-700 border-indigo-100'
           }`}>
              <Clock size={22}/> 
              {formatTime(timeLeft)}
           </div>
        </div>

        {/* PHẢI: NÚT NỘP BÀI (Chỉ có nút này, không có gì khác để đè) */}
        <div className="flex justify-end w-1/3">
           <button 
             onClick={() => handleSubmit(false)} 
             disabled={isSubmitting} 
             className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
           >
             {isSubmitting ? "Đang nộp..." : "Nộp bài thi"}
           </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR DANH SÁCH CÂU HỎI */}
        <AnimatePresence>
          {(isSidebarOpen || window.innerWidth >= 1024) && (
            <motion.div 
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{type: "spring", stiffness: 300, damping: 30}}
              className="absolute lg:static top-0 left-0 h-full bg-white border-r border-slate-200 z-40 w-[280px] flex flex-col shadow-2xl lg:shadow-none"
            >
              <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                  <span className="font-bold text-slate-700 flex items-center gap-2"><HelpCircle size={18}/> Danh sách câu</span>
                  <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 hover:bg-slate-200 rounded"><X size={20}/></button>
              </div>
              <div className="p-3 grid grid-cols-5 gap-2 overflow-y-auto content-start flex-1 pb-20">
                 {questions.map((q, idx) => {
                   const isDone = !!answers[q.id];
                   const isCurrent = idx === currentQIndex;
                   return (
                     <button
                       key={q.id}
                       onClick={() => { setCurrentQIndex(idx); setSidebarOpen(false); }}
                       className={`h-10 rounded-md text-sm font-bold border transition-all ${
                         isCurrent ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 ring-offset-1 scale-105' : 
                         isDone ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                       }`}
                     >
                       {idx + 1}
                     </button>
                   )
                 })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KHUNG CÂU HỎI */}
        <div className="flex-1 flex flex-col bg-slate-100 relative overflow-hidden w-full">
           <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-32">
              <div className="max-w-4xl mx-auto space-y-6">
                 
                 {/* Câu hỏi Card */}
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-indigo-50 flex justify-between items-center">
                       <span className="font-bold text-indigo-800 text-lg">Câu hỏi số {currentQIndex + 1}</span>
                       <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-wide">
                          {currentQ.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'}
                       </span>
                    </div>
                    <div className="p-6 sm:p-8 text-slate-800 text-lg leading-relaxed min-h-[120px]">
                       {renderRichContent(currentQ.content)}
                    </div>
                 </div>

                 {/* Trả lời Card */}
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
                    {currentQ.type !== 'essay' ? (
                       <div className="grid gap-4">
                          {currentQ.options?.map((opt, i) => {
                             const label = ['A','B','C','D'][i];
                             const isSelected = answers[currentQ.id] === label;
                             return (
                                <div 
                                  key={i}
                                  onClick={() => handleSelectAnswer(currentQ.id, label)}
                                  className={`group flex items-center gap-5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    isSelected ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-indigo-300 hover:bg-slate-50'
                                  }`}
                                >
                                     <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shrink-0 transition-transform duration-200 ${
                                       isSelected ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                                     }`}>
                                       {isSelected ? <CheckCircle size={20}/> : label}
                                     </div>
                                     <div className="flex-1 font-medium text-slate-700 text-base sm:text-lg">
                                        {renderRichContent(opt)}
                                     </div>
                                </div>
                             )
                          })}
                       </div>
                    ) : (
                       <textarea
                          value={answers[currentQ.id] || ""}
                          onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                          placeholder="Nhập câu trả lời tự luận của bạn vào đây..."
                          className="w-full h-56 p-5 rounded-xl border border-slate-300 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none resize-none text-lg transition-all"
                       />
                    )}
                 </div>
              </div>
           </div>

           {/* FOOTER: THANH ĐIỀU HƯỚNG */}
           <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 h-20 flex justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-30">
              <button 
                disabled={currentQIndex === 0} 
                onClick={() => setCurrentQIndex(i => i - 1)} 
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-colors"
              >
                <ChevronLeft size={20}/> Quay lại
              </button>
              
              <div className="flex items-center gap-2 font-medium text-slate-400">
                  <span className="text-slate-800 font-bold text-xl">{currentQIndex + 1}</span>
                  <span>/</span>
                  <span>{questions.length}</span>
              </div>
              
              {/* QUAN TRỌNG: Thêm margin-right (mr-24 ~ 100px) để né nút Chat bong bóng tím */}
              <div className="mr-24 sm:mr-32"> 
                <button 
                  disabled={currentQIndex === questions.length - 1} 
                  onClick={() => setCurrentQIndex(i => i + 1)} 
                  className="flex items-center gap-2 px-8 py-3 rounded-lg bg-slate-800 text-white hover:bg-slate-700 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-bold transition-all"
                >
                  Câu tiếp <ChevronRight size={20}/>
                </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  // SỬ DỤNG PORTAL ĐỂ RENDER THẲNG VÀO BODY
  return ReactDOM.createPortal(QuizInterface, document.body);
};

export default StudentQuiz;
