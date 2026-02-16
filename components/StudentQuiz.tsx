
import React, { useState, useEffect, useCallback } from "react";
import { Clock, Send, Loader2, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Exam, User } from "../types";
import MathPreview from "./MathPreview";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  user: User;
  exam: Exam;
  onFinish: (score: number) => void;
}

const StudentQuiz: React.FC<Props> = ({ user, exam, onFinish }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const selectAnswer = async (qId: string, char: string) => {
    const newAnswers = { ...answers, [qId]: char };
    setAnswers(newAnswers);
    // Tự động lưu nháp
    await supabase.from('submissions').upsert({
      id: `${user.id}_${exam.id}_draft`,
      student_id: user.id,
      exam_id: exam.id,
      answers: newAnswers,
      is_completed: false
    });
  };

  const handleFinish = async () => {
    if (submitting) return;
    setSubmitting(true);
    
    let correctCount = 0;
    exam.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correctCount++;
    });

    const score = Number(((correctCount / exam.questions.length) * 10).toFixed(1));

    await supabase.from('submissions').insert({
      student_id: user.id,
      exam_id: exam.id,
      student_name: user.fullName,
      exam_title: exam.title,
      score,
      answers,
      is_completed: true,
      created_at: new Date().toISOString()
    });

    onFinish(score);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs < 10 ? '0' : ''}${rs}`;
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-6 flex justify-between items-center z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
            <FileText size={24} />
          </div>
          <h2 className="font-black text-slate-800 hidden md:block">{exam.title}</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className={`px-6 py-2 rounded-2xl font-black text-lg ${timeLeft < 300 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-900 text-white'}`}>
            {formatTime(timeLeft)}
          </div>
          <button onClick={() => confirm("Nộp bài ngay?") && handleFinish()} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all">
            NỘP BÀI
          </button>
        </div>
      </header>

      <div className="mt-24 space-y-12">
        {exam.questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
            <div className="flex items-center gap-4 mb-8">
              <span className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg">#{idx + 1}</span>
            </div>
            <MathPreview content={q.text} className="text-xl font-bold text-slate-800 leading-relaxed mb-8" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(q.options || []).map((opt, oIdx) => {
                const char = String.fromCharCode(65 + oIdx);
                const isSelected = answers[q.id] === char;
                return (
                  <button
                    key={oIdx}
                    onClick={() => selectAnswer(q.id, char)}
                    className={`p-6 rounded-2xl border-2 text-left flex items-center gap-4 transition-all
                      ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-transparent hover:border-indigo-100'}`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isSelected ? 'bg-white text-indigo-600' : 'bg-white text-slate-400'}`}>
                      {char}
                    </span>
                    <MathPreview content={opt} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentQuiz;
