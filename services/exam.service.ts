import { supabase } from "../supabase"
import { Exam } from "../types"

export const ExamService = {
  async saveExam(exam: Partial<Exam>): Promise<Exam | null> {
    const payload = {
      ...exam,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("exams")
      .upsert(payload)
      .select()
      .single()

    if (error) {
      console.error("Save exam error:", error)
      return null
    }

    return data as Exam
  },

  async getById(id: string): Promise<Exam | null> {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("id", id)
      .single()

    if (error) return null
    return data as Exam
  },

  async deleteExam(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("exams")
      .delete()
      .eq("id", id)

    return !error
  },
}
