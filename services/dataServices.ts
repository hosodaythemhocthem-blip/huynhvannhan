import { supabase } from "../supabase";
import { Exam, User } from "../types";

export const dataService = {
  async getPendingStudents(): Promise<User[]> {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .eq("status", "pending");

    return (data || []) as User[];
  },

  async approveStudent(userId: string) {
    await supabase
      .from("profiles")
      .update({ status: "active" })
      .eq("id", userId);
  },

  async getAllExams(): Promise<Exam[]> {
    const { data } = await supabase.from("exams").select("*");
    return (data || []) as Exam[];
  },
};
