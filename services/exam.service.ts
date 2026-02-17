import { supabase } from "../supabase"
import { Exam } from "../types"

export const ExamService = {
  /* ======================================================
     SAVE EXAM (CREATE OR UPDATE)
  ====================================================== */
  async saveExam(exam: Exam): Promise<Exam | null> {
    try {
      const payload = {
        ...exam,
        updatedAt: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from("exams")
        .upsert([payload])
        .select()

      if (error) {
        console.error("Save exam error:", error)
        return null
      }

      return data?.[0] ?? null
    } catch (err) {
      console.error("Unexpected error:", err)
      return null
    }
  },

  /* ======================================================
     GET BY ID
  ====================================================== */
  async getById(id: string): Promise<Exam | null> {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("id", id)
        .single()

      if (error) return null

      return data
    } catch {
      return null
    }
  },

  /* ======================================================
     DELETE
  ====================================================== */
  async deleteExam(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("exams")
      .delete()
      .eq("id", id)

    return !error
  },
}
