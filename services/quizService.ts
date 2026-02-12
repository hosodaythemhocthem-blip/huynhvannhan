import { supabase } from "../supabase";

/* =====================================================
   TYPES
===================================================== */

export interface QuizResult {
  id?: string;
  exam_id: string;
  student_id: string;
  student_name: string;
  score: number;
  answers: any;
  created_at?: string;
  deleted?: boolean;
}

/* =====================================================
   SAVE QUIZ RESULT
===================================================== */

export async function saveQuizResult(data: QuizResult) {
  try {
    if (!data.exam_id || !data.student_id) {
      throw new Error("Thiếu exam_id hoặc student_id");
    }

    const { data: inserted, error } = await supabase
      .from("quiz_results")
      .insert({
        exam_id: data.exam_id,
        student_id: data.student_id,
        student_name: data.student_name,
        score: data.score,
        answers: data.answers,
        created_at: new Date().toISOString(),
        deleted: false,
      })
      .select()
      .single();

    if (error) throw error;

    return inserted;
  } catch (error) {
    console.error("❌ saveQuizResult error:", error);
    throw error;
  }
}

/* =====================================================
   GET QUIZ RESULTS
===================================================== */

export async function getQuizResults(): Promise<QuizResult[]> {
  try {
    const { data, error } = await supabase
      .from("quiz_results")
      .select("*")
      .eq("deleted", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data ?? [];
  } catch (error) {
    console.error("❌ getQuizResults error:", error);
    return [];
  }
}

/* =====================================================
   GET RESULTS BY STUDENT
===================================================== */

export async function getQuizResultsByStudent(student_id: string) {
  try {
    const { data, error } = await supabase
      .from("quiz_results")
      .select("*")
      .eq("student_id", student_id)
      .eq("deleted", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data ?? [];
  } catch (error) {
    console.error("❌ getQuizResultsByStudent error:", error);
    return [];
  }
}

/* =====================================================
   DELETE RESULT (SOFT DELETE)
===================================================== */

export async function deleteQuizResult(id: string) {
  try {
    const { error } = await supabase
      .from("quiz_results")
      .update({ deleted: true })
      .eq("id", id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("❌ deleteQuizResult error:", error);
    return false;
  }
}
