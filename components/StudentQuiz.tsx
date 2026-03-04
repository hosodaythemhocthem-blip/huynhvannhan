import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  Clock, Menu, CheckCircle, X, Trophy, Home, ChevronLeft, ChevronRight, AlertCircle, Eye
} from 'lucide-react';
import { Exam, Question, User } from '../types';
import MathPreview from './MathPreview';
import { quizService } from '../services/quizService';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';

interface Props {
  user: User;
  onTabChange: (tab: string) => void;
}

const StudentQuiz: React.FC<Props> = ({ user, onTabChange }) => {
  // --- STATE ---
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState<{score: number, total: number, detailLog: string[]} | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // State quản lý chế độ xem lại bài
  const [isReviewMode, setIsReviewMode] = useState(false);

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

      let parsedQuestions: any[] = [];
      if (data.questions && Array.isArray(data.questions)) parsedQuestions = data.questions;
      else if (data.content) {
          try {
             parsedQuestions = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
          } catch (e) {}
      }
      
      if (!Array.isArray(parsedQuestions) && (parsedQuestions as any)?.questions) {
          parsedQuestions = (parsedQuestions as any).questions;
      }
      
      if (!Array.isArray(parsedQuestions)) parsedQuestions = [];

      const sanitized = parsedQuestions.map((q, index) => ({
          ...q, 
          id: q.id || `fixed_q_${index}`,
          correct_option: q.correct_option || q.correctAnswer || q.correct_answer || q.answer || q.correct || q.right_answer || q.dap_an_dung || q.dapan || q.correctOption
      }));
      
      console.log("Dữ liệu câu hỏi đã tải:", sanitized);
      setQuestions(sanitized);

      const savedAnswers = localStorage.getItem(`quiz_draft_${examId}_${user.id}`);
      if (savedAnswers) setAnswers(JSON.parse(savedAnswers));

    } catch (e) {
      console.error(e);
      alert("Lỗi tải đề thi. Vui lòng thử lại.");
    }
  };

  // --- TIMER ---
  useEffect(() => {
    if (!exam || isSubmitting || questions.length === 0 || resultData || isReviewMode) return;
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
  }, [exam, isSubmitting, questions.length, resultData, isReviewMode]);

  // --- HÀM TÍNH ĐIỂM THÔNG MINH ---
  const calculateLocalScore = () => {
    let correctCount = 0;
    const logs: string[] = []; 
    
    questions.forEach((q, idx) => {
      if (q.type !== 'essay') {
        const userAnsRaw = answers[q.id]; 
        const userAns = (userAnsRaw || "").trim().toUpperCase();
        
        let correctAnsRaw = q.correct_option;
        let correctAns = (String(correctAnsRaw || "")).trim().toUpperCase();
        
        if (correctAns === "0") correctAns = "A";
        else if (correctAns === "1") correctAns = "B";
        else if (correctAns === "2") correctAns = "C";
        else if (correctAns === "3") correctAns = "D";
        
        const isCorrect = userAns && correctAns && userAns === correctAns;
        
        logs.push(`Câu ${idx + 1}: Bạn chọn [${userAns || "Trống"}] - Đáp án đúng [${correctAns || "KHÔNG TÌM THẤY"}] -> ${isCorrect ? "✅ ĐÚNG" : "❌ SAI"}`);

        if (isCorrect) correctCount++;
      }
    });

    const totalQ = questions.length;
    const score = totalQ === 0 ? 0 : (correctCount / totalQ) * 10;
    return { 
      score: Math.round(score * 100) / 100,
      logs: logs
    };
  };

  const handleSafeSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !window.confirm("Bạn chắc chắn muốn nộp bài?")) return;
    setIsSubmitting(true);
    
    const { score, logs } = calculateLocalScore();
    const finalResult = { score: score, total: 10, detailLog: logs };
    
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
      setSaveError(null);

    } catch (err: any) {
      console.error("Service failed, trying direct insert...", err);
      try {
          const { error: directError } = await supabase.from('submissions').insert([{
              exam_id: exam?.id,
              student_id: user.id,
              answers: answers,
              score: score,
              completed_at: new Date().toISOString()
          }]);
          
          if (directError) throw directError;
          setSaveError(null);
          
      } catch (finalErr: any) {
          console.error("Lỗi lưu cuối cùng:", finalErr);
          setSaveError("Lỗi kết nối CSDL. Vui lòng chụp màn hình kết quả.");
      }
    } finally {
      setResultData(finalResult);
      setIsSubmitting(false);
    }
  };

  const handleSelectAnswer = (qId: string, value: string) => {
    if (isReviewMode) return; 

    const newAnswers = { ...answers, [qId]: value };
    setAnswers(newAnswers);
    if(exam) localStorage.setItem(`quiz_draft_${exam.id}_${user.id}`, JSON.stringify(newAnswers));
  };

  const renderRichContent = (content: any) => {
    if (!content) return <span className="text-slate-400 italic">...</span>;
    let str = typeof content === 'string' ? content : content?.text || "";
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
      
      {/* MODAL KẾT QUẢ */}
      {resultData && !isReviewMode && (
        <div className="absolute inset-0 z-[1000000] bg-slate-900/95 backdrop-blur flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
           <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-lg w-full text-center relative my-auto">
             
             {saveError ? (
               <div className="mb-6 bg-red-50 border border-red-100 p-3 rounded-lg flex gap-3 text-left">
                 <AlertCircle className="text-red-500 shrink-0" />
                 <p className="text-sm text-red-600">
                   <strong>Thông báo hệ thống:</strong> {saveError} <br/>
                   (Kết quả của bạn vẫn hợp lệ, hãy chụp màn hình gửi Giáo viên).
                 </p>
               </div>
             ) : (
               <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                 <Trophy className="text-green-600" size={32} />
               </div>
             )}

             <h2 className="text-2xl font-bold text-slate-800">Kết quả bài làm</h2>
             <div className="py-6">
                <span className="text-6xl font-black text-indigo-600">{resultData.score}</span>
                <span className="text-xl text-slate-400 font-medium">/10</span>
             </div>

             <div className="mb-6">
               <button 
                 onClick={() => setShowDebug(!showDebug)}
                 className="text-sm text-indigo-600 underline hover:text-indigo-800 flex items-center justify-center gap-1 mx-auto"
               >
                  <Eye size={14}/> {showDebug ? "Ẩn chi tiết chấm điểm" : "Tại sao tôi được điểm này?"}
               </button>
               
               {showDebug && (
                 <div className="mt-4 p-3 bg-slate-100 rounded-lg text-left max-h-48 overflow-y-auto text-xs font-mono text-slate-600 border border-slate-200">
                    {resultData.detailLog.map((log, i) => (
                      <div key={i} className={`mb-1 pb-1 border-b border-slate-200 last:border-0 ${log.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>
                        {log}
                      </div>
                    ))}
                    <div className="mt-2 text-slate-400 italic">
                      *Lưu ý: Nếu thấy "Đáp án đúng [KHÔNG TÌM THẤY]", nghĩa là dữ liệu đề thi chưa nhập đáp án.
                    </div>
                 </div>
               )}
             </div>

             <div className="flex flex-col gap-3">
               <button 
                 onClick={() => setIsReviewMode(true)}
                 className="w-full bg-indigo-100 text-indigo-700 py-3 rounded-xl font-bold hover:bg-indigo-200 transition-all border border-indigo-200"
               >
                 Xem lại bài làm
               </button>
               
               <button 
                 onClick={() => onTabChange('dashboard')}
                 className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition-all"
               >
                 Về trang chủ
               </button>
             </div>
           </div>
        </div>
      )}

      {/* HEADER BÀI THI */}
      <div className="bg-white h-16 px-4 flex items-center justify-between shadow-sm shrink-0 z-50">
         <div className="flex items-center gap-3 w-1/3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded"><Menu/></button>
            <h1 className="font-bold text-slate-700 truncate hidden sm:block">
              {exam.title} {isReviewMode && <span className="text-indigo-600 ml-2">(Chế độ xem lại)</span>}
            </h1>
         </div>
         <div className="flex justify-center w-1/3">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono font-bold border ${timeLeft < 300 && !isReviewMode ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-100 text-slate-700'}`}>
              <Clock size={18}/> {isReviewMode ? "Đã nộp bài" : formatTime(timeLeft)}
            </div>
         </div>
         <div className="flex justify-end w-1/3">
            {isReviewMode ? (
               <button onClick={() => onTabChange('dashboard')} className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-lg font-bold shadow transition-all flex items-center gap-2">
                 <Home size={18}/> Thoát
               </button>
            ) : (
               <button onClick={() => handleSafeSubmit(false)} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold shadow transition-all">
                 {isSubmitting ? "..." : "Nộp bài"}
               </button>
            )}
         </div>
      </div>

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
                 {questions.map((q, idx) => {
                   let btnClass = "bg-white text-slate-500 border-slate-200";
                   
                   if (isReviewMode) {
                     const userAns = (answers[q.id] || "").trim().toUpperCase();
                     let correctAns = (String(q.correct_option || "")).trim().toUpperCase();
                     if (correctAns === "0") correctAns = "A"; else if (correctAns === "1") correctAns = "B"; else if (correctAns === "2") correctAns = "C"; else if (correctAns === "3") correctAns = "D";
                     
                     if (userAns === correctAns) {
                       btnClass = "bg-green-100 text-green-700 border-green-300"; // Đúng
                     } else if (userAns) {
                       btnClass = "bg-red-100 text-red-700 border-red-300"; // Sai
                     } else {
                       btnClass = "bg-slate-100 text-slate-400 border-slate-200"; // Bỏ trống
                     }
                   } else if (answers[q.id]) {
                     btnClass = "bg-emerald-100 text-emerald-700 border-emerald-300"; // Đã làm
                   }

                   if (idx === currentQIndex) {
                     btnClass = "bg-indigo-600 text-white border-indigo-600"; // Đang chọn
                   }

                   return (
                     <button key={q.id} onClick={() => {setCurrentQIndex(idx); setSidebarOpen(false)}}
                       className={`h-9 rounded text-xs font-bold border transition-all ${btnClass}`}
                     >
                       {idx + 1}
                     </button>
                   );
                 })}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex-1 flex flex-col relative bg-slate-50">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
             <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
                   <div className="mb-4 flex gap-2">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded text-xs font-bold uppercase">Câu {currentQIndex + 1}</span>
                      {isReviewMode && (
                        <span className="text-xs font-semibold px-2 py-1 rounded flex items-center gap-1 bg-indigo-50 text-indigo-600">
                           Xem lại
                        </span>
                      )}
                   </div>
                   <div className="text-lg text-slate-800 leading-relaxed font-medium">
                      {renderRichContent(currentQ.content)}
                   </div>
                </div>

                {/* VÙNG CHỨA CÁC ĐÁP ÁN A, B, C, D */}
                <div className="grid gap-3">
                  {currentQ.options?.map((opt, i) => {
                     const label = ['A','B','C','D'][i];
                     const isSelected = answers[currentQ.id] === label;
                     
                     let optionClass = 'border-transparent shadow-sm hover:border-indigo-200 bg-white';
                     let iconBg = 'bg-slate-100 text-slate-500';
                     let iconContent: React.ReactNode = label;

                     if (isReviewMode) {
                        let correctAns = (String(currentQ.correct_option || "")).trim().toUpperCase();
                        if (correctAns === "0") correctAns = "A"; else if (correctAns === "1") correctAns = "B"; else if (correctAns === "2") correctAns = "C"; else if (correctAns === "3") correctAns = "D";
                        
                        const isCorrectOption = label === correctAns;

                        if (isCorrectOption) {
                           optionClass = 'border-green-500 bg-green-50 z-10';
                           iconBg = 'bg-green-500 text-white';
                           iconContent = <CheckCircle size={16}/>;
                        } else if (isSelected && !isCorrectOption) {
                           optionClass = 'border-red-500 bg-red-50 z-10';
                           iconBg = 'bg-red-500 text-white';
                           iconContent = <X size={16}/>;
                        } else {
                           optionClass = 'border-slate-200 bg-white opacity-60';
                           iconBg = 'bg-slate-100 text-slate-400';
                        }
                     } else {
                        if (isSelected) {
                           optionClass = 'border-indigo-500 bg-indigo-50 z-10';
                           iconBg = 'bg-indigo-500 text-white';
                           iconContent = <CheckCircle size={16}/>;
                        }
                     }

                     return (
                       <div key={i} onClick={() => handleSelectAnswer(currentQ.id, label)}
                         className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${isReviewMode ? 'cursor-default' : 'cursor-pointer'} ${optionClass}`}
                       >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${iconBg}`}>
                             {iconContent}
                          </div>
                          <div className="flex-1 text-slate-700 text-lg">{renderRichContent(opt)}</div>
                       </div>
                     )
                  })}
                </div>

                {/* ✨ KHUNG HIỂN THỊ LỜI GIẢI CHI TIẾT (CHỈ HIỆN Ở CHẾ ĐỘ XEM LẠI) ✨ */}
                {isReviewMode && currentQ.explanation && (
                  <div className="mt-8 p-5 bg-indigo-50 border border-indigo-200 rounded-xl animate-fade-in shadow-sm">
                    <h4 className="font-bold text-indigo-800 mb-4 flex items-center gap-2 border-b border-indigo-200 pb-2">
                      <CheckCircle size={20} className="text-indigo-600" /> Lời giải chi tiết:
                    </h4>
                    <div className="text-slate-800 text-base leading-relaxed">
                       {renderRichContent(currentQ.explanation)}
                    </div>
                  </div>
                )}

             </div>
          </div>

          <div className="absolute bottom-0 inset-x-0 h-20 bg-white border-t flex items-center justify-between px-6 z-30">
             <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(i => i - 1)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold disabled:opacity-50 transition-colors">
               <ChevronLeft size={20}/> Trước
             </button>
             <div className="mr-20 lg:mr-0"> {/* Tinh chỉnh lại margin ở responsive mobile */}
               <button disabled={currentQIndex === questions.length - 1} onClick={() => setCurrentQIndex(i => i + 1)} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 font-bold shadow-lg disabled:opacity-50 transition-colors">
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
