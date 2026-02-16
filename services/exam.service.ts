import { supabase } from "../supabase";
import {
  Exam,
  Question,
  QuestionType,
} from "../types";

/* =========================================================
   UTILITIES
========================================================= */

const generateId = (prefix: string = "id") =>
  `${prefix}_${crypto.randomUUID()}`;

/* =========================================================
   NORMALIZE QUESTION (V4 SAFE)
========================================================= */

const normalizeQuestion = (q: any): Question => {
  const base = {
    id: q.id || generateId("q"),
    content: q.content ?? q.text ?? "",
    points: q.points ?? 1,
    explanation: q.explanation,
    section: q.section,
    order: q.order,
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
        correctAnswer: q.correctAnswer,
      };

    case QuestionType.MATH:
      return {
        ...base,
        type: QuestionType.MATH,
        correctAnswer: q.correctAnswer ?? "",
        latexSource: q.latexSource,
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
   EXAM SERVICE – SUPABASE PRO VERSION (V4 READY)
========================================================= */

export const ExamService = {
  /* =========================================================
     SAVE OR UPDATE EXAM (UPSERT)
  ========================================================= */
  async saveExam(exam: Exam): Promise<boolean> {
    try {
      if (!exam.title)
        throw new Error("Tiêu đề đề thi không được để trống.");

      const normalizedExam: Exam = {
        ...exam,
        id: exam.id || generateId("exam"),
        questions: (exam.questions || []).map(normalizeQuestion),
        updatedAt: new Date().toISOString(),
        createdAt:
          exam.createdAt || new Date().toISOString(),
      };

      const { error } = await supabase
        .from("exams")
        .upsert([normalizedExam], { onConflict: "id" });

      if (error) {
        console.error("❌ Lỗi Supabase:", error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error("❌ Lỗi lưu đề:", err);
      return false;
    }
  },

  /* =========================================================
     DELETE EXAM
  ========================================================= */
  async deleteExam(examId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("exams")
        .delete()
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
     GET ALL EXAMS
  ========================================================= */
  async getAllExams(): Promise<Exam[]> {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
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
     UPLOAD FILE
  ========================================================= */
  async uploadExamFile(file: File): Promise<string | null> {
    try {
      const filePath = `exam_files/${generateId(
        "file"
      )}_${file.name}`;

      const { error } = await supabase.storage
        .from("exam-files")
        .upload(filePath, file);

      if (error) {
        console.error("❌ Lỗi upload file:", error.message);
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

  /* =========================================================
     FORMAT RAW QUESTIONS
  ========================================================= */
  formatQuestionsForUI(rawQs: any[]): Question[] {
    if (!Array.isArray(rawQs)) return [];
    return rawQs.map(normalizeQuestion);
  },
};
