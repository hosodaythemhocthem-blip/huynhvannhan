import { supabase } from "../supabase";
import { Exam } from "../types";

export const ExamService = {
  /* =========================================
     GET ALL EXAMS
  ========================================= */
  async getAllExams(): Promise<Exam[]> {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get exams error:", error);
      return [];
    }

    return (data || []) as Exam[];
  },

  /* =========================================
     SAVE EXAM (UPSERT)
  ========================================= */
  async saveExam(exam: Partial<Exam>): Promise<Exam | null> {
    const payload = {
      ...exam,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("exams")
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error("Save exam error:", error);
      return null;
    }

    return data as Exam;
  },

  /* =========================================
     GET BY ID
  ========================================= */
  async getById(id: string): Promise<Exam | null> {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data as Exam;
  },

  /* =========================================
     DELETE (SOFT DELETE)
  ========================================= */
  async deleteExam(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("exams")
      .update({ is_deleted: true })
      .eq("id", id);

    return !error;
  },
};
