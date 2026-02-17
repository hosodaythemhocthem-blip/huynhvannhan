import { supabase } from "../supabase";
import { Exam, Question, QuestionType } from "../types";

/* =========================================================
   UTILITIES
========================================================= */

const generateId = (prefix: string = "id") =>
  `${prefix}_${crypto.randomUUID()}`;

const now = () => new Date().toISOString();

/* =========================================================
   SAFE QUESTION NORMALIZER (STRICT PRODUCTION SAFE)
========================================================= */

const normalizeQuestion = (q: any, index: number): Question => {
  const base = {
    id: q.id || generateId("q"),
    content: q.content ?? q.text ?? "",
    points:
      typeof q.points === "number" && !isNaN(q.points)
        ? q.points
        : 1,
    explanation: q.explanation ?? "",
    section: q.section ?? 1,
    order: typeof q.order === "number" ? q.order : index,
    image_url: q.image_url ?? null,
    isDeleted: q.isDeleted ?? false,
    version: q.version ?? 1,
    createdAt: q.createdAt ?? now(),
    updatedAt: now(),
  };

  switch (q.type) {
    case QuestionType.MCQ:
    case "MCQ":
    case "multiple-choice":
      return {
        ...base,
        type: QuestionType.MCQ,
        options:
          Array.isArray(q.options) && q.options.length > 0
            ? q.options
            : ["", "", "", ""],
        correctAnswer:
          typeof q.correctAnswer === "number"
            ? q.correctAnswer
            : 0,
      };

    case QuestionType.TRUE_FALSE:
    case "true-false":
      return {
        ...base,
        type: QuestionType.TRUE_FALSE,
        options: ["True", "False"],
        correctAnswer:
          typeof q.correctAnswer === "boolean"
            ? q.correctAnswer
            : false,
      };

    case QuestionType.SHORT_ANSWER:
      return {
        ...base,
        type: QuestionType.SHORT_ANSWER,
        correctAnswer: q.correctAnswer ?? "",
      };

    case QuestionType.ESSAY:
      return {
        ...base,
        type: QuestionType.ESSAY,
        correctAnswer: q.correctAnswer ?? "",
      };

    case QuestionType.MATH:
      return {
        ...base,
        type: QuestionType.MATH,
        correctAnswer: q.correctAnswer ?? "",
        latexSource: q.latexSource ?? "",
        renderMode: q.renderMode ?? "block",
      };

    default:
      return {
        ...base,
        type: QuestionType.MCQ,
        options: ["", "", "", ""],
        correctAnswer: 0,
      };
  }
};

/* =========================================================
   CALCULATE META
========================================================= */

const calculateMeta = (questions: Question[]) => {
  const active = questions.filter((q) => !q.isDeleted);

  const totalPoints = active.reduce(
    (sum, q) => sum + (q.points || 0),
    0
  );

  return {
    totalPoints,
    questionCount: active.length,
  };
};

/* =========================================================
   EXAM SERVICE
========================================================= */

export const ExamService = {
  /* =========================================================
     UPSERT EXAM (INSERT OR UPDATE SAFE)
  ========================================================= */
  async saveExam(exam: Exam): Promise<boolean> {
    try {
      if (!exam.title?.trim())
        throw new Error("Tiêu đề đề thi không được để trống.");

      const normalizedQuestions = (exam.questions || []).map(
        (q, i) => normalizeQuestion(q, i)
      );

      const meta = calculateMeta(normalizedQuestions);

      const normalizedExam: Exam = {
        ...exam,
        id: exam.id || generateId("exam"),
        questions: normalizedQuestions,
        totalPoints: meta.totalPoints,
        questionCount: meta.questionCount,
        updatedAt: now(),
        createdAt: exam.createdAt || now(),
        version: exam.version ? exam.version + 1 : 1,
        isDeleted: exam.isDeleted ?? false,
      };

      const { error } = await supabase
        .from("exams")
        .upsert(normalizedExam, {
          onConflict: "id",
        });

      if (error) {
        console.error("❌ Lỗi lưu đề:", error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error("❌ Lỗi hệ thống:", err);
      return false;
    }
  },

  /* =========================================================
     SOFT DELETE EXAM
  ========================================================= */
  async deleteExam(examId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("exams")
        .update({
          isDeleted: true,
          updatedAt: now(),
        })
        .eq("id", examId);

      if (error) {
        console.error("❌ Lỗi xóa đề:", error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error("❌ Lỗi hệ thống:", err);
      return false;
    }
  },

  /* =========================================================
     GET ALL EXAMS (FILTER SOFT DELETE)
  ========================================================= */
  async getAllExams(): Promise<Exam[]> {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("isDeleted", false)
        .order("createdAt", { ascending: false });

      if (error) {
        console.error("❌ Lỗi lấy đề:", error.message);
        return [];
      }

      return (data as Exam[]) || [];
    } catch (err) {
      console.error("❌ Lỗi hệ thống:", err);
      return [];
    }
  },

  /* =========================================================
     SOFT DELETE QUESTION
  ========================================================= */
  softDeleteQuestion(exam: Exam, questionId: string): Exam {
    const updated = exam.questions.map((q) =>
      q.id === questionId
        ? { ...q, isDeleted: true, updatedAt: now() }
        : q
    );

    return {
      ...exam,
      questions: updated,
      ...calculateMeta(updated),
    };
  },

  /* =========================================================
     IMPORT SAFE FORMAT
  ========================================================= */
  formatQuestionsForUI(rawQs: any[]): Question[] {
    if (!Array.isArray(rawQs)) return [];
    return rawQs.map((q, i) => normalizeQuestion(q, i));
  },

  /* =========================================================
     UPLOAD FILE (WORD / PDF / IMAGE)
  ========================================================= */
  async uploadExamFile(file: File): Promise<string | null> {
    try {
      const filePath = `exam_files/${generateId(
        "file"
      )}_${file.name}`;

      const { error } = await supabase.storage
        .from("exam-files")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("❌ Lỗi upload:", error.message);
        return null;
      }

      const { data } = supabase.storage
        .from("exam-files")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error("❌ Upload thất bại:", err);
      return null;
    }
  },
};
