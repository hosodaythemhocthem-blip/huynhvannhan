import { supabase } from "../supabase"
import { Exam, Class } from "../types"

export const dataService = {
  /* ======================================================
     GET ALL EXAMS BY TEACHER
  ====================================================== */
  async getExamsByTeacher(teacherId: string): Promise<Exam[]> {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false })

    if (error) return []
    return data as Exam[]
  },

  /* ======================================================
     GET ALL CLASSES BY TEACHER
  ====================================================== */
  async getClassesByTeacher(teacherId: string): Promise<Class[]> {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("teacher_id", teacherId)

    if (error) return []
    return data as Class[]
  },
}
