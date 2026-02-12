import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  XCircle,
  Trash2,
  Upload,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { generateQuiz } from "../services/geminiService";
import MathPreview from "./MathPreview";

interface Props {
  course: any;
  onBack: () => void;
}

const CourseViewer: React.FC<Props> = ({ course, onBack }) => {
  const lessons = useMemo(() => course.lessons ?? [], [course]);

  const [activeLessonId, setActiveLessonId] = useState(
    lessons[0]?.id
  );

  const [quiz, setQuiz] = useState<any>(null);
  const [score, setScore] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});

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
    const { data: user } =
      await supabase.auth.getUser();

    if (!user?.user) return;

    await supabase.from("quiz_results").insert({
      lesson_id: activeLessonId,
      user_id: user.user.id,
      score: scoreValue,
    });
  };

  /* =========================
     SINH QUIZ
  ========================= */
  const handleGenQuiz = async () => {
    if (!activeLesson) return;

    const questions = await generateQuiz(
      activeLesson.content
    );

    setQuiz({
      title: activeLesson.title,
      questions,
    });
  };

  /* =========================
     NỘP BÀI
  ========================= */
  const submitQuiz = async () => {
    if (!quiz) return;

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
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];

    const filePath = `lessons/${activeLessonId}/${file.name}`;

    await supabase.storage
      .from("lesson-files")
      .upload(filePath, file, {
        upsert: true,
      });

    const { data } = supabase.storage
      .from("lesson-files")
      .getPublicUrl(filePath);

    await supabase.from("lessons").update({
      file_url: data.publicUrl,
    }).eq("id", activeLessonId);

    alert("Upload thành công!");
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

    const path =
      activeLesson.file_url.split(
        "/lesson-files/"
      )[1];

    await supabase.storage
      .from("lesson-files")
      .remove([path]);

    await supabase.from("lessons")
      .update({ file_url: null })
      .eq("id", activeLessonId);

    alert("Đã xóa file");
  };

  return (
    <div className="flex gap-8">
      <aside className="w-72">
        <button onClick={onBack}>
          <ChevronLeft /> Quay lại
        </button>

        {lessons.map((l: any) => (
          <button
            key={l.id}
            onClick={() =>
              setActiveLessonId(l.id)
            }
          >
            {l.title}
          </button>
        ))}
      </aside>

      <main className="flex-1">
        {activeLesson && (
          <>
            <h2>{activeLesson.title}</h2>

            <MathPreview
              math={activeLesson.content}
            />

            {/* FILE */}
            <div className="mt-6">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleUpload}
              />

              {activeLesson.file_url && (
                <div>
                  <a
                    href={activeLesson.file_url}
                    target="_blank"
                  >
                    Xem file
                  </a>

                  <button
                    onClick={handleDeleteFile}
                  >
                    <Trash2 />
                  </button>
                </div>
              )}
            </div>

            {/* QUIZ */}
            {!quiz ? (
              <button onClick={handleGenQuiz}>
                <Sparkles />
                Sinh đề
              </button>
            ) : (
              <>
                {quiz.questions.map(
                  (q: any, i: number) => (
                    <div key={i}>
                      <p>{q.question}</p>

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
                          >
                            {opt}
                          </button>
                        )
                      )}
                    </div>
                  )
                )}

                {score === null ? (
                  <button onClick={submitQuiz}>
                    Nộp bài
                  </button>
                ) : (
                  <div>
                    Điểm: {score}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default CourseViewer;
