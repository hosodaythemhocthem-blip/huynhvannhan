import { supabase } from "./supabaseClient";
import { ClassRoom, Exam, Question } from "../types";

/* ===============================
   CLASS
================================ */
export async function createClass(name: string, teacher_id: string) {
  const { data, error } = await supabase
    .from("classes")
    .insert([{ name, teacher_id }])
    .select()
    .single();

  if (error) throw error;
  return data as ClassRoom;
}

export async function getTeacherClasses(teacher_id: string) {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("teacher_id", teacher_id);

  if (error) throw error;
  return data as ClassRoom[];
}

/* ===============================
   EXAM
================================ */
export async function createExam(title: string, teacher_id: string) {
  const { data, error } = await supabase
    .from("exams")
    .insert([{ title, teacher_id }])
    .select()
    .single();

  if (error) throw error;
  return data as Exam;
}

export async function getTeacherExams(teacher_id: string) {
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .eq("teacher_id", teacher_id);

  if (error) throw error;
  return data as Exam[];
}

/* ===============================
   QUESTION
================================ */
export async function addQuestion(question: Question) {
  const { error } = await supabase
    .from("questions")
    .insert([question]);

  if (error) throw error;
}
