import { supabase } from "../supabase";
import { Exam, Question } from "../types";

const now = () => new Date().toISOString();

export const examService = {
  /* ================= SAVE EXAM ================= */
  async saveExam(
    exam: Partial<Exam> & { questions?: Partial<Question>[] }
  ): Promise<Exam | null> {
    try {
      const { data: examData, error } = await supabase
        .from("exams")
        .upsert(
          {
            ...exam,
            updated_at: now(),
            created_at: exam.created_at ?? now(),
            total_points: exam.total_points ?? 0,
            version: exam.version ?? 1,
          },
          { onConflict: "id" }
        )
        .select()
        .single();

      if (error || !examData) {
        console.error(error);
        return null;
      }

      /* Save Questions */
      if (exam.questions?.length) {
        const payload = exam.questions.map((q, index) => ({
          ...q,
          exam_id: examData.id,
          order: index,
          created_at: q.created_at ?? now(),
          updated_at: now(),
        }));

        const { error: qError } = await supabase
          .from("questions")
          .upsert(payload, { onConflict: "id" });

        if (qError) {
          console.error(qError);
          return null;
        }

        const totalPoints = payload.reduce(
          (sum, q) => sum + (q.points ?? 0),
          0
        );

        await supabase
          .from("exams")
          .update({ total_points: totalPoints })
          .eq("id", examData.id);
      }

      return examData as Exam;
    } catch (err) {
      console.error(err);
      return null;
    }
  },

  /* ================= GET BY ID ================= */
  async getById(
    id: string
  ): Promise<(Exam & { questions: Question[] }) | null> {
    const { data, error } = await supabase
      .from("exams")
      .select("*, questions(*)")
      .eq("id", id)
      .single();

    if (error) return null;
    return data as any;
  },

  /* ================= GET ALL ================= */
  async getAll(): Promise<Exam[]> {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return [];
    return (data as Exam[]) ?? [];
  },

  /* ================= DELETE ================= */
  async delete(id: string): Promise<boolean> {
    await supabase.from("questions").delete().eq("exam_id", id);

    const { error } = await supabase
      .from("exams")
      .delete()
      .eq("id", id);

    return !error;
  },
};
