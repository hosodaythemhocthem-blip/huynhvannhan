import React, { useState } from 'react';
import { Course, Quiz } from '../types';
import { generateQuizForLesson } from '../services/geminiService';
import MathPreview from './MathPreview';
import { ChevronLeft, Sparkles } from 'lucide-react';

interface Props {
  course: Course;
  onBack: () => void;
  onToggleLesson: (id: string) => void;
}

const CourseViewer: React.FC<Props> = ({ course, onBack, onToggleLesson }) => {
  const [activeLessonId, setActiveLessonId] = useState(course.lessons[0]?.id);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState<number | null>(null);

  const activeLesson = course.lessons.find(l => l.id === activeLessonId);

  const handleGenQuiz = async () => {
    if (!activeLesson) return;
    setLoadingQuiz(true);
    setQuiz(null);
    setScore(null);
    setSelectedAnswers({});
    try {
      const data = await generateQuizForLesson(activeLesson.title, activeLesson.content);
      setQuiz(data);
    } catch {
      alert('Lỗi sinh bài tập');
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

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* SIDEBAR */}
      <aside className="w-full lg:w-80 space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm">
          <ChevronLeft size={18} /> Quay lại
        </button>

        <div className="bg-white rounded-3xl border shadow-sm">
          <div className="p-6 bg-slate-50 border-b">
            <h3 className="font-black italic truncate">{course.title}</h3>
          </div>

          <div className="p-3 space-y-1">
            {course.lessons.map((lesson, i) => (
              <button
                key={lesson.id}
                onClick={() => { setActiveLessonId(lesson.id); setQuiz(null); }}
                className={`w-full text-left p-4 rounded-2xl ${
                  activeLessonId === lesson.id
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                {i + 1}. {lesson.title}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 bg-white rounded-[40px] border shadow-sm min-h-[70vh]">
        {activeLesson && (
          <div className="p-10 space-y-10">
            <h2 className="text-3xl font-black italic">{activeLesson.title}</h2>

            <MathPreview content={activeLesson.content} className="text-lg leading-relaxed" />

            {/* QUIZ */}
            {quiz ? (
              <div className="space-y-8 bg-slate-50 p-8 rounded-3xl border">
                <h3 className="text-xl font-black">{quiz.title}</h3>

                {quiz.questions.map((q, i) => (
                  <div key={i} className="space-y-4">
                    <p className="font-bold">
                      <MathPreview content={`${i + 1}. ${q.question}`} />
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      {q.options.map((opt, oi) => {
                        const selected = selectedAnswers[i] === oi;
                        const isCorrect = score !== null && oi === q.correctIndex;
                        const isWrong = score !== null && selected && !isCorrect;

                        return (
                          <button
                            key={oi}
                            onClick={() =>
                              setSelectedAnswers({ ...selectedAnswers, [i]: oi })
                            }
                            className={`p-4 rounded-xl border text-left transition
                              ${selected ? 'border-indigo-600 bg-indigo-50' : 'bg-white'}
                              ${isCorrect ? 'border-emerald-500 bg-emerald-50' : ''}
                              ${isWrong ? 'border-rose-500 bg-rose-50' : ''}
                            `}
                          >
                            <MathPreview content={opt} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {score === null ? (
                  <button
                    onClick={submitQuiz}
                    className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black"
x
                  >
                    Nộp bài
                  </button>
                ) : (
                  <div className="text-center text-xl font-black text-emerald-600">
                    🎉 Kết quả: {score}%
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 border-dashed border rounded-3xl bg-indigo-50">
                <Sparkles className="mx-auto text-indigo-500 mb-4" />
                <button
                  onClick={handleGenQuiz}
                  disabled={loadingQuiz}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black"
                >
                  {loadingQuiz ? 'Đang sinh bài...' : '⚡ Sinh bài tập AI'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CourseViewer;
