import { supabase } from "../supabase";
import { Exam, Grade, Course, ClassItem } from "../types";

/* =====================================================
   EXAMS
===================================================== */

export const subscribeToExams = (
  callback: (exams: Exam[]) => void
) => {
  const fetchData = async () => {
    const { data } = await supabase
      .from("exams")
      .select("*")
      .order("created_at", { ascending: false });

    callback((data as Exam[]) || []);
  };

  fetchData();

  const channel = supabase
    .channel("exams-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "exams" },
      () => fetchData()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const saveExam = async (exam: Exam) => {
  if (exam.id) {
    const { error } = await supabase
      .from("exams")
      .update({
        ...exam,
        updated_at: new Date().toISOString(),
      })
      .eq("id", exam.id);

    if (error) throw error;
  } else {
    const { error } = await supabase.from("exams").insert({
      ...exam,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;
  }
};

export const deleteExam = async (examId: string) => {
  const { error } = await supabase
    .from("exams")
    .delete()
    .eq("id", examId);

  if (error) throw error;
};

/* =====================================================
   GRADES
===================================================== */

export const saveGrade = async (grade: Grade) => {
  const { error } = await supabase.from("grades").insert({
    ...grade,
    created_at: new Date().toISOString(),
  });

  if (error) throw error;
};

export const subscribeToGrades = (
  callback: (grades: Grade[]) => void
) => {
  const fetchData = async () => {
    const { data } = await supabase
      .from("grades")
      .select("*")
      .order("created_at", { ascending: false });

    callback((data as Grade[]) || []);
  };

  fetchData();

  const channel = supabase
    .channel("grades-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "grades" },
      () => fetchData()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/* =====================================================
   CLASSES
===================================================== */

export const subscribeToClasses = (
  callback: (classes: ClassItem[]) => void
) => {
  const fetchData = async () => {
    const { data } = await supabase.from("classes").select("*");
    callback((data as ClassItem[]) || []);
  };

  fetchData();

  const channel = supabase
    .channel("classes-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "classes" },
      () => fetchData()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/* =====================================================
   COURSES
===================================================== */

export const subscribeToCourses = (
  callback: (courses: Course[]) => void
) => {
  const fetchData = async () => {
    const { data } = await supabase.from("courses").select("*");
    callback((data as Course[]) || []);
  };

  fetchData();

  const channel = supabase
    .channel("courses-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "courses" },
      () => fetchData()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
