import { supabase } from "../supabase";
import {
  Exam,
  Question,
  QuestionType,
} from "../types";

/* =========================================================
   SYSTEM UTILITIES
========================================================= */

const generateId = (prefix: string = "id") =>
  `${prefix}_${crypto.randomUUID()}`;

const now = () => new Date().toISOString();

const containsMath = (text: string): boolean =>
  /(\$|\\\(|\\\[)/.test(text);

/* =========================================================
   QUESTION NORMALIZER (STRICT SAFE)
========================================================= */

const normalizeQuestion = (q: any, index: number): Question => {
  const content: string = q.content ?? q.text ?? "";

  const detectedType =
    q.type === QuestionType.MCQ && containsMath(content)
      ? QuestionType.MATH
      : q.type ?? QuestionType.MCQ;

  const base = {
    id: q.id ?? generateId("q"),
    type: detectedType,
    content,
    points:
      typeof q.points === "number" && !isNaN(q.points)
        ? q.points
        : 1,
    explanation: q.explanation ?? undefined,
    section: q.section ?? 1,
    order:
      typeof q.order === "number"
        ? q.order
        : index,
    image_url:
      typeof q.image_url === "string"
        ? q.image_url
        : undefined,
    isDeleted: false,
    version: q.version ?? 1,
    createdAt: q.createdAt ?? now(),
    updatedAt: now(),
    aiGenerated: q.aiGenerated ?? false,
  };

  switch (detectedType) {
    case QuestionType.MCQ:
      return {
        ...base,
        type: QuestionType.MCQ,
        options: Array.isArray(q.options)
          ? q.options
          : ["", "", "", ""],
        correctAnswer:
          typeof q.correctAnswer === "number"
            ? q.correctAnswer
            : 0,
      };

    case QuestionType.MATH:
      return {
        ...base,
        type: QuestionType.MATH,
        correctAnswer:
          typeof q.correctAnswer === "string"
            ? q.correctAnswer
            : "",
        latexSource:
          q.latexSource ?? content,
        renderMode:
          q.renderMode ?? "block",
      };

    case QuestionType.TRUE_FALSE:
      return {
        ...base,
        type: QuestionType.TRUE_FALSE,
        options: ["True", "False"],
        correctAnswer:
          typeof q.correctAnswer === "boolean"
            ? q.correctAnswer
            : true,
      };

    case QuestionType.SHORT_ANSWER:
      return {
        ...base,
        type: QuestionType.SHORT_ANSWER,
        correctAnswer:
          typeof q.correctAnswer === "string"
            ? q.correctAnswer
            : "",
      };

    case QuestionType.ESSAY:
      return {
        ...base,
        type: QuestionType.ESSAY,
        rubric:
          typeof q.rubric === "string"
            ? q.rubric
            : undefined,
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
   META CALCULATOR
========================================================= */

const calculateMeta = (questions: Question[]) => {
  const active = questions.filter(
    (q) => !q.isDeleted
  );

  return {
    totalPoints: active.reduce(
      (sum, q) => sum + q.points,
      0
    ),
    questionCount: active.length,
  };
};

/* =========================================================
   EXAM SERVICE ENTERPRISE
========================================================= */

export const ExamService = {
  /* =========================================
     SAVE EXAM (UPSERT SAFE)
  ========================================= */
  async saveExam(
    exam: Partial<Exam>
  ): Promise<Exam | null> {
    try {
      if (!exam.title?.trim())
        throw new Error(
          "Tiêu đề không được để trống"
        );

      const normalizedQuestions =
        (exam.questions ?? []).map(
          (q, i) => normalizeQuestion(q, i)
        );

      const meta =
        calculateMeta(normalizedQuestions);

      const examId =
        exam.id ?? generateId("exam");

      const dbPayload = {
        id: examId,
        title: exam.title,
        description:
          exam.description ?? "",
        teacher_id: exam.teacherId,
        duration:
          exam.duration ?? 45,
        subject:
          exam.subject ?? "Toán",
        grade:
          exam.grade ?? "10",
        is_locked:
          exam.isLocked ?? false,
        is_published:
          exam.isPublished ?? false,
        is_archived:
          exam.isArchived ?? false,
        total_points:
          meta.totalPoints,
        question_count:
          meta.questionCount,
        questions:
          normalizedQuestions,
        file_url:
          exam.file_url ?? null,
        raw_content:
          exam.raw_content ?? null,
        created_at:
          exam.createdAt ?? now(),
        updated_at: now(),
      };

      const { data, error } =
        await supabase
          .from("exams")
          .upsert(dbPayload)
          .select()
          .single();

      if (error) throw error;

      return {
        ...data,
        teacherId: data.teacher_id,
        totalPoints:
          data.total_points,
        questionCount:
          data.question_count,
      } as Exam;
    } catch (err) {
      console.error(
        "❌ saveExam error:",
        err
      );
      return null;
    }
  },

  /* =========================================
     GET EXAM BY ID
  ========================================= */
  async getExamById(
    id: string
  ): Promise<Exam | null> {
    const { data, error } =
      await supabase
        .from("exams")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data)
      return null;

    return {
      ...data,
      teacherId: data.teacher_id,
      totalPoints:
        data.total_points,
      questionCount:
        data.question_count,
    } as Exam;
  },

  /* =========================================
     SOFT DELETE
  ========================================= */
  async deleteExam(
    examId: string
  ): Promise<boolean> {
    const { error } =
      await supabase
        .from("exams")
        .update({
          is_archived: true,
          updated_at: now(),
        })
        .eq("id", examId);

    return !error;
  },

  /* =========================================
     UPLOAD FILE (WORD/PDF)
  ========================================= */
  async uploadExamFile(
    file: File
  ): Promise<string | null> {
    try {
      const ext =
        file.name.split(".").pop();

      const fileName =
        `${crypto.randomUUID()}.${ext}`;

      const filePath =
        `exams/${fileName}`;

      const { error } =
        await supabase.storage
          .from("documents")
          .upload(filePath, file, {
            upsert: true,
          });

      if (error) throw error;

      const { data } =
        supabase.storage
          .from("documents")
          .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error(
        "❌ uploadExamFile error:",
        err
      );
      return null;
    }
  },
};
