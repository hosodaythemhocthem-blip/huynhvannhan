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

  // --- 1. HÀM HIỂN THỊ NỘI DUNG (GIỮ NGUYÊN FIX HTML/ẢNH) ---
  const renderRichContent = (content: any) => {
    if (!content) return <span className="text-slate-400 italic text-sm">Không có nội dung</span>;
    
    let contentStr = "";
    if (typeof content === 'string') contentStr = content;
    else if (typeof content === 'object' && content.text) contentStr = content.text;
    else contentStr = JSON.stringify(content);

    // Xử lý HTML/Ảnh (Fix lỗi hiện mã code)
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

  // --- 2. TẢI DATA (GIỮ NGUYÊN FIX ID) ---
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

        // Tự động tạo ID để tránh lỗi chọn 1 câu dính tất cả
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

  // --- LOADING SCREEN ---
  if (isLoading) return (
    <div className="fixed inset-0 z-[99999] bg-white flex items-center justify-center">
        <div className="flex flex-col items-center">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mb-3"/>
            <p className="text-slate-500 font-medium">Đang tải đề thi...</p>
        </div>
    </div>
  );

  // --- ERROR SCREEN ---
  if (!exam || questions.length === 0) return (
    <div className="fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Đề thi chưa sẵn sàng</h2>
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
    // SỬ DỤNG z-[99999] ĐỂ ĐẢM BẢO NÓ PHỦ LÊN TẤT CẢ (HEADER CŨ, SIDEBAR CŨ)
    <div className="fixed inset-0 bg-slate-100 z-[99999] flex flex-col h-screen w-screen font-sans">
      
      {/* --- HEADER MỚI: TÁCH BIỆT HOÀN TOÀN --- */}
      <div className="bg-white px-4 h-16 shrink-0 grid grid-cols-3 items-center shadow-md relative z-50">
        
        {/* CỘT TRÁI: Menu & Tên đề */}
        <div className="flex items-center gap-3 justify-start overflow-hidden">
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg lg:hidden">
             <Menu size={24} className="text-slate-700"/>
           </button>
           <h1 className="font-bold text-slate-800 truncate text-sm sm:text-base" title={exam.title}>
               {exam.title}
           </h1>
        </div>

        {/* CỘT GIỮA: ĐỒNG HỒ (Luôn ở giữa màn hình) */}
        <div className="flex justify-center">
           <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-lg sm:text-xl font-bold border shadow-sm ${
             timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
           }`}>
              <Clock size={20} className="hidden sm:block"/> 
              {formatTime(timeLeft)}
           </div>
        </div>

        {/* CỘT PHẢI: CHỈ NÚT NỘP BÀI (KHÔNG CÓ AVATAR) */}
        <div className="flex justify-end">
           <button 
             onClick={() => handleSubmit(false)} 
             disabled={isSubmitting} 
             className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-6 py-2 rounded-lg font-bold shadow-md shadow-indigo-200 transition-transform active:scale-95 whitespace-nowrap text-sm sm:text-base"
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
              className="absolute lg:static top-0 left-0 h-full bg-white border-r border-slate-200 z-40 w-[260px] flex flex-col shadow-2xl lg:shadow-none"
            >
              <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
                  <span className="font-bold text-slate-700 text-sm">Danh sách câu ({questions.length})</span>
                  <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X size={20}/></button>
              </div>
              <div className="p-3 grid grid-cols-5 gap-2 overflow-y-auto content-start flex-1 pb-20">
                 {questions.map((q, idx) => {
                   const isDone = !!answers[q.id];
                   const isCurrent = idx === currentQIndex;
                   return (
                     <button
                       key={q.id}
                       onClick={() => { setCurrentQIndex(idx); setSidebarOpen(false); }}
                       className={`h-9 sm:h-10 rounded text-xs sm:text-sm font-bold border transition-all ${
                         isCurrent ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 ring-offset-1' : 
                         isDone ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white hover:bg-slate-50 text-slate-600'
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
           <div className="flex-1 overflow-y-auto p-3 sm:p-6 pb-32">
              <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
                 
                 {/* Khối Câu hỏi */}
                 <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-indigo-50/50 px-4 sm:px-6 py-3 border-b border-indigo-50 flex justify-between items-center">
                       <span className="font-bold text-indigo-700">Câu {currentQIndex + 1}</span>
                       <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded border uppercase">
                          {currentQ.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'}
                       </span>
                    </div>
                    {/* Render nội dung câu hỏi */}
                    <div className="p-4 sm:p-6 text-slate-800 text-base sm:text-lg leading-relaxed min-h-[80px]">
                       {renderRichContent(currentQ.content)}
                    </div>
                 </div>

                 {/* Khối Trả lời */}
                 <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
                    {currentQ.type !== 'essay' ? (
                       <div className="grid gap-3 sm:gap-4">
                          {currentQ.options?.map((opt, i) => {
                             const label = ['A','B','C','D'][i];
                             const isSelected = answers[currentQ.id] === label;
                             return (
                                <div 
                                  key={i}
                                  onClick={() => handleSelectAnswer(currentQ.id, label)}
                                  className={`group flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                                  }`}
                                >
                                     <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-colors mt-0.5 ${
                                       isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                                     }`}>
                                       {isSelected ? <CheckCircle size={16}/> : label}
                                     </div>
                                     <div className="pt-0.5 flex-1 break-words font-medium text-slate-700 text-sm sm:text-base">
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
                          className="w-full h-40 sm:h-48 p-3 sm:p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm sm:text-base"
                       />
                    )}
                 </div>
              </div>
           </div>

           {/* --- FOOTER: ĐÃ FIX LỖI BỊ BONG BÓNG CHAT CHE --- */}
           <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 sm:px-6 h-16 sm:h-20 flex justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-30 pr-20 sm:pr-6">
              
              <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(i => i - 1)} className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 font-bold text-slate-600 text-sm sm:text-base">
                <ChevronLeft size={18}/> <span className="hidden sm:inline">Trước</span>
              </button>
              
              <span className="font-bold text-slate-400 text-sm">
                  {currentQIndex + 1} / {questions.length}
              </span>
              
              {/* Thêm class "mr-12 sm:mr-0" để né nút chat trên mobile nếu cần, nhưng padding-right ở cha đã lo việc này */}
              <button disabled={currentQIndex === questions.length - 1} onClick={() => setCurrentQIndex(i => i + 1)} className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 font-bold text-sm sm:text-base shadow-lg">
                <span className="hidden sm:inline">Sau</span> <ChevronRight size={18}/>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StudentQuiz;
