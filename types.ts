/**
 * 🚀 LUMINA LMS V8 ENTERPRISE CORE
 * Stable | Supabase Safe | Strict Mode Ready
 */

export type Role = "teacher" | "student" | "admin";
export type UserStatus = "pending" | "active" | "rejected";

/* =====================================================
   BASE ENTITY
===================================================== */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

/* =====================================================
   USER SYSTEM
===================================================== */
export interface User extends BaseEntity {
  email: string;
  fullName: string;
  role: Role;
  avatar?: string;
  status: UserStatus;
  classId?: string;
  pendingClassId?: string;
  lastLoginAt?: string;
}

/* =====================================================
   QUESTION SYSTEM
===================================================== */
export enum QuestionType {
  MCQ = "multiple-choice",
  TRUE_FALSE = "true-false",
  SHORT_ANSWER = "short-answer",
  MATH = "math",
}

export interface Question extends BaseEntity {
  examId: string;
  type: QuestionType;
  content: string;
  options?: string[];
  correctAnswer: string | number | boolean;
  explanation?: string;
  points: number;
  order: number;
}

/* =====================================================
   EXAM SYSTEM
===================================================== */
export interface Exam extends BaseEntity {
  title: string;
  description?: string;
  teacherId: string;
  questions: Question[];
  duration: number;
  subject: string;
  grade: string;
  isPublished: boolean;
  totalPoints: number;
  questionCount: number;
  accessCode?: string;
}

/* =====================================================
   SUPABASE DATABASE MAP
===================================================== */
export interface DBTableMap {
  users: {
    id: string;
    email: string;
    full_name: string;
    role: Role;
    status: UserStatus;
    class_id?: string | null;
    pending_class_id?: string | null;
    avatar?: string | null;
    last_login_at?: string | null;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
  };

  exams: {
    id: string;
    title: string;
    description?: string | null;
    teacher_id: string;
    duration: number;
    subject: string;
    grade: string;
    is_published: boolean;
    total_points: number;
    question_count: number;
    access_code?: string | null;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
  };

  questions: {
    id: string;
    exam_id: string;
    content: string;
    options: string[] | null;
    correct_answer: string;
    explanation?: string | null;
    points: number;
    order: number;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
  };
}
