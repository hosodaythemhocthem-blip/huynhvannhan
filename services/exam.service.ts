// services/exam.service.ts

import { supabase, safeQuery } from "../supabase";
import { OnlineExam, ExamQuestion } from "../types/examFormat";

/**
 * ==========================================================
 * EXAM SERVICE – SUPABASE STABLE VERSION
 * ==========================================================
 * ✔ Typed
 * ✔ Mapping chuẩn DB
 * ✔ Lưu questions JSON
 * ✔ Không crash
 * ✔ Production safe
 * ==========================================================
 */

export const ExamService = {
  /* ========================================================
     SAVE / UPDATE EXAM
  ======================================================== */
  async saveExam(exam: OnlineExam): Promise<boolean> {
    try {
      // 1️⃣ Lưu metadata vào bảng exams
      await safeQuery(
        supabase.from("exams").upsert({
          id: exam.id,
          title: exam.title,
          description: `Môn: ${exam.subject || ""} | Khối: ${
            exam.grade || ""
          }`,
          teacher_id: exam.createdBy,
          file_url: null,
          created_at: new Date(exam.createdAt).toISOString(),
        })
      );

      // 2️⃣ Lưu full JSON đề thi vào app_sync
      await safeQuery(
        supabase.from("app_sync").upsert({
          id: exam.id,
          type: "online_exam",
          payload: exam,
          created_at: new Date().toISOString(),
        })
      );

      return true;
    } catch (err) {
      console.error("❌ Lỗi lưu đề:", err);
      return false;
    }
  },

  /* ========================================================
     DELETE EXAM
  ======================================================== */
  async deleteExam(examId: string): Promise<boolean> {
    try {
      await safeQuery(
        supabase.from("exams").delete().eq("id", examId)
      );

      await safeQuery(
        supabase.from("app_sync").delete().eq("id", examId)
      );

      return true;
    } catch (err) {
      console.error("❌ Lỗi xoá đề:", err);
      return false;
    }
  },

  /* ========================================================
     GET ALL EXAMS OF TEACHER
  ======================================================== */
  async getAllExams(teacherId: string): Promise<OnlineExam[]> {
    try {
      const data = await safeQuery(
        supabase
          .from("app_sync")
          .select("payload")
          .eq("type", "online_exam")
          .order("created_at", { ascending: false })
      );

      return (data.map((row: any) => row.payload) ||
        []) as OnlineExam[];
    } catch (err) {
      console.error("❌ Lỗi load đề:", err);
      return [];
    }
  },

  /* ========================================================
     FORMAT AI RAW QUESTIONS → UI FORMAT
  ======================================================== */
  formatQuestionsForUI(rawQs: any[]): ExamQuestion[] {
    return rawQs.map((q, index) => ({
      id:
        q.id ||
        `q_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 9)}`,
      order: index + 1,
      type: q.type || "multiple_choice",
      content: q.content || q.text || "",

      choices:
        q.choices ||
        (q.options
          ? q.options.map((opt: string, i: number) => ({
              id: String.fromCharCode(65 + i),
              content: opt,
            }))
          : []),

      correctAnswer:
        q.correctAnswer || q.answer || undefined,

      maxScore: q.points || 1,
    }));
  },
};
