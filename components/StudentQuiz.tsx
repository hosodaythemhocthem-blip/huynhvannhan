import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  memo,
} from "react";
import { Clock, Trophy, RotateCcw } from "lucide-react";
import { Question, Exam, QuestionType } from "../types";
import MathPreview from "./MathPreview";
import AiAssistant from "./AiAssistant";
import { supabase } from "../supabase";

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
  const questions = useMemo<Question[]>(() => exam.questions ?? [], [exam]);

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [timeLeft, setTimeLeft] = useState<number>(
    (exam.duration ?? 90) * 60
  );
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [loadingRestore, setLoadingRestore] = useState(true);

  const finishOnceRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const saveTimeout = useRef<number | null>(null);

  /* ================= RESTORE ================= */

  useEffect(() => {
    const restore = async () => {
      const { data } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("student_name", studentName)
        .eq("exam_id", exam.id)
        .eq("completed", false)
        .maybeSingle();

      if (data) {
        setAnswers(data.answers || {});
        setTimeLeft(data.time_left);
      }

      setLoadingRestore(false);
    };

    restore();
  }, [exam.id, studentName]);

  /* ================= AUTO SAVE ================= */

  const autoSave = useCallback(() => {
    if (isFinished) return;

    if (saveTimeout.current) window.clearTimeout(saveTimeout.current);

    saveTimeout.current = window.setTimeout(async () => {
      await supabase.from("quiz_attempts").upsert({
        student_name: studentName,
        exam_id: exam.id,
        answers,
        time_left: timeLeft,
        completed: false,
      });
    }, 2000);
  }, [answers, timeLeft, studentName, exam.id, isFinished]);

  useEffect(() => {
    if (!loadingRestore) autoSave();
  }, [answers, timeLeft]);

  /* ================= TIMER ================= */

  useEffect(() => {
    if (isFinished || loadingRestore) return;

    if (timeLeft <= 0) {
      handleFinish();
      return;
    }

    timerRef.current = window.setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [timeLeft, isFinished, loadingRestore]);

  /* ================= ANSWER ================= */

  const updateAnswer = useCallback(
    (questionId: string, value: unknown) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: value,
      }));
    },
    []
  );

  const resetAnswer = useCallback((id: string) => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, []);

  /* ================= SCORING ================= */

  const handleFinish = useCallback(async () => {
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

      if (q.type === QuestionType.SHORT_ANSWER) {
        const normalize = (v: unknown) =>
          v?.toString().trim().replace(",", ".");
        if (normalize(studentAns) === normalize(q.correctAnswer)) {
          totalScore += config.part3Points;
          correctCount++;
        }
      }
    });

    const finalScore = Math.min(exam.maxScore ?? 10, totalScore);

    await supabase.from("quiz_attempts").upsert({
      student_name: studentName,
      exam_id: exam.id,
      answers,
      time_left: 0,
      score: finalScore,
      completed: true,
    });

    setIsFinished(true);
    onFinish(finalScore);
  }, [answers, exam, questions, studentName, onFinish]);

  /* ================= LOADING ================= */

  if (loadingRestore) {
    return <div className="p-10">Đang tải bài làm...</div>;
  }

  /* ================= FINISHED ================= */

  if (isFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-12 rounded-3xl shadow-xl text-center space-y-6">
          <Trophy size={48} className="mx-auto text-blue-600" />
          <h2 className="text-2xl font-black">Nộp bài thành công</h2>
          <button
            onClick={onExit}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl"
          >
            Quay về
          </button>
        </div>
      </div>
    );
  }

  /* ================= QUIZ ================= */

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white px-8 py-4 flex justify-between items-center shadow">
        <h2 className="font-black">{exam.title}</h2>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-5 py-2 bg-blue-50 text-blue-600 rounded-full font-black">
            <Clock size={16} />
            {Math.floor(timeLeft / 60)}:
            {String(timeLeft % 60).padStart(2, "0")}
          </div>

          <button
            onClick={handleFinish}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl"
          >
            Nộp bài
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full py-12 px-6 space-y-12 pb-40">
        {questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            num={idx + 1}
            question={q}
            answer={answers[q.id]}
            updateAnswer={updateAnswer}
            resetAnswer={resetAnswer}
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
  resetAnswer: (id: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = memo(
  ({ num, question, answer, updateAnswer, resetAnswer }) => {
    return (
      <div className="bg-white rounded-3xl p-10 border space-y-6 shadow-sm">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-slate-400">
            Câu {num}
          </span>

          <button
            onClick={() => resetAnswer(question.id)}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
          >
            <RotateCcw size={14} />
            Xóa
          </button>
        </div>

        <div className="text-lg font-bold">
          <MathPreview math={question.text} />
        </div>

        {question.type === QuestionType.MULTIPLE_CHOICE &&
          question.options?.map((opt, i) => (
            <button
              key={i}
              onClick={() => updateAnswer(question.id, i)}
              className={`block w-full text-left p-4 rounded-xl border ${
                answer === i
                  ? "bg-blue-50 border-blue-500"
                  : "border-slate-200"
              }`}
            >
              <MathPreview math={opt} />
            </button>
          ))}

        {question.type === QuestionType.SHORT_ANSWER && (
          <input
            value={(answer as string) ?? ""}
            onChange={(e) =>
              updateAnswer(question.id, e.target.value)
            }
            onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              updateAnswer(question.id, text.trim());
              e.preventDefault();
            }}
            className="w-full p-6 bg-slate-900 text-white rounded-3xl text-xl font-mono"
          />
        )}
      </div>
    );
  }
);

export default memo(StudentQuiz);
