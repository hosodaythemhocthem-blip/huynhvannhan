import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { 
  Clock, Menu, CheckCircle, X, Trophy, Home, ChevronLeft, ChevronRight, AlertCircle, Eye, AlertTriangle
} from 'lucide-react';
import { Exam, Question, User } from '../types';
import MathPreview from './MathPreview';
import { quizService } from '../services/quizService';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';

interface Props {
  user: User;
  exam: Exam; // Đã sửa: Nhận trực tiếp exam từ Props
  onClose: () => void; // Đã sửa: Dùng onClose để đóng bài thi
}

const StudentQuiz: React.FC<Props> = ({ user, exam, onClose }) => {
  // --- STATE ---
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  // Đồng bộ với time_limit của database (ưu tiên time_limit, mặc định 45p)
  const [timeLeft, setTimeLeft] = useState((exam.time_limit || 45) * 60); 
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState<{score: number, total: number, detailLog: string[]} | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  
  // State quản lý chế độ xem lại bài
  const [isReviewMode, setIsReviewMode] = useState(false);

  // --- 1. KHỞI TẠO DỮ LIỆU ---
  useEffect(() => {
    parseExamQuestions();
    
    // Phục hồi bài làm nháp từ LocalStorage (chống mất điện/rớt mạng)
    const savedDraft = localStorage.getItem(`quiz_draft_${exam.id}_${user.id}`);
    if (savedDraft) {
      try {
        setAnswers(JSON.parse(savedDraft));
      } catch (e) {
        console.error("Lỗi đọc file nháp", e);
      }
    }
  }, [exam]);

  const parseExamQuestions = () => {
    let parsedQuestions: any[] = [];
    
    if (exam.questions && Array.isArray(exam.questions)) {
      parsedQuestions = exam.questions;
    } else if (exam.content) {
        try {
            parsedQuestions = typeof exam.content === 'string' ? JSON.parse(exam.content) : exam.content;
        } catch (e) { console.error("Lỗi parse content", e); }
    }
    
    if (!Array.isArray(parsedQuestions) && (parsedQuestions as any)?.questions) {
        parsedQuestions = (parsedQuestions as any).questions;
    }
    if (!Array.isArray(parsedQuestions)) parsedQuestions = [];

    // Lọc và làm sạch dữ liệu câu hỏi (Chuẩn hóa correct_option)
    const sanitized = parsedQuestions.map((q, index) => ({
        ...q, 
        id: q.id || `fixed_q_${index}`,
        correct_option: q.correct_option || q.correctAnswer || q.correct_answer || q.answer || q.correct || q.dapan || "A" // Mặc định A nếu lỗi data
    }));
    
    setQuestions(sanitized);
  };

  // --- 2. HỆ THỐNG ĐẾM NGƯỢC ---
  useEffect(() => {
    if (isSubmitting || questions.length === 0 || resultData || isReviewMode) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSafeSubmit(true); // Hết giờ -> Tự động nộp
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitting, questions.length, resultData, isReviewMode]);

  // --- 3. BỘ MÁY CHẤM ĐIỂM THÔNG MINH ---
  const calculateLocalScore = () => {
    let correctCount = 0;
    const logs: string[] = []; 
    
    questions.forEach((q, idx) => {
      if (q.type === 'essay') {
        logs.push(`Câu ${idx + 1}: [TỰ LUẬN] -> Chờ giáo viên chấm điểm tay.`);
        return; // Bỏ qua tự luận
      }

      const userAns = (answers[q.id] || "").trim().toUpperCase();
      let correctAns = (String(q.correct_option || "")).trim().toUpperCase();
      
      // Chuyển đổi format cũ (0,1,2,3 -> A,B,C,D)
      if (correctAns === "0") correctAns = "A";
      else if (correctAns === "1") correctAns = "B";
      else if (correctAns === "2") correctAns = "C";
      else if (correctAns === "3") correctAns = "D";
      
      const isCorrect = userAns && correctAns && userAns === correctAns;
      
      logs.push(`Câu ${idx + 1}: Chọn [${userAns || "Trống"}] - Đáp án [${correctAns}] -> ${isCorrect ? "✅ ĐÚNG" : "❌ SAI"}`);

      if (isCorrect) correctCount++;
    });

    const totalQ = questions.filter(q => q.type !== 'essay').length; // Chỉ tính điểm trắc nghiệm
    const score = totalQ === 0 ? 0 : (correctCount / totalQ) * 10;
    
    return { 
      score: Math.round(score * 100) / 100, // Làm tròn 2 chữ số thập phân
      logs: logs
    };
  };

  // --- 4. XỬ LÝ NỘP BÀI ---
  const handleSafeSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !window.confirm("Bạn đã kiểm tra kĩ chưa? Xác nhận nộp bài nhé!")) return;
    setIsSubmitting(true);
    
    const { score, logs } = calculateLocalScore();
    const finalResult = { score: score, total: 10, detailLog: logs };
    
    try {
      const payload: any = {
        exam_id: exam.id,
        student_id: user.id,
        answers: answers,
        score: score,
        completed_at: new Date().toISOString()
      };
      if (user.class_id) payload.class_id = user.class_id;

      await quizService.submitExam(payload);
      
      // Nộp thành công thì xóa file nháp
      localStorage.removeItem(`quiz_draft_${exam.id}_${user.id}`);
      setSaveError(null);

    } catch (err: any) {
      console.error("Lưu qua Service thất bại, thử insert trực tiếp...", err);
      try {
          const { error: directError } = await supabase.from('submissions').insert([{
              exam_id: exam.id,
              student_id: user.id,
              answers: answers,
              score: score,
              completed_at: new Date().toISOString()
          }]);
          
          if (directError) throw directError;
          setSaveError(null);
          localStorage.removeItem(`quiz_draft_${exam.id}_${user.id}`);
          
      } catch (finalErr: any) {
          console.error("Lỗi CSDL:", finalErr);
          setSaveError("Mạng chập chờn không thể lưu lên máy chủ. Hãy chụp màn hình kết quả này lại để làm bằng chứng nhé!");
      }
    } finally {
      setResultData(finalResult);
      setIsSubmitting(false);
    }
  };

  // --- 5. TƯƠNG TÁC UI ---
  const handleSelectAnswer = (qId: string, value: string) => {
    if (isReviewMode) return; 

    const newAnswers = { ...answers, [qId]: value };
    setAnswers(newAnswers);
    // Lưu nháp ngay lập tức
    localStorage.setItem(`quiz_draft_${exam.id}_${user.id}`, JSON.stringify(newAnswers));
  };

  const renderRichContent = (content: any) => {
    if (!content) return <span className="text-slate-400 italic">...</span>;
    let str = typeof content === 'string' ? content : content?.text || "";
    if (str.includes('<img') || str.includes('<p>')) {
       return <div className="prose max-w-none [&>img]:mx-auto [&>img]:max-h-64 [&>img]:object-contain [&>img]:rounded-xl" dangerouslySetInnerHTML={{ __html: str }} />;
    }
    return <MathPreview content={str} />;
  };

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // Tính % thanh tiến độ làm bài
  const answeredCount = Object.keys(answers).length;
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  if (questions.length === 0) return (
    <div className="fixed inset-0 bg-slate-100 z-[999999] flex flex-col items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
      <p className="font-medium text-slate-500">Đang chuẩn bị câu hỏi...</p>
    </div>
  );

  const currentQ = questions[currentQIndex];

  const QuizInterface = (
    <div className="fixed inset-0 bg-slate-50 z-[999999] flex flex-col h-screen w-screen font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* KHUNG KẾT QUẢ KHI NỘP BÀI */}
      {resultData && !isReviewMode && (
        <div className="absolute inset-0 z-[1000000] bg-slate-900/95 backdrop-blur flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
           <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center relative my-auto">
             
             {saveError ? (
               <div className="mb-6 bg-rose-50 border border-rose-100 p-4 rounded-2xl flex gap-3 text-left">
                 <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20}/>
                 <p className="text-sm text-rose-700 leading-relaxed">
                   <strong>Cảnh báo:</strong> {saveError}
                 </p>
               </div>
             ) : (
               <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                 <Trophy className="text-emerald-500" size={40} />
               </div>
             )}

             <h2 className="text-2xl font-black text-slate-800">Điểm số của bạn</h2>
             <div className="py-6 flex items-baseline justify-center gap-1">
                <span className={`text-7xl font-black ${resultData.score >= 5 ? 'text-indigo-600' : 'text-rose-500'}`}>
                  {resultData.score}
                </span>
                <span className="text-2xl text-slate-400 font-bold">/10</span>
             </div>

             <div className="mb-8">
               <button 
                 onClick={() => setShowDebug(!showDebug)}
                 className="text-sm text-slate-500 hover:text-indigo-600 font-medium flex items-center justify-center gap-1.5 mx-auto bg-slate-100 px-4 py-2 rounded-full transition-colors"
               >
                  <Eye size={16}/> {showDebug ? "Ẩn phân tích" : "Xem phân tích chấm điểm"}
               </button>
               
               {showDebug && (
                 <div className="mt-4 p-4 bg-slate-50 rounded-2xl text-left max-h-48 overflow-y-auto text-xs font-mono text-slate-600 border border-slate-200 shadow-inner">
                    {resultData.detailLog.map((log, i) => (
                      <div key={i} className={`mb-1.5 pb-1.5 border-b border-slate-200/60 last:border-0 last:mb-0 last:pb-0 ${log.includes('✅') ? 'text-emerald-600 font-semibold' : 'text-rose-500'}`}>
                        {log}
                      </div>
                    ))}
                 </div>
               )}
             </div>

             <div className="flex flex-col gap-3">
               <button 
                 onClick={() => setIsReviewMode(true)}
                 className="w-full bg-indigo-50 text-indigo-700 py-3.5 rounded-xl font-bold hover:bg-indigo-100 transition-colors border border-indigo-100"
               >
                 Xem lại bài làm
               </button>
               
               <button 
                 onClick={onClose}
                 className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl"
               >
                 Trở về trang chủ
               </button>
             </div>
           </div>
        </div>
      )}

      {/* HEADER BÀI THI */}
      <div className="bg-white h-16 px-4 sm:px-6 flex items-center justify-between shadow-sm shrink-0 z-50 relative">
         {/* Thanh Progress Bar chạy ngang mép dưới header */}
         <div className="absolute bottom-0 left-0 h-0.5 bg-slate-100 w-full">
            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
         </div>

         <div className="flex items-center gap-3 w-1/3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"><Menu size={20}/></button>
            <h1 className="font-bold text-slate-800 truncate hidden sm:block text-lg">
              {exam.title} {isReviewMode && <span className="text-indigo-600 text-sm ml-2 bg-indigo-50 px-2 py-1 rounded-md">Xem lại</span>}
            </h1>
         </div>
         
         <div className="flex justify-center w-1/3">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono font-bold border shadow-sm transition-colors
              ${timeLeft < 300 && !isReviewMode ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
              <Clock size={16}/> {isReviewMode ? "Đã nộp" : formatTime(timeLeft)}
            </div>
         </div>

         <div className="flex justify-end w-1/3">
            {isReviewMode ? (
               <button onClick={onClose} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl font-bold shadow transition-all flex items-center gap-2 text-sm sm:text-base">
                 <Home size={16}/> Thoát
               </button>
            ) : (
               <button onClick={() => handleSafeSubmit(false)} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold shadow-md shadow-indigo-200 transition-all text-sm sm:text-base">
                 {isSubmitting ? "Đang nộp..." : "Nộp bài"}
               </button>
            )}
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR DANH SÁCH CÂU HỎI */}
        <AnimatePresence>
          {(isSidebarOpen || window.innerWidth >= 1024) && (
            <motion.div 
               initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", bounce: 0, duration: 0.3 }}
               className="absolute lg:static top-0 left-0 h-full w-[280px] bg-white border-r border-slate-200 z-40 flex flex-col shadow-2xl lg:shadow-none"
            >
               <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <span className="font-bold text-slate-700">Tiến độ làm bài</span>
                 <span className="text-sm font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">{answeredCount}/{questions.length}</span>
                 <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded"><X size={18}/></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 grid grid-cols-5 gap-2 content-start pb-20 scrollbar-thin">
                 {questions.map((q, idx) => {
                   let btnClass = "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"; // Trống
                   
                   if (isReviewMode) {
                     const userAns = (answers[q.id] || "").trim().toUpperCase();
                     let correctAns = (String(q.correct_option || "")).trim().toUpperCase();
                     if (correctAns === "0") correctAns = "A"; else if (correctAns === "1") correctAns = "B"; else if (correctAns === "2") correctAns = "C"; else if (correctAns === "3") correctAns = "D";
                     
                     if (userAns === correctAns) {
                       btnClass = "bg-emerald-100 text-emerald-700 border-emerald-300"; // Đúng
                     } else if (userAns) {
                       btnClass = "bg-rose-100 text-rose-700 border-rose-300"; // Sai
                     } else {
                       btnClass = "bg-slate-100 text-slate-400 border-slate-200"; // Bỏ trống
                     }
                   } else if (answers[q.id]) {
                     btnClass = "bg-indigo-50 text-indigo-700 border-indigo-200"; // Đã làm
                   }

                   if (idx === currentQIndex) {
                     btnClass = "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200 ring-offset-1"; // Đang chọn
                   }

                   return (
                     <button key={q.id} onClick={() => {setCurrentQIndex(idx); setSidebarOpen(false)}}
                       className={`h-10 rounded-lg text-sm font-bold border transition-all ${btnClass}`}
                     >
                       {idx + 1}
                     </button>
                   );
                 })}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* KHU VỰC CHÍNH ĐỂ LÀM BÀI */}
        <div className="flex-1 flex flex-col relative">
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-28">
             <div className="max-w-3xl mx-auto space-y-6">
               
               {/* THẺ HIỂN THỊ CÂU HỎI */}
               <motion.div 
                 key={`q-${currentQIndex}`}
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                 className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 sm:p-8"
               >
                  <div className="mb-5 flex gap-2 items-center">
                     <span className="bg-slate-900 text-white px-3 py-1.5 rounded-md text-xs font-bold tracking-wider">CÂU {currentQIndex + 1}</span>
                     {isReviewMode && (
                       <span className="text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100">
                          <Eye size={14}/> Xem lại
                       </span>
                     )}
                  </div>
                  <div className="text-[17px] text-slate-800 leading-relaxed font-medium">
                     {renderRichContent(currentQ.content)}
                  </div>
               </motion.div>

               {/* VÙNG CHỨA CÁC ĐÁP ÁN */}
               <div className="grid gap-3">
                 {currentQ.options?.map((opt, i) => {
                    const label = ['A','B','C','D'][i];
                    const isSelected = answers[currentQ.id] === label;
                    
                    let optionClass = 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 bg-white';
                    let iconBg = 'bg-slate-100 text-slate-500';
                    let iconContent: React.ReactNode = label;

                    if (isReviewMode) {
                       let correctAns = (String(currentQ.correct_option || "")).trim().toUpperCase();
                       if (correctAns === "0") correctAns = "A"; else if (correctAns === "1") correctAns = "B"; else if (correctAns === "2") correctAns = "C"; else if (correctAns === "3") correctAns = "D";
                       
                       const isCorrectOption = label === correctAns;

                       if (isCorrectOption) {
                          optionClass = 'border-emerald-500 bg-emerald-50 z-10';
                          iconBg = 'bg-emerald-500 text-white';
                          iconContent = <CheckCircle size={16}/>;
                       } else if (isSelected && !isCorrectOption) {
                          optionClass = 'border-rose-400 bg-rose-50 z-10';
                          iconBg = 'bg-rose-500 text-white';
                          iconContent = <X size={16}/>;
                       } else {
                          optionClass = 'border-slate-200 bg-white opacity-50';
                          iconBg = 'bg-slate-100 text-slate-400';
                       }
                    } else {
                       if (isSelected) {
                          optionClass = 'border-indigo-600 bg-indigo-50/50 z-10 ring-1 ring-indigo-600';
                          iconBg = 'bg-indigo-600 text-white';
                          iconContent = <CheckCircle size={16}/>;
                       }
                    }

                    return (
                      <motion.div 
                        key={`${currentQIndex}-${i}`}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: i * 0.05 }}
                        onClick={() => handleSelectAnswer(currentQ.id, label)}
                        className={`flex items-start sm:items-center gap-4 p-4 rounded-xl border-2 transition-all shadow-sm ${isReviewMode ? 'cursor-default' : 'cursor-pointer'} ${optionClass}`}
                      >
                         <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${iconBg}`}>
                            {iconContent}
                         </div>
                         <div className="flex-1 text-slate-700 text-[16px] leading-relaxed pt-1 sm:pt-0">{renderRichContent(opt)}</div>
                      </motion.div>
                    )
                 })}
               </div>

               {/* LỜI GIẢI CHI TIẾT (CHỈ HIỆN KHI REVIEW MÀ CÓ ĐIỀN LỜI GIẢI TỪ TRƯỚC) */}
               {isReviewMode && currentQ.explanation && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-6 bg-amber-50 border border-amber-200/60 rounded-2xl shadow-sm">
                   <h4 className="font-bold text-amber-900 mb-4 flex items-center gap-2 border-b border-amber-200/60 pb-3 text-sm uppercase tracking-wide">
                     <CheckCircle size={18} className="text-amber-600" /> Giải thích đáp án
                   </h4>
                   <div className="text-amber-900/90 text-[15px] leading-relaxed">
                      {renderRichContent(currentQ.explanation)}
                   </div>
                 </motion.div>
               )}

             </div>
          </div>

          {/* ĐIỀU HƯỚNG BOTTOM BAR */}
          <div className="absolute bottom-0 inset-x-0 h-20 bg-white border-t border-slate-200 flex items-center justify-between px-4 sm:px-8 z-30 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
             <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(i => i - 1)} 
                className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold disabled:opacity-40 transition-colors text-sm sm:text-base">
               <ChevronLeft size={20}/> <span className="hidden sm:inline">Câu trước</span>
             </button>
             
             <button disabled={currentQIndex === questions.length - 1} onClick={() => setCurrentQIndex(i => i + 1)} 
                className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 disabled:opacity-40 transition-colors text-sm sm:text-base ml-auto">
               <span className="hidden sm:inline">Câu tiếp theo</span> <ChevronRight size={20}/>
             </button>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(QuizInterface, document.body);
};

export default StudentQuiz;
