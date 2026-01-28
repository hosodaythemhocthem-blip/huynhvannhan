
import React, { useState, useEffect } from 'react';
import { 
  Clock, Trophy, Check
} from 'lucide-react';
import { Question, Exam, QuestionType } from '../types';
import MathPreview from './MathPreview';
import AiAssistant from './AiAssistant';

interface StudentQuizProps {
  studentName: string;
  exam: Exam;
  onFinish: (score: number) => void;
  onExit: () => void;
}

const StudentQuiz: React.FC<StudentQuizProps> = ({ studentName, exam, onFinish, onExit }) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState((exam.duration || 90) * 60);
  const [isFinished, setIsFinished] = useState(false);
  const [scoreResult, setScoreResult] = useState({ correct: 0, total: 0, score: 0 });

  const questions = exam.questions || [];

  useEffect(() => {
    if (isFinished || timeLeft <= 0) {
      if (timeLeft <= 0 && !isFinished) handleFinish();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  const handleFinish = () => {
    let totalScore = 0;
    let correctCount = 0;
    const config = exam.scoringConfig || { part1Points: 0.25, part2Points: 1.0, part3Points: 0.5 };

    questions.forEach(q => {
      const studentAns = answers[q.id];
      if (q.type === QuestionType.MULTIPLE_CHOICE) {
        if (studentAns === q.correctAnswer) {
          totalScore += config.part1Points;
          correctCount++;
        }
      } 
      else if (q.type === QuestionType.TRUE_FALSE) {
        let correctSubItems = 0;
        const studentTF = studentAns || {};
        q.subQuestions?.forEach(sub => {
          if (studentTF[sub.id] === sub.correctAnswer) correctSubItems++;
        });

        // Chấm lũy tiến Phần II
        if (correctSubItems === 1) totalScore += (config.part2Points * 0.1);
        else if (correctSubItems === 2) totalScore += (config.part2Points * 0.25);
        else if (correctSubItems === 3) totalScore += (config.part2Points * 0.5);
        else if (correctSubItems === 4) { totalScore += config.part2Points; correctCount++; }
      } 
      else if (q.type === QuestionType.SHORT_ANSWER) {
        if (studentAns?.toString().trim().replace(',', '.') === q.correctAnswer?.toString().trim().replace(',', '.')) {
          totalScore += config.part3Points;
          correctCount++;
        }
      }
    });

    setScoreResult({ correct: correctCount, total: questions.length, score: Math.min(exam.maxScore, totalScore) });
    setIsFinished(true);
    onFinish(totalScore);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isFinished) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white rounded-[40px] p-12 shadow-2xl text-center space-y-10 border border-slate-100 animate-in zoom-in-95">
           <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner"><Trophy size={48} /></div>
           <div className="space-y-2">
             <h2 className="text-3xl font-black text-slate-800 italic">Nộp bài thành công!</h2>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{studentName} - {exam.title}</p>
           </div>
           <div className="py-8 border-y border-slate-100 flex justify-around">
              <div className="text-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Điểm số</p>
                 <p className="text-4xl font-black text-blue-600 tabular-nums">{scoreResult.score.toFixed(2)}</p>
              </div>
              <div className="text-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Đúng</p>
                 <p className="text-4xl font-black text-emerald-500 tabular-nums">{scoreResult.correct}/{scoreResult.total}</p>
              </div>
           </div>
           <button onClick={onExit} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-black transition-all">Quay về trang chủ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <header className="bg-white border-b border-slate-100 px-8 py-4 flex justify-between items-center sticky top-0 z-[100] shadow-sm">
        <div className="flex flex-col">
          <h2 className="text-base font-black text-slate-800 italic uppercase tracking-tight">{exam.title}</h2>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Thí sinh: {studentName}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-6 py-2 bg-blue-50 text-blue-600 rounded-full font-black text-sm tabular-nums border border-blue-100 shadow-inner">
            <Clock size={18} /> {formatTime(timeLeft)}
          </div>
          <button onClick={handleFinish} className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-black transition-all">Nộp bài</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full py-12 px-6 space-y-12 pb-40">
        {questions.some(q => q.section === 1) && <SectionHeader num={1} title="TRẮC NGHIỆM 4 LỰA CHỌN" />}
        {questions.filter(q => q.section === 1).map((q, idx) => (
          <QuestionCard key={q.id} num={idx+1} question={q}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {q.options.map((opt, i) => (
                 <button 
                   key={i} 
                   onClick={() => setAnswers({...answers, [q.id]: i})}
                   className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left group ${answers[q.id] === i ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' : 'border-slate-50 hover:border-slate-200 bg-white'}`}
                 >
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${answers[q.id] === i ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{String.fromCharCode(65+i)}</div>
                   <div className="text-sm font-bold pt-1"><MathPreview math={opt} /></div>
                 </button>
               ))}
            </div>
          </QuestionCard>
        ))}

        {questions.some(q => q.section === 2) && <SectionHeader num={2} title="TRẮC NGHIỆM ĐÚNG / SAI" />}
        {questions.filter(q => q.section === 2).map((q, idx) => (
          <QuestionCard key={q.id} num={idx+1} question={q}>
            <div className="space-y-4">
               {q.subQuestions?.map(sub => (
                 <div key={sub.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-slate-50/50 rounded-2xl gap-4 border border-slate-100">
                    <div className="flex gap-3 flex-1">
                      <span className="font-black text-slate-400">{sub.id})</span>
                      <div className="text-sm font-bold text-slate-600"><MathPreview math={sub.text} /></div>
                    </div>
                    <div className="flex bg-white rounded-xl border border-slate-100 p-1 shrink-0 shadow-sm">
                       <button onClick={() => setAnswers({...answers, [q.id]: {...(answers[q.id] || {}), [sub.id]: true}})} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${answers[q.id]?.[sub.id] === true ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Đúng</button>
                       <button onClick={() => setAnswers({...answers, [q.id]: {...(answers[q.id] || {}), [sub.id]: false}})} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${answers[q.id]?.[sub.id] === false ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Sai</button>
                    </div>
                 </div>
               ))}
            </div>
          </QuestionCard>
        ))}

        {questions.some(q => q.section === 3) && <SectionHeader num={3} title="TRẮC NGHIỆM TRẢ LỜI NGẮN" />}
        {questions.filter(q => q.section === 3).map((q, idx) => (
          <QuestionCard key={q.id} num={idx+1} question={q}>
            <input 
              type="text" 
              value={answers[q.id] || ''}
              onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
              placeholder="Nhập kết quả số..."
              className="w-full p-6 bg-slate-900 text-white rounded-3xl font-mono text-2xl outline-none focus:ring-8 focus:ring-blue-100 shadow-2xl"
            />
          </QuestionCard>
        ))}
      </main>
      <AiAssistant currentContext={`Thi THPT 2025: ${exam.title}`} />
    </div>
  );
};

const SectionHeader: React.FC<{ num: number, title: string }> = ({ num, title }) => (
  <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-xl flex items-center gap-6 border-b-4 border-blue-600 animate-in slide-in-from-left-4">
    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">{num}</div>
    <div>
      <h3 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em]">PHẦN THỨ {num}</h3>
      <p className="text-sm font-black italic mt-0.5">{title}</p>
    </div>
  </div>
);

const QuestionCard: React.FC<{ num: number, question: Question, children: React.ReactNode }> = ({ num, question, children }) => (
  <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4">
    <div className="flex items-center gap-4">
       <span className="px-4 py-1.5 bg-slate-100 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest">Câu {num}</span>
    </div>
    <div className="text-xl font-bold text-slate-700 leading-relaxed"><MathPreview math={question.text} /></div>
    {children}
  </div>
);

export default StudentQuiz;
