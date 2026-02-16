/**
 * HỆ THỐNG KIỂU DỮ LIỆU CHUẨN - PRODUCTION LMS
 * Đã tối ưu Supabase + Word/PDF + Math Render
 */

export type Role = "teacher" | "student" | "admin";

/* =====================================================
   USER
===================================================== */
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatar?: string;
  isApproved?: boolean; // Giáo viên duyệt học sinh
  classId?: string;
  className?: string;
  createdAt?: string;

  /**
   * ⚠ Chỉ dùng tạm local mock
   * Không lưu password trong Supabase table public
   */
  password?: string;
}

/* =====================================================
   QUESTION TYPES
===================================================== */
export enum QuestionType {
  MCQ = "multiple-choice",
  TRUE_FALSE = "true-false",
  SHORT_ANSWER = "short-answer",
  ESSAY = "essay",
  MATH = "math",
}

/* =====================================================
   QUESTION BASE
===================================================== */
export interface BaseQuestion {
  id: string;
  type: QuestionType;
  content: string; // Hiển thị LaTeX
  points: number;
  explanation?: string;
  section?: number;
  image_url?: string;
  createdAt?: string;
}

/* =====================================================
   SPECIFIC QUESTION TYPES
===================================================== */

export interface MCQQuestion extends BaseQuestion {
  type: QuestionType.MCQ;
  options: string[];
  correctAnswer: number; // index
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: QuestionType.TRUE_FALSE;
  options: ["True", "False"];
  correctAnswer: boolean;
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: QuestionType.SHORT_ANSWER;
  correctAnswer: string;
}

export interface EssayQuestion extends BaseQuestion {
  type: QuestionType.ESSAY;
  correctAnswer?: string;
}

export interface MathQuestion extends BaseQuestion {
  type: QuestionType.MATH;
  latex?: string;
  correctAnswer: string;
}

/* =====================================================
   UNION TYPE
===================================================== */
export type Question =
  | MCQQuestion
  | TrueFalseQuestion
  | ShortAnswerQuestion
  | EssayQuestion
  | MathQuestion;

/* =====================================================
   EXAM
===================================================== */
export interface Exam {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  teacherName?: string;

  questions: Question[];

  duration: number; // phút
  subject: string;
  grade: string;

  createdAt: string;
  updatedAt: string;

  isLocked: boolean;
  assignedClassIds?: string[];

  file_url?: string; // Word/PDF gốc
  totalPoints?: number;
  questionCount?: number;
  version?: number;
}

/* =====================================================
   COURSE
===================================================== */
export interface Course {
  id: string;
  title: string;
  description?: string;
  teacherId: string;
  grade: string;
  createdAt: string;
  lessonCount?: number;
  fileCount?: number;
}

/* =====================================================
   CLASS
===================================================== */
export interface Class {
  id: string;
  name: string;
  teacherId: string;
  studentCount?: number;
  createdAt: string;
}
