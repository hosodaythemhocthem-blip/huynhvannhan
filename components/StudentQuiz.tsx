import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Clock, Send, Loader2, FileText, CheckCircle2, 
  AlertCircle, ChevronLeft, ChevronRight, Save, ShieldCheck 
} from "lucide-react";
import { Exam, User } from "../types";
import MathPreview from "./MathPreview";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./Toast";

// Khắc phục lỗi Build Vercel
const MotionDiv = motion.div as any;

interface Props {
  user: User;
  exam: Exam;
  onFinish: (score: number) => void;
}

const StudentQuiz: React.FC<Props> = ({ user, exam, onFinish }) => {
  const { showToast } = useToast();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1. Đồng bộ thời gian và nộp bài tự động
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Tự động lưu bản nháp vĩnh viễn lên Supabase mỗi khi chọn đáp án
  const selectAnswer = async (qId: string, optionIdx: number) => {
    const newAnswers = { ...answers, [qId]: optionIdx };
    setAnswers(newAnswers);

    try {
      await (supabase.from('quiz_drafts') as any).upsert({
        id: `${user.id}_${exam.id}`,
        student_id: user.id,
        exam_id: exam.id,
        answers: newAnswers,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.error("Lưu nháp thất bại");
    }
  };

  const calculateScore = () => {
    let correct = 0;
    exam.questions.forEach((q, idx) => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    return (correct / exam.questions.length) * 10;
  };

  const handleFinalSubmit = async () => {
    if (submitting) return;
    if (!confirm("Thầy Nhẫn nhắc em: Em có chắc chắn muốn nộp bài không?")) return;

    setSubmitting(true);
    const finalScore = calculateScore();

    try {
      // Lưu kết quả vĩnh viễn vào bảng Grades
      const { error } = await (supabase.from('grades') as any).insert([{
        student_id: user.id,
        student_name: user.fullName,
        exam_id: exam.id,
        exam_title: exam.title,
        score: finalScore,
        answers: answers,
        completed_at: new Date().toISOString()
      }]);

      if (error) throw error;

      // Xóa bản nháp sau khi nộp thành công
      await (supabase.from('quiz_drafts') as any).delete().eq('id', `${user.id}_${exam.id}`);

      showToast(`Nộp bài thành công! Điểm của em là: ${finalScore.toFixed(2)}`, "success");
      onFinish(finalScore);
    } catch (err) {
      showToast("Lỗi kết nối vĩnh viễn. Đang thử lại...", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentQuestion = exam.questions[currentIndex];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Header Phòng Thi */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter leading-none">{exam.title}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Học sinh: {user.fullName}</p>
          </div>
        </div>

        <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-lg ${timeLeft < 300 ? 'bg-rose-50 text-rose-500 animate-pulse' : 'bg-slate-900 text-white'}`}>
          <Clock size={20} />
          {formatTime(timeLeft)}
        </div>

        <button 
          onClick={handleFinalSubmit}
          disabled={submitting}
          className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl flex items-center gap-2"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 
          Nộp bài ngay
        </button>
      </div>

      <div className="max-w-4xl mx-auto mt-10 px-6">
        {/* Thanh tiến độ */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-4 scrollbar-hide">
          {exam.questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`min-w-[40px] h-10 rounded-xl font-black text-xs transition-all
                ${currentIndex === idx ? 'bg-indigo-600 text-white scale-110 shadow-lg' : 
                  answers[exam.questions[idx].id] !== undefined ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400 hover:bg-slate-100'}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Nội dung câu hỏi */}
        <AnimatePresence mode="wait">
          <MotionDiv
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-4 mb-8">
              <span className="px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                Câu hỏi {currentIndex + 1}
              </span>
            </div>

            <div className="mb-10">
              <MathPreview content={currentQuestion.text} className="text-xl font-bold text-slate-800 leading-relaxed" />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {currentQuestion.options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  onClick={() => selectAnswer(currentQuestion.id, oIdx)}
                  className={`group p-6 rounded-[2rem] border-2 text-left flex items-center gap-6 transition-all
                    ${answers[currentQuestion.id] === oIdx 
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-inner' 
                      : 'border-slate-50 bg-slate-50 hover:border-indigo-100 hover:bg-white'}`}
                >
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all
                    ${answers[currentQuestion.id] === oIdx ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  <MathPreview content={opt} className={`font-bold transition-all ${answers[currentQuestion.id] === oIdx ? 'text-indigo-900' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>
          </MotionDiv>
        </AnimatePresence>

        {/* Điều hướng */}
        <div className="flex justify-between mt-8">
          <button 
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(prev => prev - 1)}
            className="flex items-center gap-2 font-black text-slate-400 hover:text-indigo-600 disabled:opacity-0 transition-all"
          >
            <ChevronLeft /> CÂU TRƯỚC
          </button>
          <button 
            disabled={currentIndex === exam.questions.length - 1}
            onClick={() => setCurrentIndex(prev => prev + 1)}
            className="flex items-center gap-2 font-black text-indigo-600 hover:gap-4 transition-all disabled:opacity-0"
          >
            CÂU TIẾP THEO <ChevronRight />
          </button>
        </div>
      </div>

      {/* Footer bảo mật */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-white/50 backdrop-blur-md rounded-full border border-white shadow-xl">
        <ShieldCheck size={16} className="text-emerald-500" />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hệ thống giám sát vĩnh viễn bởi Lumina Cloud</span>
      </div>
    </div>
  );
};

export default StudentQuiz;
