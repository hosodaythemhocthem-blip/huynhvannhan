import { supabase } from "../supabase";
import { OnlineExam, MathQuestion } from "../examFo";

/* =========================================================
   UTILITIES
========================================================= */

const generateId = (prefix: string = "id") =>
  `${prefix}_${crypto.randomUUID()}`;

const normalizeQuestion = (q: any): MathQuestion => ({
  id: q.id || generateId("q"),
  type: q.type || "MCQ",
  text: q.text || q.content || "",
  options:
    q.type === "MCQ"
      ? q.options && q.options.length === 4
        ? q.options
        : ["", "", "", ""]
      : [],
  correctAnswer: q.correctAnswer || "",
  points: q.points ?? 1,
});

/* =========================================================
   EXAM SERVICE – SUPABASE PRO VERSION
========================================================= */

export const ExamService = {
  /* =========================================================
     SAVE OR UPDATE EXAM (UPSERT)
  ========================================================= */
  async saveExam(exam: OnlineExam): Promise<boolean> {
    try {
      if (!exam.title) throw new Error("Tiêu đề đề thi không được để trống.");

      const normalizedExam: OnlineExam = {
        ...exam,
        id: exam.id || generateId("exam"),
        questions: (exam.questions || []).map(normalizeQuestion),
        updatedAt: new Date().toISOString(),
        createdAt: exam.createdAt || new Date().toISOString(),
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
     DELETE EXAM PERMANENTLY
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
     GET ALL EXAMS (ORDER NEWEST FIRST)
  ========================================================= */
  async getAllExams(): Promise<OnlineExam[]> {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .order("createdAt", { ascending: false });

      if (error) {
        console.error("❌ Lỗi lấy đề:", error.message);
        return [];
      }

      return (data as OnlineExam[]) || [];
    } catch (err) {
      console.error("❌ Lỗi hệ thống:", err);
      return [];
    }
  },

  /* =========================================================
     IMPORT FILE (WORD / PDF) → UPLOAD TO STORAGE
  ========================================================= */
  async uploadExamFile(file: File): Promise<string | null> {
    try {
      const filePath = `exam_files/${generateId("file")}_${file.name}`;

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
     FORMAT RAW QUESTIONS FROM AI OR FILE
  ========================================================= */
  formatQuestionsForUI(rawQs: any[]): MathQuestion[] {
    if (!Array.isArray(rawQs)) return [];

    return rawQs.map(normalizeQuestion);
  },
};
