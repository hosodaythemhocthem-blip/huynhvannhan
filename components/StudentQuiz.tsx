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
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- HÀM HỖ TRỢ HIỂN THỊ HTML/ẢNH/TOÁN ---
  // Hàm này giúp biến mã <img...> thành hình ảnh thật
  const renderRichContent = (content: any) => {
    if (!content) return <span className="text-slate-400 italic">Không có nội dung</span>;
    
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);

    // Nếu nội dung chứa thẻ HTML (như hình ảnh bạn dán vào)
    if (contentStr.includes('<p>') || contentStr.includes('<img') || contentStr.includes('<div>')) {
      return (
        <div 
          className="prose max-w-none [&>img]:max-w-full [&>img]:h-auto [&>img]:rounded-lg"
          dangerouslySetInnerHTML={{ __html: contentStr }} 
        />
      );
    }
    
    // Nếu là text thường hoặc Toán học
    return <MathPreview content={contentStr} />;
  };

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
        const { data, error } = await supabase
          .from('exams')
          .select('*')
          .eq('id', examId)
          .single();

        if (error || !data) throw error;

        setExam(data);
        setTimeLeft(data.duration ? data.duration * 60 : 45 * 60);

        let parsedQuestions: Question[] = [];
        if (data.questions && Array.isArray(data.questions)) {
          parsedQuestions = data.questions;
        } else if (data.raw_content || data.content) {
            try {
                const contentStr = data.raw_content || data.content;
                const parsed = JSON.parse(contentStr);
                if (Array.isArray(parsed)) parsedQuestions = parsed;
            } catch (e) { console.error(e); }
        }

        setQuestions(parsedQuestions);

        const storageKey = `quiz_draft_${examId}_${user.id}`;
        const savedAnswers = localStorage.getItem(storageKey);
        if (savedAnswers) setAnswers(JSON.parse(savedAnswers));

      } catch (e) {
        console.error("Lỗi tải đề thi", e);
        showToast("Lỗi kết nối. Vui lòng thử lại.", "error");
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
    if (isTimeUp && !isSubmitting && exam && questions.length > 0) handleSubmit(true);
  }, [isTimeUp]);

  // --- ACTIONS ---
  const handleSelectAnswer = (qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
    // Auto save
    if(exam) localStorage.setItem(`quiz_draft_${exam.id}_${user.id}`, JSON.stringify({ ...answers, [qId]: value }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!exam) return;
    if (!autoSubmit && !window.confirm("Nộp bài ngay?")) return;

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
      
      showToast("Nộp bài thành công!", "success");
      onTabChange('dashboard'); 

    } catch (err) {
      showToast("Lỗi nộp bài.", "error");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"/>
        </div>
      );
  }

  if (!exam || questions.length === 0) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50 p-6 text-center">
            <AlertTriangle size={48} className="text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Chưa có dữ liệu câu hỏi</h2>
            <button 
                onClick={() => { localStorage.removeItem('lms_active_exam_id'); onTabChange('dashboard'); }}
                className="px-6 py-2 bg-slate-800 text-white rounded-lg mt-4"
            >
                Về trang chủ
            </button>
        </div>
      );
  }

  const currentQ = questions[currentQIndex];
  if (!currentQ) return null; 

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col h-screen w-screen overflow-hidden font-sans">
      {/* HEADER */}
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm h-16 shrink-0">
        <div className="flex items-center gap-3">
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden"><Menu size={24}/></button>
           <h2 className="font-bold text-slate-800 line-clamp-1">{exam.title}</h2>
        </div>
        <div className="flex items-center gap-3">
           <div className={`flex items-center gap-2 px-3 py-1 rounded font-mono font-bold ${timeLeft < 300 ? 'text-red-600 bg-red-50' : 'text-slate-700 bg-slate-100'}`}>
              <Clock size={16}/> {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
           </div>
           <button onClick={() => handleSubmit(false)} disabled={isSubmitting} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
             {isSubmitting ? "..." : "Nộp"}
           </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR */}
        <AnimatePresence>
          {(isSidebarOpen || window.innerWidth >= 1024) && (
            <motion.div 
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              className={`absolute lg:static top-0 left-0 h-full w-70 bg-white border-r border-slate-200 z-20 flex flex-col shadow-xl lg:shadow-none w-72`}
            >
              <div className="p-4 grid grid-cols-5 gap-2 overflow-y-auto content-start">
                 {questions.map((q, idx) => (
                   <button
                     key={idx}
                     onClick={() => { setCurrentQIndex(idx); setSidebarOpen(false); }}
                     className={`h-10 rounded text-sm font-bold border ${idx === currentQIndex ? 'bg-indigo-600 text-white' : !!answers[q.id] ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white hover:bg-slate-50'}`}
                   >
                     {idx + 1}
                   </button>
                 ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden">
           <div className="flex-1 overflow-y-auto p-4 pb-20">
              <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                 {/* Câu hỏi */}
                 <div className="p-6 border-b border-slate-100">
                    <div className="flex justify-between mb-4">
                       <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded text-sm">CÂU {currentQIndex + 1}</span>
                       <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                          {currentQ.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'}
                       </span>
                    </div>
                    {/* KHU VỰC HIỂN THỊ NỘI DUNG CÂU HỎI */}
                    <div className="text-slate-800 text-lg leading-relaxed">
                       {renderRichContent(currentQ.content)}
                    </div>
                 </div>

                 {/* Đáp án */}
                 <div className="p-6 bg-slate-50/50">
                    {currentQ.type === 'multiple_choice' ? (
                       <div className="grid gap-3">
                          {currentQ.options?.map((opt, i) => {
                             const label = ['A','B','C','D'][i];
                             const isSelected = answers[currentQ.id] === label;
                             return (
                                <div 
                                  key={i}
                                  onClick={() => handleSelectAnswer(currentQ.id, label)}
                                  className={`p-4 rounded-xl border-2 cursor-pointer flex gap-4 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
                                >
                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{label}</div>
                                     <div className="pt-1 text-slate-700 font-medium break-words w-full">
                                        {/* KHU VỰC HIỂN THỊ ĐÁP ÁN */}
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
                          placeholder="Nhập câu trả lời tự luận..."
                          className="w-full h-40 p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                       />
                    )}
                 </div>
              </div>
           </div>

           {/* Footer Nav */}
           <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-3 flex justify-between items-center shadow-lg">
              <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(i => i - 1)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 font-bold text-slate-600"><ChevronLeft size={20}/> Trước</button>
              <span className="font-bold text-slate-400 text-sm hidden sm:block">{currentQIndex + 1} / {questions.length}</span>
              <button disabled={currentQIndex === questions.length - 1} onClick={() => setCurrentQIndex(i => i + 1)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 font-bold">Sau <ChevronRight size={20}/></button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StudentQuiz;
