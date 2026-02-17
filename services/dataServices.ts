import { supabase } from "../supabase";
import { Exam } from "../types";

export const dataServices = {
  async getExamsByTeacher(teacher_id: string): Promise<Exam[]> {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("teacher_id", teacher_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return [];
    }

    return (data as Exam[]) ?? [];
  },
};
