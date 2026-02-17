import { supabase } from "../supabase";
import { Exam, User } from "../types";

export const dataService = {
  async getPendingStudents(): Promise<User[]> {
    const { data } = await supabase.from("users").select();
    return (data || []).filter(
      (u: any) => u.role === "student" && !u.isApproved && !u.isDeleted
    );
  },

  async approveStudent(userId: string) {
    await supabase.from("users").update({
      id: userId,
      isApproved: true,
    });
  },

  async saveExam(exam: Exam) {
    const { data } = await supabase.from("exams").insert(exam);
    return data?.[0];
  },

  async getAllExams(teacherId: string): Promise<Exam[]> {
    const { data } = await supabase.from("exams").select();
    return (data || []).filter((e: Exam) => e.teacherId === teacherId);
  },

  async deleteExam(id: string) {
    await supabase.from("exams").update({
      id,
      isDeleted: true,
    });
  },
};
