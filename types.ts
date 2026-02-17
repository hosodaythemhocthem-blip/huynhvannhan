/**
 * LMS V7 ENTERPRISE CORE TYPES
 * Strict Mode Safe – AI Ready – Supabase Compatible
 * Tối ưu cho Thầy Huỳnh Văn Nhẫn
 */

export type Role = "teacher" | "student" | "admin";
export type UserStatus = "pending" | "approved" | "rejected" | "active";

/* =====================================================
   SYSTEM BASE ENTITY
===================================================== */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  isDeleted: boolean;
  version: number;
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
  isApproved: boolean;
  isActive: boolean;
  classId?: string;
  className?: string;
  lastLoginAt?: string;
}

/* =====================================================
   QUESTION SYSTEM (Strict Safe)
===================================================== */
export enum QuestionType {
  MCQ = "multiple-choice",
  TRUE_FALSE = "true-false",
  SHORT_ANSWER = "short-answer",
  ESSAY = "essay",
  MATH = "math",
}

export interface QuestionBase extends BaseEntity {
  type: QuestionType;
  content: string; // hỗ trợ LaTeX ($...$)
  points: number;
  explanation?: string;
  section?: number;
  image_url?: string;
  order: number;
  aiGenerated?: boolean;
}

/* ================= MCQ ================= */
export interface MCQQuestion extends QuestionBase {
  type: QuestionType.MCQ;
  options: string[];
  correctAnswer: number;
}

/* ================= TRUE FALSE ================= */
export interface TrueFalseQuestion extends QuestionBase {
  type: QuestionType.TRUE_FALSE;
  options: ["True", "False"];
  correctAnswer: boolean;
}

/* ================= SHORT ANSWER ================= */
export interface ShortAnswerQuestion extends QuestionBase {
  type: QuestionType.SHORT_ANSWER;
  correctAnswer?: string;
}

/* ================= ESSAY ================= */
export interface EssayQuestion extends QuestionBase {
  type: QuestionType.ESSAY;
  rubric?: string;
}

/* ================= MATH ================= */
export interface MathQuestion extends QuestionBase {
  type: QuestionType.MATH;
  correctAnswer: string;
  latexSource?: string;
  renderMode?: "inline" | "block";
}

/* ================= FINAL UNION ================= */
export type Question =
  | MCQQuestion
  | TrueFalseQuestion
  | ShortAnswerQuestion
  | EssayQuestion
  | MathQuestion;

/* =====================================================
   EXAM SYSTEM
===================================================== */
export interface Exam extends BaseEntity {
  title: string;
  description: string;
  teacherId: string;
  teacherName?: string;
  questions: Question[];
  duration: number;
  subject: string;
  grade: string;
  isLocked: boolean;
  isPublished: boolean;
  isArchived: boolean;
  assignedClassIds: string[];
  totalPoints: number;
  questionCount: number;
  file_url?: string;
  raw_content?: string;
}

/* =====================================================
   CLASS SYSTEM
===================================================== */
export interface Class extends BaseEntity {
  name: string;
  teacherId: string;
  studentCount: number;
  studentIds: string[];
  pendingStudentIds: string[];
}

/* =====================================================
   DATABASE MODELS (Snake Case for Supabase)
===================================================== */

export interface DBProfile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  status: UserStatus;
  created_at: string;
}

export interface DBExam {
  id: string;
  title: string;
  description: string;
  teacher_id: string;
  duration: number;
  subject: string;
  grade: string;
  is_locked: boolean;
  is_published: boolean;
  is_archived: boolean;
  total_points: number;
  question_count: number;
  file_url?: string;
  raw_content?: string;
  created_at: string;
  updated_at: string;
}

export interface DBQuestion {
  id: string;
  exam_id: string;
  type: QuestionType;
  content: string;
  points: number;
  order: number;
  explanation?: string;
  correct_answer?: string;
  options?: string[];
  created_at: string;
}
