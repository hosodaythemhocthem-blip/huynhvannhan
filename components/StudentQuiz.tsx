import React, { useState, useEffect } from 'react';
import { 
  Clock, AlertTriangle, ChevronLeft, ChevronRight, 
  Menu, CheckCircle, X
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

  // --- HÀM RENDER NỘI DUNG (HTML/ẢNH/TOÁN) ---
  const renderRichContent = (content: any) => {
    if (!content) return <span className="text-slate-400 italic text-sm">Không có nội dung</span>;
    
    let contentStr = "";
    if (typeof content === 'string') contentStr = content;
    else if (typeof content === 'object' && content.text) contentStr = content.text;
    else contentStr = JSON.stringify(content);

    // Xử lý HTML/Ảnh
    if (contentStr.includes('<img') || contentStr.includes('<p>') || contentStr.includes('<div>')) {
      return (
        <div 
          className="prose max-w-none [&>img]:max-w-full [&>img]:h-auto [&>img]:rounded-lg [&>img]:shadow-sm [&>p]:mb-2"
          dangerouslySetInnerHTML={{ __html: contentStr }} 
        />
      );
    }
    return <MathPreview content={contentStr} />;
  };

  // --- INIT DATA ---
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
            } catch (e) { console.error(e); }
        }

        // Tự động tạo ID nếu thiếu để tránh lỗi chọn trùng
        const sanitizedQuestions = parsedQuestions.map((q, index) => ({
            ...q,
            id: q.id || `q_${index}_${Date.now()}`,
            options: q.options || []
        }));

        setQuestions(sanitizedQuestions);

        const storageKey = `quiz_draft_${examId}_${user.id}`;
        const savedAnswers = localStorage.getItem(storageKey);
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

  useEffect(() => {
    if (isTimeUp && !isSubmitting) handleSubmit(true);
  }, [isTimeUp]);

  // --- ACTIONS ---
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
        exam_id: exam.id,
        student_id: user.id,
        answers: answers,
        score: score,
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

  if (isLoading) return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"/>
    </div>
  );

  if (!exam || questions.length === 0) return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Đề thi bị lỗi hoặc chưa có câu hỏi</h2>
        <button onClick={() => { localStorage.removeItem('lms_active_exam_id'); onTabChange('dashboard'); }} className="mt-6 px-6 py-3 bg-slate-800 text-white rounded-lg font-bold">Thoát ra</button>
    </div>
  );

  const currentQ = questions[currentQIndex];
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    // Z-INDEX CAO ĐỂ CHE HEADER CŨ
    <div className="fixed inset-0 bg-slate-100 z-[9999] flex flex-col h-screen w-screen font-sans">
      
      {/* --- HEADER MỚI: CLEAN & RÕ RÀNG --- */}
      <div className="bg-white border-b px-4 h-16 shrink-0 flex items-center justify-between shadow-sm relative z-40">
        
        {/* TRÁI: Menu & Tên đề */}
        <div className="flex items-center gap-3 flex-1">
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg lg:hidden">
             <Menu size={24} className="text-slate-700"/>
           </button>
           <div className="hidden sm:block">
               <h1 className="font-bold text-slate-800 truncate max-w-[200px] lg:max-w-xs" title={exam.title}>{exam.title}</h1>
           </div>
        </div>

        {/* GIỮA: Đồng hồ (Nổi bật) */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
           <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xl font-bold shadow-sm border ${
             timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
           }`}>
              <Clock size={20}/> 
              {formatTime(timeLeft)}
           </div>
        </div>

        {/* PHẢI: Nút nộp bài */}
        <div className="flex-1 flex justify-end">
           <button 
             onClick={() => handleSubmit(false)} 
             disabled={isSubmitting} 
             className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow-md shadow-indigo-200 transition-transform active:scale-95"
           >
             {isSubmitting ? "..." : "Nộp bài"}
           </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR DANH SÁCH CÂU HỎI */}
        <AnimatePresence>
          {(isSidebarOpen || window.innerWidth >= 1024) && (
            <motion.div 
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              className="absolute lg:static top-0 left-0 h-full bg-white border-r border-slate-200 z-30 w-[280px] flex flex-col shadow-2xl lg:shadow-none"
            >
              <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                  <span className="font-bold text-slate-700">Câu hỏi ({questions.length})</span>
                  <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X size={20}/></button>
              </div>
              <div className="p-3 grid grid-cols-5 gap-2 overflow-y-auto content-start flex-1">
                 {questions.map((q, idx) => {
                   const isDone = !!answers[q.id];
                   const isCurrent = idx === currentQIndex;
                   return (
                     <button
                       key={q.id}
                       onClick={() => { setCurrentQIndex(idx); setSidebarOpen(false); }}
                       className={`h-10 rounded-lg text-sm font-bold border transition-all ${
                         isCurrent ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 ring-offset-1' : 
                         isDone ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-white hover:bg-slate-50 text-slate-600'
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

        {/* NỘI DUNG CHÍNH */}
        <div className="flex-1 flex flex-col bg-slate-100 relative overflow-hidden w-full">
           <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-28">
              <div className="max-w-4xl mx-auto space-y-6">
                 
                 {/* Khối Câu hỏi */}
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-indigo-50/50 px-6 py-4 border-b border-indigo-50 flex justify-between items-center">
                       <span className="font-bold text-indigo-700 text-lg">Câu hỏi {currentQIndex + 1}</span>
                       <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded border">
                          {currentQ.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'}
                       </span>
                    </div>
                    <div className="p-6 text-slate-800 text-lg leading-relaxed min-h-[100px]">
                       {renderRichContent(currentQ.content)}
                    </div>
                 </div>

                 {/* Khối Trả lời */}
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    {currentQ.type !== 'essay' ? (
                       <div className="grid gap-4">
                          {currentQ.options?.map((opt, i) => {
                             const label = ['A','B','C','D'][i];
                             const isSelected = answers[currentQ.id] === label;
                             return (
                                <div 
                                  key={i}
                                  onClick={() => handleSelectAnswer(currentQ.id, label)}
                                  className={`group flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                                  }`}
                                >
                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                                       isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                                     }`}>
                                       {isSelected ? <CheckCircle size={16}/> : label}
                                     </div>
                                     <div className="pt-1 flex-1 break-words font-medium text-slate-700">
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
                          placeholder="Nhập câu trả lời..."
                          className="w-full h-48 p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                       />
                    )}
                 </div>

              </div>
           </div>

           {/* Footer Điều hướng */}
           <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex justify-between items-center shadow-lg z-20">
              <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(i => i - 1)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 font-bold text-slate-600">
                <ChevronLeft size={20}/> Trước
              </button>
              
              <span className="font-bold text-slate-400">
                  {currentQIndex + 1} <span className="font-normal mx-1">/</span> {questions.length}
              </span>
              
              <button disabled={currentQIndex === questions.length - 1} onClick={() => setCurrentQIndex(i => i + 1)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 font-bold">
                Sau <ChevronRight size={20}/>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StudentQuiz;
