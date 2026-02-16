/**
 * HỆ THỐNG KIỂU DỮ LIỆU CHUẨN - LMS PRODUCTION READY
 * Tối ưu Supabase + Word/PDF + AI + Math Render
 */

export type Role = "teacher" | "student" | "admin";

/* =====================================================
   USER
===================================================== */
export interface User {
  id: string; // Supabase Auth UID
  email: string;
  fullName: string;
  role: Role;
  avatar?: string;

  isApproved?: boolean; // Giáo viên duyệt học sinh
  classId?: string;
  className?: string;

  createdAt?: string;
  updatedAt?: string;

  lastLoginAt?: string;

  /**
   * ⚠ Không lưu password trong public table
   * Supabase Auth xử lý password
   */
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

  content: string; // Render bằng MathPreview
  points: number;

  explanation?: string;
  section?: number;

  image_url?: string;

  createdAt?: string;
  updatedAt?: string;
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
  isPublished?: boolean;
  isArchived?: boolean;

  assignedClassIds?: string[];

  file_url?: string; // Word/PDF gốc
  file_type?: "pdf" | "docx" | "image" | "text";

  totalPoints?: number;
  questionCount?: number;

  version?: number;

  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
}

/* =====================================================
   EXAM SUBMISSION
===================================================== */
export interface ExamSubmission {
  id: string;

  examId: string;
  studentId: string;

  answers: Record<string, any>;

  score?: number;
  graded?: boolean;

  submittedAt: string;
  gradedAt?: string;
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
  updatedAt?: string;

  lessonCount?: number;
  fileCount?: number;

  isArchived?: boolean;
}

/* =====================================================
   CLASS
===================================================== */
export interface Class {
  id: string;
  name: string;

  teacherId: string;

  studentCount?: number;

  studentIds?: string[];
  pendingStudentIds?: string[];

  createdAt: string;
  updatedAt?: string;
}
