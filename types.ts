export type UserRole = "admin" | "teacher" | "student";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_approved: boolean;
  created_at?: string;
}

export interface Question {
  id: string;
  content: string;
  options?: string[];
  correct_answer?: number | string;
  points: number;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  teacher_id: string;
  duration: number;
  questions: Question[];
  created_at?: string;
}
