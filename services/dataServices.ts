import { supabase } from "../supabase";
import { Exam, User } from "../types";

export const dataService = {
  async getPendingStudents(): Promise<User[]> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "student")
      .eq("status", "pending");

    if (error) return [];
    return data as User[];
  },

  async approveStudent(userId: string) {
    const { error } = await supabase
      .from("users")
      .update({ status: "active" })
      .eq("id", userId);

    if (error) throw error;
  },

  async saveExam(exam: Exam) {
    const { data, error } = await supabase
      .from("exams")
      .upsert({
        ...exam,
        teacher_id: exam.teacherId,
        total_points: exam.totalPoints,
        question_count: exam.questionCount,
        is_published: exam.isPublished,
        created_at: exam.createdAt,
        updated_at: new Date().toISOString(),
        is_deleted: false,
      })
      .select();

    if (error) throw error;
    return data?.[0];
  },

  async getAllExams(teacherId: string): Promise<Exam[]> {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });

    if (error) return [];
    return data as Exam[];
  },

  async deleteExam(id: string) {
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) throw error;
  },
};

export default dataService;
