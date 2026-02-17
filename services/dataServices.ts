import { supabase } from "../supabase";
import { Exam } from "../types";

export const dataServices = {
  async getExamsByTeacher(teacher_id: string): Promise<Exam[]> {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("teacher_id", teacher_id);

    if (error) return [];

    return data as Exam[];
  },
};
