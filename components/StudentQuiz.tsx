import React, { useState, useEffect } from "react";
import { Clock, Trophy } from "lucide-react";
import { Question, Exam, QuestionType } from "../types";
import MathPreview from "./MathPreview";
import AiAssistant from "./AiAssistant";

interface StudentQuizProps {
  studentName: string;
  exam: Exam;
  onFinish: (score: number) => void;
  onExit: () => void;
}

const StudentQuiz: React.FC<StudentQuizProps> = ({
  studentName,
  exam,
  onFinish,
  onExit,
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState((exam.duration || 90) * 60);
  const [isFinished, setIsFinished] = useState(false);
  const [scoreResult, setScoreResult] = useState({
    correct: 0,
    total: 0,
    score: 0,
  });

  const questions = exam.questions || [];

  /* ================= TIMER ================= */
  useEffect(() => {
    if (isFinished) return;

    if (timeLeft <= 0) {
      handleFinish();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  /* ================= CHẤM ĐIỂM ================= */
  const handleFinish = () => {
    if (isFinished) return;

    let totalScore = 0;
    let correctCount = 0;

    const config = exam.scoringConfig || {
      part1Points: 0.25,
      part2Points: 1.0,
      part3Points: 0.5,
    };

    questions.forEach((q) => {
      const studentAns = answers[q.id];

      // PHẦN I – TRẮC NGHIỆM
      if (q.type === QuestionType.MULTIPLE_CHOICE) {
        if (studentAns === q.correctAnswer) {
          totalScore += config.part1Points;
          correctCount++;
        }
      }

      // PHẦN II – ĐÚNG / SAI
      else if (q.type === QuestionType.TRUE_FALSE) {
        let correctSub = 0;
        const studentTF = studentAns || {};

        q.subQuestions?.forEach((sub) => {
          if (studentTF[sub.id] === sub.correctAnswer) correctSub++;
        });

        if (correctSub === 1) totalScore += config.part2Points * 0.1;
        else if (correctSub === 2) totalScore += config.part2Points * 0.25;
        else if (correctSub === 3) totalScore += config.part2Points * 0.5;
        else if (correctSub === 4) {
          totalScore += config.part2Points;
          correctCount++;
        }
      }

      // PHẦN III – TRẢ LỜI NGẮN
      else if (q.type === QuestionType.SHORT_ANSWER) {
        if (
          studentAns
            ?.toString()
            .trim()
            .replace(",", ".") ===
          q.correctAnswer
            ?.toString()
            .trim()
            .replace(",", ".")
        ) {
          totalScore += config.part3Points;
          correctCount++;
        }
      }
    });

    const finalScore = Math.min(exam.maxScore, totalScore);

    setScoreResult({
      correct: correctCount,
      total: questions.length,
      score: finalScore,
    });

    setIsFinished(true);
    onFinish(finalScore);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  /* ================= KẾT THÚC ================= */
  if (isFinished) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white rounded-[40px] p-12 shadow-2xl text-center space-y-10 border border-slate-100">
          <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Trophy size={48} />
          </div>

          <div>
            <h2 className="text-3xl font-black italic">
              Nộp bài thành công!
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {studentName} – {exam.title}
            </p>
          </div>

          <div className="py-6 border-y flex justify-around">
            <div>
              <p className="text-xs font-bold text-slate-400">Điểm</p>
              <p className="text-4xl font-black text-blue-600">
                {scoreResult.score.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400">Đúng</p>
              <p className="text-4xl font-black text-emerald-500">
                {scoreResult.correct}/{scoreResult.total}
              </p>
            </div>
          </div>

          <button
            onClick={onExit}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  /* ================= LÀM BÀI ================= */
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div>
          <h2 className="font-black italic">{exam.title}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase">
            Thí sinh: {studentName}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="px-5 py-2 bg-blue-50 text-blue-600 rounded-full font-black">
            <Clock size={16} /> {formatTime(timeLeft)}
          </div>
          <button
            onClick={handleFinish}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest"
          >
            Nộp bài
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full py-12 px-6 space-y-12 pb-40">
        {questions.map((q, idx) => (
          <QuestionCard key={q.id} num={idx + 1} question={q}>
            {q.type === QuestionType.MULTIPLE_CHOICE && (
              <div className="grid md:grid-cols-2 gap-6">
                {q.options?.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setAnswers({ ...answers, [q.id]: i })
                    }
                    className={`p-5 rounded-2xl border-2 text-left ${
                      answers[q.id] === i
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-100"
                    }`}
                  >
                    <MathPreview math={opt} />
                  </button>
                ))}
              </div>
            )}

            {q.type === QuestionType.SHORT_ANSWER && (
              <input
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers({
                    ...answers,
                    [q.id]: e.target.value,
                  })
                }
                className="w-full p-6 bg-slate-900 text-white rounded-3xl text-2xl font-mono"
                placeholder="Nhập kết quả"
              />
            )}
          </QuestionCard>
        ))}
      </main>

      <AiAssistant
        currentContext={`Thi THPT 2025: ${exam.title}`}
      />
    </div>
  );
};

/* ================= COMPONENT PHỤ ================= */

const QuestionCard: React.FC<{
  num: number;
  question: Question;
  children: React.ReactNode;
}> = ({ num, question, children }) => (
  <div className="bg-white rounded-3xl p-10 border space-y-6">
    <span className="text-xs font-black text-slate-400">
      Câu {num}
    </span>
    <div className="text-lg font-bold">
      <MathPreview math={question.text} />
    </div>
    {children}
  </div>
);

export default StudentQuiz;
