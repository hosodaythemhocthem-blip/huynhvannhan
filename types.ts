/**
 * HỆ THỐNG KIỂU DỮ LIỆU CHUẨN - LMS PRODUCTION READY V5
 * Backward Compatible + Supabase Ready + AI Ready
 */

export type Role = "teacher" | "student" | "admin";

/* =====================================================
   COMMON BASE MODEL
===================================================== */

export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

/* =====================================================
   USER
===================================================== */

export interface User extends BaseEntity {
  email: string;
  fullName: string;
  role: Role;

  avatar?: string;
  isApproved?: boolean;

  classId?: string;
  className?: string;

  lastLoginAt?: string;
  isActive?: boolean;
}

/* =====================================================
   FILE STORAGE
===================================================== */

export type FileType = "pdf" | "docx" | "image" | "text";

export interface UploadedFile extends BaseEntity {
  fileName: string;
  fileUrl: string;
  fileType: FileType;
  fileSize?: number;
  uploadedBy: string;
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
   BASE QUESTION
===================================================== */

export interface BaseQuestion extends BaseEntity {
  type: QuestionType;

  /**
   * Chuẩn mới dùng content
   * Nhưng vẫn hỗ trợ text legacy
   */
  content: string;

  /**
   * Legacy support
   */
  text?: string;

  points: number;

  explanation?: string;
  section?: number;
  image_url?: string;
  order?: number;
  isDeleted?: boolean;
}

/* =====================================================
   QUESTION TYPES
===================================================== */

export interface MCQQuestion extends BaseQuestion {
  type: QuestionType.MCQ;
  options: string[];
  correctAnswer: number;
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
  correctAnswer: string;
  latexSource?: string;
}

export type Question =
  | MCQQuestion
  | TrueFalseQuestion
  | ShortAnswerQuestion
  | EssayQuestion
  | MathQuestion;

/* =====================================================
   EXAM
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
  isPublished?: boolean;
  isArchived?: boolean;

  assignedClassIds?: string[];

  file_url?: string;
  file_type?: FileType;

  totalPoints?: number;
  questionCount?: number;

  version?: number;

  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;

  aiGenerated?: boolean;
}

/* =====================================================
   EXAM SUBMISSION
===================================================== */

export interface ExamSubmission extends BaseEntity {
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

export interface Course extends BaseEntity {
  title: string;
  description?: string;

  teacherId: string;
  grade: string;

  lessonCount?: number;
  fileCount?: number;

  isArchived?: boolean;
}

/* =====================================================
   CLASS
===================================================== */

export interface Class extends BaseEntity {
  name: string;
  teacherId: string;

  studentCount?: number;

  studentIds?: string[];
  pendingStudentIds?: string[];
}
