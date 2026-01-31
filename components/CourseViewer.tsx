import React, { useState } from 'react';
import { Course } from '../types';
import { generateQuiz } from '../services/geminiService';
import MathPreview from './MathPreview';
import { ChevronLeft, Sparkles, CheckCircle2, XCircle } from 'lucide-react';

/* =========================
   TYPES LOCAL
========================= */
interface Quiz {
  title: string;
  questions: {
    id: string;
    question: string; // hoặc text tùy vào output của AI
    options: string[];
    correctIndex?: number; // Index đáp án đúng (0-3)
    correctAnswer?: string; // Hoặc string so sánh
  }[];
}

interface Props {
  course: Course;
  onBack: () => void;
  onToggleLesson: (id: string) => void;
}

const CourseViewer: React.FC<Props> = ({ course, onBack, onToggleLesson }) => {
  // Safe access to lessons
  const lessons = course.lessons || [];
  const [activeLessonId, setActiveLessonId] = useState(lessons[0]?.id);
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState<number | null>(null);

  const activeLesson = lessons.find(l => l.id === activeLessonId);

  const handleGenQuiz = async () => {
    if (!activeLesson) return;
    setLoadingQuiz(true);
    setQuiz(null);
    setScore(null);
    setSelectedAnswers({});
    
    try {
      // Gọi service generateQuiz từ geminiService
      const questionsData = await generateQuiz(activeLesson.content);
      
      // Map data từ AI về cấu trúc Quiz của component
      setQuiz({
        title: `Bài tập trắc nghiệm: ${activeLesson.title}`,
        questions: questionsData.map((q: any) => ({
          id: q.id,
          question: q.text || q.question, // Fallback tùy output AI
          options: q.options,
          correctIndex: q.correctAnswer // Giả sử AI trả về index (0-3)
        }))
      });
    } catch (error) {
      console.error("Quiz Gen Error:", error);
      alert('Lỗi sinh bài tập. Vui lòng thử lại sau.');
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
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      {/* SIDEBAR */}
      <aside className="w-full lg:w-80 space-y-4">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors"
        >
          <ChevronLeft size={18} /> Quay lại
        </button>

        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="p-6 bg-slate-50 border-b">
            <h3 className="font-black italic truncate text-slate-800">{course.title}</h3>
            <p className="text-xs text-slate-500 mt-1 font-semibold">{lessons.length} bài học</p>
          </div>

          <div className="p-3 space-y-1 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {lessons.map((lesson, i) => (
              <button
                key={lesson.id}
                onClick={() => { setActiveLessonId(lesson.id); setQuiz(null); }}
                className={`w-full text-left p-4 rounded-2xl transition-all text-sm ${
                  activeLessonId === lesson.id
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200'
                    : 'hover:bg-slate-50 text-slate-600 font-medium'
                }`}
              >
                <div className="flex gap-3">
                  <span className={`opacity-50 ${activeLessonId === lesson.id ? 'text-white' : ''}`}>
                    {i + 1}.
                  </span>
                  <span className="truncate">{lesson.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 bg-white rounded-[40px] border shadow-sm min-h-[70vh] overflow-hidden">
        {activeLesson ? (
          <div className="p-8 md:p-12 space-y-10">
            {/* Lesson Header */}
            <div>
              <h2 className="text-3xl font-black italic text-slate-800 mb-6">{activeLesson.title}</h2>
              <div className="prose prose-indigo max-w-none">
                {/* Fix prop name: content -> math */}
                <MathPreview math={activeLesson.content} className="text-lg leading-relaxed text-slate-700" isBlock />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* QUIZ SECTION */}
            {quiz ? (
              <div className="space-y-8 bg-slate-50 p-8 rounded-[32px] border border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-800">{quiz.title}</h3>
                  {score !== null && (
                    <div className={`px-4 py-2 rounded-xl font-black text-sm ${score >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      KẾT QUẢ: {score}/100
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  {quiz.questions.map((q, i) => (
                    <div key={i} className="space-y-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="font-bold text-slate-800 flex gap-2">
                        <span className="text-indigo-600">Câu {i + 1}:</span>
                        <MathPreview math={q.question} />
                      </div>

                      <div className="grid md:grid-cols-2 gap-3">
                        {q.options.map((opt, oi) => {
                          const isSelected = selectedAnswers[i] === oi;
                          const isCorrect = score !== null && oi === q.correctIndex;
                          const isWrong = score !== null && isSelected && !isCorrect;

                          let btnClass = "bg-slate-50 border-slate-200 hover:bg-slate-100";
                          
                          // Logic màu sắc khi đã nộp bài hoặc đang chọn
                          if (score === null) {
                            if (isSelected) btnClass = "bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500";
                          } else {
                            if (isCorrect) btnClass = "bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500";
                            else if (isWrong) btnClass = "bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-500";
                            else if (isSelected) btnClass = "bg-slate-100 border-slate-300 opacity-50";
                          }

                          return (
                            <button
                              key={oi}
                              disabled={score !== null}
                              onClick={() => setSelectedAnswers({ ...selectedAnswers, [i]: oi })}
                              className={`p-4 rounded-xl border text-left transition-all relative group ${btnClass}`}
                            >
                              <div className="flex items-center justify-between">
                                <MathPreview math={opt} />
                                {isCorrect && <CheckCircle2 size={18} className="text-emerald-600" />}
                                {isWrong && <XCircle size={18} className="text-rose-600" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {score === null ? (
                  <button
                    onClick={submitQuiz}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-200 transition-all active:scale-95"
                  >
                    Nộp bài
                  </button>
                ) : (
                  <div className="text-center p-6 bg-white rounded-2xl border border-dashed border-slate-300">
                    <p className="text-slate-500 font-bold mb-4">Bạn muốn làm lại để cải thiện điểm số?</p>
                    <button 
                      onClick={handleGenQuiz}
                      className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition"
                    >
                      Sinh đề mới
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* EMPTY STATE - CALL TO ACTION */
              <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="text-indigo-500" size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">Luyện tập cùng AI</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-8">
                  Hệ thống sẽ tự động phân tích nội dung bài học "{activeLesson.title}" để tạo ra bộ câu hỏi trắc nghiệm phù hợp.
                </p>
                <button
                  onClick={handleGenQuiz}
                  disabled={loadingQuiz}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2 mx-auto disabled:opacity-70"
                >
                  {loadingQuiz ? (
                    <>Đang phân tích dữ liệu...</>
                  ) : (
                    <>
                      <Sparkles size={18} /> Sinh bài tập AI
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p>Vui lòng chọn một bài học để bắt đầu</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CourseViewer;
