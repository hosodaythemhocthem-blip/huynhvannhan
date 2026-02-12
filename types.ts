/* ===============================
   ROLE
================================ */
export type UserRole = "teacher" | "student" | "admin";

/* ===============================
   USER
================================ */
export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  approved?: boolean;
  created_at?: string;
}

/* ===============================
   CLASS
================================ */
export interface ClassRoom {
  id: string;
  name: string;
  teacher_id: string;
  created_at?: string;
}

/* ===============================
   STUDENT CLASS RELATION
================================ */
export interface ClassEnrollment {
  id: string;
  class_id: string;
  student_id: string;
  approved: boolean;
  created_at?: string;
}

/* ===============================
   EXAM
================================ */
export interface Exam {
  id: string;
  title: string;
  description?: string;
  teacher_id: string;
  created_at?: string;
}

/* ===============================
   QUESTION
================================ */
export interface Question {
  id: string;
  exam_id: string;
  content: string;
  answers: string[];
  correct_index: number;
}
