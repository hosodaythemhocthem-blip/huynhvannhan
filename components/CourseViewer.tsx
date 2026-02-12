import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Sparkles,
  Trash2,
  Upload,
  Loader2,
  FileText,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { generateQuiz } from "../services/geminiService";
import MathPreview from "./MathPreview";

interface Props {
  course: any;
  onBack: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

  const activeLesson = lessons.find(
    (l: any) => l.id === activeLessonId
  );

  useEffect(() => {
    setQuiz(null);
    setScore(null);
    setSelectedAnswers({});
  }, [activeLessonId]);

  /* =========================
     LƯU ĐIỂM VĨNH VIỄN
  ========================= */
  const saveResult = async (scoreValue: number) => {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;

      await supabase.from("quiz_results").insert({
        lesson_id: activeLessonId,
        user_id: data.user.id,
        score: scoreValue,
      });
    } catch (error) {
      console.error("Save result error:", error);
    }
  };

  /* =========================
     SINH QUIZ AI
  ========================= */
  const handleGenQuiz = async () => {
    if (!activeLesson) return;

    try {
      setLoadingQuiz(true);

      const questions = await generateQuiz(
        activeLesson.content
      );

      if (!questions || questions.length === 0) {
        alert("AI không tạo được câu hỏi.");
        return;
      }

      setQuiz({
        title: activeLesson.title,
        questions,
      });
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tạo quiz.");
    } finally {
      setLoadingQuiz(false);
    }
  };

  /* =========================
     NỘP BÀI
  ========================= */
  const submitQuiz = async () => {
    if (!quiz || quiz.questions.length === 0) return;

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
      alert("File quá lớn (tối đa 10MB)");
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

      await supabase.from("lessons").update({
        file_url: data.publicUrl,
      }).eq("id", activeLessonId);

      alert("Upload thành công!");
    } catch (error) {
      console.error(error);
      alert("Upload thất bại");
    } finally {
      setUploading(false);
    }
  };

  /* =========================
     XÓA FILE
  ========================= */
  const handleDeleteFile = async () => {
    if (!activeLesson?.file_url) return;

    const confirmDelete = confirm(
      "Bạn có chắc muốn xóa file?"
    );
    if (!confirmDelete) return;

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

      alert("Đã xóa file");
    } catch (error) {
      console.error(error);
      alert("Xóa thất bại");
    }
  };

  return (
    <div className="flex gap-8">
      {/* SIDEBAR */}
      <aside className="w-72 space-y-4">
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
            onClick={() =>
              setActiveLessonId(l.id)
            }
            className={`block w-full text-left p-2 rounded-lg transition ${
              l.id === activeLessonId
                ? "bg-indigo-100 text-indigo-700"
                : "hover:bg-slate-100"
            }`}
          >
            {l.title}
          </button>
        ))}
      </aside>

      {/* MAIN */}
      <main className="flex-1 space-y-6">
        {activeLesson && (
          <>
            <h2 className="text-2xl font-bold">
              {activeLesson.title}
            </h2>

            {/* HIỂN THỊ CÔNG THỨC */}
            <MathPreview
              math={activeLesson.content}
            />

            {/* FILE SECTION */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2 font-semibold">
                <FileText size={18} />
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
                <div className="flex items-center gap-4">
                  <a
                    href={activeLesson.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 underline"
                  >
                    Xem file
                  </a>

                  <button
                    onClick={handleDeleteFile}
                    className="text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* QUIZ */}
            {!quiz ? (
              <button
                onClick={handleGenQuiz}
                disabled={loadingQuiz}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
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
                      className="p-4 border rounded-xl"
                    >
                      <p className="font-semibold mb-3">
                        {q.question}
                      </p>

                      {q.options.map(
                        (
                          opt: string,
                          oi: number
                        ) => (
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
                            className={`block w-full text-left p-2 rounded-lg mb-2 ${
                              selectedAnswers[i] ===
                              oi
                                ? "bg-indigo-100"
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
                    className="bg-green-600 text-white px-4 py-2 rounded-xl"
                  >
                    Nộp bài
                  </button>
                ) : (
                  <div className="text-xl font-bold text-indigo-600">
                    Điểm: {score}
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
