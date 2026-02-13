// components/CourseViewer.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Sparkles,
  Trash2,
  Upload,
  Loader2,
  FileText,
  RotateCcw,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { generateQuiz } from "../services/geminiService";
import MathPreview from "./MathPreview";

interface Props {
  course: any;
  onBack: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const CourseViewer: React.FC<Props> = ({ course, onBack }) => {
  const lessons = useMemo(() => course.lessons ?? [], [course]);
  const [activeLessonId, setActiveLessonId] = useState(
    lessons[0]?.id
  );

  const [quiz, setQuiz] = useState<any>(null);
  const [score, setScore] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] =
    useState<Record<number, number>>({});
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const activeLesson = lessons.find(
    (l: any) => l.id === activeLessonId
  );

  useEffect(() => {
    setQuiz(null);
    setScore(null);
    setSelectedAnswers({});
  }, [activeLessonId]);

  /* =========================
     SAVE RESULT
  ========================= */
  const saveResult = async (scoreValue: number) => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;

    await supabase.from("quiz_results").upsert({
      lesson_id: activeLessonId,
      user_id: data.user.id,
      score: scoreValue,
    });
  };

  const deleteResult = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;

    await supabase
      .from("quiz_results")
      .delete()
      .eq("lesson_id", activeLessonId)
      .eq("user_id", data.user.id);

    setScore(null);
  };

  /* =========================
     GENERATE QUIZ
  ========================= */
  const handleGenQuiz = async () => {
    if (!activeLesson) return;

    try {
      setLoadingQuiz(true);
      const questions = await generateQuiz(
        activeLesson.content
      );

      if (!questions?.length) {
        alert("AI không tạo được câu hỏi.");
        return;
      }

      setQuiz({
        title: activeLesson.title,
        questions,
      });
    } catch (err) {
      console.error(err);
      alert("Lỗi AI.");
    } finally {
      setLoadingQuiz(false);
    }
  };

  /* =========================
     SUBMIT QUIZ
  ========================= */
  const submitQuiz = async () => {
    if (!quiz) return;
    setSubmitting(true);

    let correct = 0;
    quiz.questions.forEach((q: any, i: number) => {
      if (selectedAnswers[i] === q.correctIndex)
        correct++;
    });

    const finalScore = Math.round(
      (correct / quiz.questions.length) * 100
    );

    setScore(finalScore);
    await saveResult(finalScore);
    setSubmitting(false);
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setScore(null);
  };

  /* =========================
     UPLOAD FILE
  ========================= */
  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.[0] || !activeLesson)
      return;

    const file = e.target.files[0];

    if (file.size > MAX_FILE_SIZE) {
      alert("File tối đa 10MB");
      return;
    }

    try {
      setUploading(true);

      const filePath = `lessons/${activeLessonId}/${Date.now()}-${file.name}`;

      const { error } = await supabase.storage
        .from("lesson-files")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage
        .from("lesson-files")
        .getPublicUrl(filePath);

      await supabase.from("lessons")
        .update({ file_url: data.publicUrl })
        .eq("id", activeLessonId);

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Upload thất bại");
    } finally {
      setUploading(false);
    }
  };

  /* =========================
     DELETE FILE
  ========================= */
  const handleDeleteFile = async () => {
    if (!activeLesson?.file_url) return;

    if (!confirm("Xóa file?")) return;

    try {
      const url = new URL(activeLesson.file_url);
      const path = url.pathname.split(
        "/lesson-files/"
      )[1];

      await supabase.storage
        .from("lesson-files")
        .remove([path]);

      await supabase.from("lessons")
        .update({ file_url: null })
        .eq("id", activeLessonId);

      window.location.reload();
    } catch (error) {
      console.error(error);
    }
  };

  const renderFilePreview = () => {
    if (!activeLesson?.file_url) return null;

    const url = activeLesson.file_url;

    if (url.endsWith(".pdf")) {
      return (
        <iframe
          src={url}
          className="w-full h-[500px] rounded-xl border"
        />
      );
    }

    if (
      url.endsWith(".doc") ||
      url.endsWith(".docx")
    ) {
      return (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
            url
          )}`}
          className="w-full h-[500px] rounded-xl border"
        />
      );
    }

    return null;
  };

  return (
    <div className="flex gap-10 fade-in">
      {/* SIDEBAR */}
      <aside className="w-72 bg-white rounded-2xl shadow-sm p-4 space-y-4 border">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-indigo-600 font-semibold"
        >
          <ChevronLeft size={18} />
          Quay lại
        </button>

        {lessons.map((l: any) => (
          <button
            key={l.id}
            onClick={() => setActiveLessonId(l.id)}
            className={`block w-full text-left p-3 rounded-xl transition ${
              l.id === activeLessonId
                ? "bg-indigo-100 text-indigo-700 font-semibold"
                : "hover:bg-slate-100"
            }`}
          >
            {l.title}
          </button>
        ))}
      </aside>

      {/* MAIN */}
      <main className="flex-1 space-y-8">
        {activeLesson && (
          <>
            <h2 className="text-3xl font-black text-slate-800">
              {activeLesson.title}
            </h2>

            <MathPreview
              math={activeLesson.content}
            />

            {/* FILE SECTION */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
              <div className="flex items-center gap-2 font-bold text-lg">
                <FileText size={20} />
                Tài liệu
              </div>

              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleUpload}
              />

              {uploading && (
                <Loader2 className="animate-spin" />
              )}

              {activeLesson.file_url && (
                <>
                  <div className="flex gap-4 items-center">
                    <a
                      href={activeLesson.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 underline"
                    >
                      Mở file mới tab
                    </a>

                    <button
                      onClick={handleDeleteFile}
                      className="text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {renderFilePreview()}
                </>
              )}
            </div>

            {/* QUIZ */}
            {!quiz ? (
              <button
                onClick={handleGenQuiz}
                disabled={loadingQuiz}
                className="btn btn-primary flex items-center gap-2"
              >
                {loadingQuiz ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Sparkles size={18} />
                )}
                Sinh đề AI
              </button>
            ) : (
              <div className="space-y-6">
                {quiz.questions.map(
                  (q: any, i: number) => (
                    <div
                      key={i}
                      className="bg-white p-6 rounded-2xl border shadow-sm"
                    >
                      <p className="font-bold mb-4">
                        {q.question}
                      </p>

                      {q.options.map(
                        (opt: string, oi: number) => (
                          <button
                            key={oi}
                            onClick={() =>
                              setSelectedAnswers(
                                (s) => ({
                                  ...s,
                                  [i]: oi,
                                })
                              )
                            }
                            className={`block w-full text-left p-3 rounded-xl mb-2 transition ${
                              selectedAnswers[i] === oi
                                ? "bg-indigo-100 border-indigo-300 border"
                                : "hover:bg-slate-100"
                            }`}
                          >
                            {opt}
                          </button>
                        )
                      )}
                    </div>
                  )
                )}

                {score === null ? (
                  <button
                    onClick={submitQuiz}
                    disabled={submitting}
                    className="btn btn-success"
                  >
                    {submitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Nộp bài"
                    )}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="text-2xl font-black text-indigo-600">
                      Điểm: {score}
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={resetQuiz}
                        className="btn"
                      >
                        <RotateCcw size={16} />
                        Làm lại
                      </button>

                      <button
                        onClick={deleteResult}
                        className="btn btn-danger"
                      >
                        Xóa kết quả
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default CourseViewer;
