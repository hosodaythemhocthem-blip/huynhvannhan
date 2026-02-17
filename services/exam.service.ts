import { supabase } from "../supabase"
import { Exam, Question } from "../types"

export const examService = {
  /* ======================================================
     SAVE EXAM + QUESTIONS (TRANSACTION SAFE)
  ====================================================== */
  async saveExam(
    exam: Partial<Exam> & { questions?: Partial<Question>[] }
  ): Promise<Exam | null> {
    try {
      const now = new Date().toISOString()

      /* ===== 1. UPSERT EXAM ===== */
      const { data: examData, error: examError } = await supabase
        .from("exams")
        .upsert({
          ...exam,
          updated_at: now,
          created_at: exam.created_at ?? now,
        })
        .select()
        .single()

      if (examError || !examData) {
        console.error("Exam save error:", examError)
        return null
      }

      /* ===== 2. HANDLE QUESTIONS ===== */
      if (exam.questions && exam.questions.length > 0) {
        const payload = exam.questions.map((q, index) => ({
          ...q,
          exam_id: examData.id,
          order: index,
          created_at: q.created_at ?? now,
          updated_at: now,
        }))

        const { error: qError } = await supabase
          .from("questions")
          .upsert(payload)

        if (qError) {
          console.error("Question save error:", qError)
          return null
        }

        /* ===== 3. UPDATE TOTAL POINTS ===== */
        const totalPoints = payload.reduce(
          (sum, q) => sum + (q.points || 0),
          0
        )

        await supabase
          .from("exams")
          .update({ total_points: totalPoints })
          .eq("id", examData.id)
      }

      return examData as Exam
    } catch (err) {
      console.error("Unexpected save error:", err)
      return null
    }
  },

  /* ======================================================
     GET FULL EXAM WITH QUESTIONS
  ====================================================== */
  async getById(id: string): Promise<(Exam & { questions: Question[] }) | null> {
    const { data, error } = await supabase
      .from("exams")
      .select(`
        *,
        questions (*)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error(error)
      return null
    }

    return data as any
  },

  async getAllExams(): Promise<Exam[]> {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) return []
    return data as Exam[]
  },

  async deleteExam(id: string): Promise<boolean> {
    await supabase.from("questions").delete().eq("exam_id", id)
    const { error } = await supabase.from("exams").delete().eq("id", id)
    return !error
  },
}
