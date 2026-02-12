import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  memo,
} from "react";
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

type AnswerMap = Record<string, unknown>;

const DEFAULT_SCORING = {
  part1Points: 0.25,
  part2Points: 1.0,
  part3Points: 0.5,
};

const StudentQuiz: React.FC<StudentQuizProps> = ({
  studentName,
  exam,
  onFinish,
  onExit,
}) => {
  /* ================= STATE ================= */

  const questions = useMemo<Question[]>(() => exam.questions ?? [], [exam]);

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [timeLeft, setTimeLeft] = useState<number>(
    (exam.duration ?? 90) * 60
  );
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [scoreResult, setScoreResult] = useState<{
    correct: number;
    total: number;
    score: number;
  }>({
    correct: 0,
    total: 0,
    score: 0,
  });

  const finishOnceRef = useRef<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* ================= TIMER ================= */

  useEffect(() => {
    if (isFinished) return;

    if (timeLeft <= 0) {
      handleFinish();
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, isFinished]);

  /* ================= FORMAT TIME ================= */

  const formatTime = useCallback((seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }, []);

  /* ================= ANSWER HANDLERS ================= */

  const updateAnswer = useCallback(
    (questionId: string, value: unknown) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: value,
      }));
    },
    []
  );

  /* ================= SCORING ================= */

  const handleFinish = useCallback(() => {
    if (finishOnceRef.current) return;
    finishOnceRef.current = true;

    let totalScore = 0;
    let correctCount = 0;

    const config = exam.scoringConfig ?? DEFAULT_SCORING;

    questions.forEach((q) => {
      const studentAns = answers[q.id];

      if (q.type === QuestionType.MULTIPLE_CHOICE) {
        if (studentAns === q.correctAnswer) {
          totalScore += config.part1Points;
          correctCount++;
        }
      }

      else if (q.type === QuestionType.TRUE_FALSE) {
        let correctSub = 0;
        const studentTF = (studentAns ?? {}) as Record<string, boolean>;

        q.subQuestions?.forEach((sub) => {
          if (studentTF[sub.id] === sub.correctAnswer) {
            correctSub++;
          }
        });

        if (correctSub === 1) totalScore += config.part2Points * 0.1;
        else if (correctSub === 2) totalScore += config.part2Points * 0.25;
        else if (correctSub === 3) totalScore += config.part2Points * 0.5;
        else if (
          q.subQuestions &&
          correctSub === q.subQuestions.length
        ) {
          totalScore += config.part2Points;
          correctCount++;
        }
      }

      else if (q.type === QuestionType.SHORT_ANSWER) {
        const normalize = (v: unknown) =>
          v?.toString().trim().replace(",", ".");

        if (normalize(studentAns) === normalize(q.correctAnswer)) {
          totalScore += config.part3Points;
          correctCount++;
        }
      }
    });

    const finalScore = Math.min(exam.maxScore ?? 10, totalScore);

    setScoreResult({
      correct: correctCount,
      total: questions.length,
      score: finalScore,
    });

    setIsFinished(true);
    onFinish(finalScore);
  }, [answers, exam, onFinish, questions]);

  /* ================= FINISHED SCREEN ================= */

  if (isFinished) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white rounded-[40px] p-12 shadow-2xl text-center space-y-10 border border-slate-100 animate-fade-in">
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
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  /* ================= QUIZ SCREEN ================= */

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div>
          <h2 className="font-black italic">{exam.title}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase">
            Thí sinh: {studentName}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-5 py-2 bg-blue-50 text-blue-600 rounded-full font-black">
            <Clock size={16} />
            {formatTime(timeLeft)}
          </div>

          <button
            onClick={handleFinish}
            disabled={isFinished}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 hover:bg-slate-800 transition"
          >
            Nộp bài
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full py-12 px-6 space-y-12 pb-40">
        {questions.map((q, idx) => (
          <MemoQuestionCard
            key={q.id}
            num={idx + 1}
            question={q}
            answer={answers[q.id]}
            updateAnswer={updateAnswer}
          />
        ))}
      </main>

      <AiAssistant currentContext={`Thi: ${exam.title}`} />
    </div>
  );
};

/* ================= QUESTION CARD ================= */

interface QuestionCardProps {
  num: number;
  question: Question;
  answer: unknown;
  updateAnswer: (id: string, value: unknown) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  num,
  question,
  answer,
  updateAnswer,
}) => {
  return (
    <div className="bg-white rounded-3xl p-10 border space-y-6 shadow-sm hover:shadow-md transition">
      <span className="text-xs font-black text-slate-400">
        Câu {num}
      </span>

      <div className="text-lg font-bold">
        <MathPreview math={question.text} />
      </div>

      {question.type === QuestionType.MULTIPLE_CHOICE && (
        <div className="grid md:grid-cols-2 gap-6">
          {question.options?.map((opt, i) => {
            const active = answer === i;
            return (
              <button
                key={i}
                onClick={() => updateAnswer(question.id, i)}
                className={`p-5 rounded-2xl border-2 text-left transition-all ${
                  active
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <MathPreview math={opt} />
              </button>
            );
          })}
        </div>
      )}

      {question.type === QuestionType.SHORT_ANSWER && (
        <input
          value={(answer as string) ?? ""}
          onChange={(e) =>
            updateAnswer(question.id, e.target.value)
          }
          className="w-full p-6 bg-slate-900 text-white rounded-3xl text-2xl font-mono outline-none focus:ring-4 focus:ring-blue-500/20"
          placeholder="Nhập kết quả"
        />
      )}
    </div>
  );
};

const MemoQuestionCard = memo(QuestionCard);

export default memo(StudentQuiz);
