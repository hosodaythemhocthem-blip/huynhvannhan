import { supabase } from "../supabase";
import { Exam, User } from "../types";

export const dataService = {
  /* =========================================
     PENDING STUDENTS
  ========================================= */
  async getPendingStudents(): Promise<User[]> {
    const { data, error } = await supabase
      .from("users")
      .select("*");

    if (error) return [];

    return (data || []).filter(
      (u: any) =>
        u.role === "student" &&
        !u.is_approved &&
        !u.is_deleted
    ) as User[];
  },

  /* =========================================
     APPROVE STUDENT
  ========================================= */
  async approveStudent(userId: string) {
    await supabase
      .from("users")
      .update({ is_approved: true })
      .eq("id", userId);
  },

  /* =========================================
     SAVE EXAM
  ========================================= */
  async saveExam(exam: Exam): Promise<Exam | null> {
    const { data, error } = await supabase
      .from("exams")
      .upsert(exam)
      .select()
      .single();

    if (error) return null;

    return data as Exam;
  },

  /* =========================================
     GET ALL EXAMS BY TEACHER
  ========================================= */
  async getAllExams(teacherId: string): Promise<Exam[]> {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("teacher_id", teacherId)
      .eq("is_deleted", false);

    if (error) return [];

    return (data || []) as Exam[];
  },

  /* =========================================
     DELETE EXAM (SOFT)
  ========================================= */
  async deleteExam(id: string) {
    await supabase
      .from("exams")
      .update({ is_deleted: true })
      .eq("id", id);
  },
};
