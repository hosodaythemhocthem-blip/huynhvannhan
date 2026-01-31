import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Sparkles, CheckCircle2, XCircle } from "lucide-react";

import { Course } from "../types";
import { generateQuiz } from "../services/geminiService";
import MathPreview from "./MathPreview";

/* =========================
   TYPES LOCAL
========================= */
interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex?: number;
}

interface Quiz {
  title: string;
  questions: QuizQuestion[];
}

interface Props {
  course: Course;
  onBack: () => void;
  onToggleLesson: (id: string) => void;
}

const CourseViewer: React.FC<Props> = ({ course, onBack }) => {
  /* =========================
     STATE
  ========================= */
  const lessons = useMemo(() => course.lessons ?? [], [course.lessons]);

  const [activeLessonId, setActiveLessonId] = useState<string | undefined>(
    lessons[0]?.id
  );

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>(
    {}
  );
  const [score, setScore] = useState<number | null>(null);

  /* =========================
     DERIVED
  ========================= */
  const activeLesson = useMemo(
    () => lessons.find((l) => l.id === activeLessonId),
    [lessons, activeLessonId]
  );

  /* =========================
     RESET khi đổi bài học
  ========================= */
  useEffect(() => {
    setQuiz(null);
    setScore(null);
    setSelectedAnswers({});
  }, [activeLessonId]);

  /* =========================
     HANDLERS
  ========================= */
  const handleGenQuiz = async () => {
    if (!activeLesson) return;

    setLoadingQuiz(true);
    setQuiz(null);
    setScore(null);
    setSelectedAnswers({});

    try {
      const questionsData = await generateQuiz(activeLesson.content);

      setQuiz({
        title: `Bài tập trắc nghiệm: ${activeLesson.title}`,
        questions: questionsData.map((q: any, index: number) => ({
          id: q.id ?? `q-${index}`,
          question: q.text || q.question,
          options: q.options ?? [],
          correctIndex: q.correctAnswer,
        })),
      });
    } catch (err) {
      console.error("Quiz generation error:", err);
      alert("Không thể sinh bài tập. Vui lòng thử lại sau.");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const submitQuiz = () => {
    if (!quiz) return;

    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correctIndex) correct++;
    });

    setScore(Math.round((correct / quiz.questions.length) * 100));
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      {/* SIDEBAR */}
      <aside className="w-full lg:w-80 space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm"
        >
          <ChevronLeft size={18} />
          Quay lại
        </button>

        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="p-6 bg-slate-50 border-b">
            <h3 className="font-black italic truncate text-slate-800">
              {course.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-semibold">
              {lessons.length} bài học
            </p>
          </div>

          <div className="p-3 space-y-1 max-h-[70vh] overflow-y-auto">
            {lessons.map((lesson, i) => (
              <button
                key={lesson.id}
                onClick={() => setActiveLessonId(lesson.id)}
                className={`w-full text-left p-4 rounded-2xl text-sm transition-all ${
                  lesson.id === activeLessonId
                    ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200"
                    : "hover:bg-slate-50 text-slate-600 font-medium"
                }`}
              >
                <div className="flex gap-3">
                  <span className="opacity-50">{i + 1}.</span>
                  <span className="truncate">{lesson.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 bg-white rounded-[40px] border shadow-sm min-h-[70vh] overflow-hidden">
        {activeLesson ? (
          <div className="p-8 md:p-12 space-y-10">
            {/* LESSON */}
            <div>
              <h2 className="text-3xl font-black italic text-slate-800 mb-6">
                {activeLesson.title}
              </h2>
              <MathPreview
                math={activeLesson.content}
                className="text-lg leading-relaxed text-slate-700"
                isBlock
              />
            </div>

            <hr className="border-slate-100" />

            {/* QUIZ */}
            {quiz ? (
              <div className="space-y-8 bg-slate-50 p-8 rounded-[32px] border">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black">{quiz.title}</h3>
                  {score !== null && (
                    <span
                      className={`px-4 py-2 rounded-xl font-black text-sm ${
                        score >= 50
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {score}/100
                    </span>
                  )}
                </div>

                {quiz.questions.map((q, i) => (
                  <div
                    key={q.id}
                    className="bg-white p-6 rounded-2xl border space-y-4"
                  >
                    <div className="font-bold flex gap-2">
                      <span className="text-indigo-600">Câu {i + 1}:</span>
                      <MathPreview math={q.question} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      {q.options.map((opt, oi) => {
                        const isSelected = selectedAnswers[i] === oi;
                        const isCorrect = score !== null && oi === q.correctIndex;
                        const isWrong =
                          score !== null && isSelected && !isCorrect;

                        let cls =
                          "border bg-slate-50 hover:bg-slate-100";

                        if (score === null && isSelected)
                          cls =
                            "border-indigo-500 bg-indigo-50 text-indigo-700";
                        if (isCorrect)
                          cls =
                            "border-emerald-500 bg-emerald-50 text-emerald-700";
                        if (isWrong)
                          cls =
                            "border-rose-500 bg-rose-50 text-rose-700";

                        return (
                          <button
                            key={oi}
                            disabled={score !== null}
                            onClick={() =>
                              setSelectedAnswers((s) => ({
                                ...s,
                                [i]: oi,
                              }))
                            }
                            className={`p-4 rounded-xl text-left transition-all ${cls}`}
                          >
                            <div className="flex justify-between items-center">
                              <MathPreview math={opt} />
                              {isCorrect && (
                                <CheckCircle2 className="text-emerald-600" />
                              )}
                              {isWrong && (
                                <XCircle className="text-rose-600" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {score === null ? (
                  <button
                    onClick={submitQuiz}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black"
                  >
                    Nộp bài
                  </button>
                ) : (
                  <button
                    onClick={handleGenQuiz}
                    className="mx-auto block px-6 py-3 bg-slate-900 text-white rounded-xl font-bold"
                  >
                    Sinh đề mới
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed rounded-[32px]">
                <Sparkles className="mx-auto text-indigo-500 mb-4" size={32} />
                <p className="mb-6 text-slate-500">
                  Tạo bài tập AI từ nội dung bài học
                </p>
                <button
                  onClick={handleGenQuiz}
                  disabled={loadingQuiz}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black"
                >
                  {loadingQuiz ? "Đang phân tích..." : "Sinh bài tập AI"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            Vui lòng chọn bài học
          </div>
        )}
      </main>
    </div>
  );
};

export default CourseViewer;
