import React, { useState, useEffect } from 'react';
import { 
  Clock, AlertTriangle, ChevronLeft, ChevronRight, 
  Menu, CheckCircle
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

  // --- 1. HÀM XỬ LÝ HIỂN THỊ HTML & ẢNH (FIX LỖI HIỆN MÃ CODE) ---
  const renderRichContent = (content: any) => {
    if (!content) return <span className="text-slate-400 italic">Không có nội dung</span>;
    
    // Nếu nội dung là object (vd: {text: "..."}), lấy phần text hoặc stringify
    let contentStr = "";
    if (typeof content === 'string') contentStr = content;
    else if (typeof content === 'object' && content.text) contentStr = content.text;
    else contentStr = JSON.stringify(content);

    // Xử lý hiển thị ảnh base64 hoặc thẻ HTML
    if (contentStr.includes('<img') || contentStr.includes('<p>') || contentStr.includes('<div>')) {
      return (
        <div 
          className="prose max-w-none [&>img]:max-w-full [&>img]:h-auto [&>img]:rounded-lg [&>p]:mb-2"
          dangerouslySetInnerHTML={{ __html: contentStr }} 
        />
      );
    }
    
    return <MathPreview content={contentStr} />;
  };

  // --- 2. TẢI ĐỀ THI & TỰ ĐỘNG TẠO ID NẾU THIẾU (FIX LỖI CHỌN 1 ĐƯỢC TẤT CẢ) ---
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

        // Lấy danh sách câu hỏi
        let parsedQuestions: Question[] = [];
        if (data.questions && Array.isArray(data.questions)) {
          parsedQuestions = data.questions;
        } else if (data.content) {
            try {
                const parsed = JSON.parse(data.content);
                if (Array.isArray(parsed)) parsedQuestions = parsed;
            } catch (e) { console.error(e); }
        }

        // --- QUAN TRỌNG: VÁ LỖI ID ---
        // Duyệt qua từng câu, nếu không có id thì tự tạo id mới dựa vào index
        const sanitizedQuestions = parsedQuestions.map((q, index) => ({
            ...q,
            id: q.id || `auto_gen_id_${index}_${Date.now()}`, // Tự sinh ID nếu thiếu
            options: q.options || [] // Đảm bảo options luôn là mảng
        }));

        setQuestions(sanitizedQuestions);

        // Khôi phục bài làm nếu lỡ tải lại trang
        const storageKey = `quiz_draft_${examId}_${user.id}`;
        const savedAnswers = localStorage.getItem(storageKey);
        if (savedAnswers) setAnswers(JSON.parse(savedAnswers));

      } catch (e) {
        console.error("Lỗi tải đề thi", e);
        showToast("Lỗi kết nối hoặc dữ liệu đề hỏng.", "error");
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
    // Cập nhật đáp án vào state
    const newAnswers = { ...answers, [qId]: value };
    setAnswers(newAnswers);
    
    // Lưu nháp vào LocalStorage phòng khi lỡ tay tắt tab
    if(exam) localStorage.setItem(`quiz_draft_${exam.id}_${user.id}`, JSON.stringify(newAnswers));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!exam) return;
    if (!autoSubmit && !window.confirm("Bạn chắc chắn muốn nộp bài chứ?")) return;

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
      
      // Xóa dữ liệu nháp
      localStorage.removeItem(`quiz_draft_${exam.id}_${user.id}`);
      localStorage.removeItem('lms_active_exam_id');
      
      showToast(`Nộp bài thành công! Điểm số: ${score}`, "success");
      onTabChange('dashboard'); 

    } catch (err) {
      console.error(err);
      showToast("Lỗi nộp bài. Vui lòng thử lại!", "error");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
            <div className="flex flex-col items-center gap-3">
                <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"/>
                <p className="text-slate-500 font-medium">Đang tải đề thi...</p>
            </div>
        </div>
      );
  }

  if (!exam || questions.length === 0) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50 p-6 text-center">
            <AlertTriangle size={48} className="text-orange-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Đề thi chưa sẵn sàng</h2>
            <p className="text-slate-500 mb-6">Giáo viên chưa nhập câu hỏi cho đề này.</p>
            <button 
                onClick={() => { localStorage.removeItem('lms_active_exam_id'); onTabChange('dashboard'); }}
                className="px-6 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
            >
                Quay về Trang chủ
            </button>
        </div>
      );
  }

  const currentQ = questions[currentQIndex];

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col h-screen w-screen overflow-hidden font-sans">
      {/* HEADER */}
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm h-16 shrink-0 z-30">
        <div className="flex items-center gap-3">
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 hover:bg-slate-100 rounded-full"><Menu size={24}/></button>
           <div className="flex flex-col">
               <h2 className="font-bold text-slate-800 line-clamp-1 text-sm sm:text-base">{exam.title}</h2>
               <span className="text-xs text-slate-500">{questions.length} câu hỏi</span>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold border ${timeLeft < 300 ? 'text-red-600 bg-red-50 border-red-200 animate-pulse' : 'text-indigo-700 bg-indigo-50 border-indigo-100'}`}>
              <Clock size={18}/> 
              <span>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
           </div>
           <button onClick={() => handleSubmit(false)} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md shadow-indigo-200 transition-all">
             {isSubmitting ? "Đang nộp..." : "Nộp bài"}
           </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR (Danh sách câu hỏi) */}
        <AnimatePresence>
          {(isSidebarOpen || window.innerWidth >= 1024) && (
            <motion.div 
              initial={{ x: -280, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`absolute lg:static top-0 left-0 h-full bg-white border-r border-slate-200 z-20 flex flex-col shadow-2xl lg:shadow-none w-[280px]`}
            >
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="font-bold text-slate-700">Danh sách câu hỏi</h3>
                  <div className="text-xs text-slate-500 mt-1">Xanh: Đã làm • Trắng: Chưa làm</div>
              </div>
              <div className="p-4 grid grid-cols-5 gap-2 overflow-y-auto content-start flex-1">
                 {questions.map((q, idx) => {
                   const isDone = !!answers[q.id];
                   const isCurrent = idx === currentQIndex;
                   return (
                     <button
                       key={q.id} // Dùng q.id đã được sanitize (đảm bảo không trùng)
                       onClick={() => { setCurrentQIndex(idx); setSidebarOpen(false); }}
                       className={`
                         relative h-10 rounded-lg text-sm font-bold border transition-all
                         ${isCurrent ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105 z-10' : 
                           isDone ? 'bg-green-100 text-green-700 border-green-300' : 
                           'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}
                       `}
                     >
                       {idx + 1}
                       {isDone && !isCurrent && <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full -mr-0.5 -mt-0.5" />}
                     </button>
                   )
                 })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden w-full">
           <div className="flex-1 overflow-y-auto p-3 sm:p-6 pb-24 scroll-smooth">
              <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                 {/* Nội dung câu hỏi */}
                 <div className="p-6 border-b border-slate-100 bg-white">
                    <div className="flex justify-between items-center mb-4">
                       <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-sm border border-indigo-100">
                          Câu hỏi {currentQIndex + 1}
                       </span>
                       <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded uppercase tracking-wider">
                          {currentQ.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'}
                       </span>
                    </div>
                    
                    {/* Render nội dung câu hỏi (đã fix lỗi hiển thị mã HTML) */}
                    <div className="text-slate-800 text-lg leading-relaxed font-medium min-h-[60px]">
                       {renderRichContent(currentQ.content)}
                    </div>
                 </div>

                 {/* Khu vực trả lời */}
                 <div className="p-6 bg-slate-50/50">
                    {currentQ.type !== 'essay' ? (
                       <div className="grid gap-3">
                          {currentQ.options?.map((opt, i) => {
                             const label = ['A','B','C','D'][i];
                             const isSelected = answers[currentQ.id] === label;
                             return (
                                <div 
                                  key={i}
                                  onClick={() => handleSelectAnswer(currentQ.id, label)}
                                  className={`
                                    group p-4 rounded-xl border-2 cursor-pointer flex gap-4 transition-all items-start
                                    ${isSelected 
                                      ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'}
                                  `}
                                >
                                     <div className={`
                                       w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 transition-colors mt-0.5
                                       ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'}
                                     `}>
                                       {isSelected ? <CheckCircle size={18}/> : label}
                                     </div>
                                     <div className={`pt-1 font-medium break-words w-full ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                        {renderRichContent(opt)}
                                     </div>
                                </div>
                             )
                          })}
                       </div>
                    ) : (
                       <div className="relative">
                         <textarea
                            value={answers[currentQ.id] || ""}
                            onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                            placeholder="Nhập câu trả lời tự luận của bạn tại đây..."
                            className="w-full h-48 p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-slate-700 bg-white shadow-inner"
                         />
                         <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                            {answers[currentQ.id]?.length || 0} ký tự
                         </div>
                       </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Footer Nav */}
           <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 sm:px-6 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
              <button 
                disabled={currentQIndex === 0} 
                onClick={() => setCurrentQIndex(i => i - 1)} 
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-slate-600 transition-colors"
              >
                <ChevronLeft size={20}/> <span className="hidden sm:inline">Câu trước</span>
              </button>
              
              <div className="font-bold text-slate-400 text-sm">
                {currentQIndex + 1} <span className="text-slate-300 mx-1">/</span> {questions.length}
              </div>
              
              <button 
                disabled={currentQIndex === questions.length - 1} 
                onClick={() => setCurrentQIndex(i => i + 1)} 
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-colors shadow-lg shadow-slate-200"
              >
                <span className="hidden sm:inline">Câu sau</span> <ChevronRight size={20}/>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StudentQuiz;
