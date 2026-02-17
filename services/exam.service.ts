import { supabase } from "../supabase"
import { Exam } from "../types"

export const examService = {
  /* ======================================================
     CREATE EXAM
  ====================================================== */
  async createExam(payload: Partial<Exam>): Promise<Exam | null> {
    const { data, error } = await supabase
      .from("exams")
      .insert({
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return null
    return data as Exam
  },

  /* ======================================================
     UPDATE EXAM
  ====================================================== */
  async updateExam(id: string, updates: Partial<Exam>): Promise<boolean> {
    const { error } = await supabase
      .from("exams")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    return !error
  },

  /* ======================================================
     DELETE EXAM
  ====================================================== */
  async deleteExam(id: string): Promise<boolean> {
    const { error } = await supabase.from("exams").delete().eq("id", id)
    return !error
  },

  /* ======================================================
     GET BY ID
  ====================================================== */
  async getById(id: string): Promise<Exam | null> {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("id", id)
      .single()

    if (error) return null
    return data as Exam
  },
}
