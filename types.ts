/**
 * 🚀 LUMINA LMS V7 PRO MAX
 * Designed for Thầy Huỳnh Văn Nhẫn
 * Strict Mode Safe | AI Optimized | Supabase Sync | Word/PDF Ready
 */

export type Role = "teacher" | "student" | "admin";
export type UserStatus = "pending" | "approved" | "rejected" | "active";

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
   QUESTION SYSTEM (AI + MATH READY)
===================================================== */
export enum QuestionType {
  MCQ = "multiple-choice",
  TRUE_FALSE = "true-false",
  SHORT_ANSWER = "short-answer",
  MATH = "math",
}

export interface QuestionMeta {
  aiConfidence?: number;
  source?: "manual" | "ai" | "imported";
  importedFrom?: "pdf" | "docx" | "clipboard";
}

export interface Question extends BaseEntity {
  examId: string;
  type: QuestionType;

  /**
   * 🔥 Core content field (LaTeX supported)
   * Example: "Tính $\\int_0^1 x^2 dx$"
   */
  content: string;

  /**
   * ⚠ Backward compatibility
   * Nếu hệ thống cũ còn dùng text
   */
  legacyText?: string;

  options?: string[];

  correctAnswer: string | number | boolean;

  explanation?: string;

  points: number;

  order: number;

  image_url?: string;

  ai_suggested?: boolean;

  meta?: QuestionMeta;
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
   DRAFT EXAM (AUTO SAVE SUPPORT)
===================================================== */
export interface DraftExam {
  tempId: string;
  teacherId: string;
  rawText?: string;
  parsedExam?: Partial<Exam>;
  lastEditedAt: string;
}

/* =====================================================
   CLASS SYSTEM
===================================================== */
export interface Class extends BaseEntity {
  name: string;
  teacherId: string;
  inviteCode: string;
  studentCount: number;
  activeStudentIds: string[];
  pendingStudentIds: string[];
}

/* =====================================================
   QUIZ RESULT
===================================================== */
export interface QuizResult extends BaseEntity {
  examId: string;
  studentId: string;
  studentName: string;
  answers: Record<string, any>;
  score: number;
  timeSpent: number;
  completedAt: string;
}

/* =====================================================
   SUPABASE DATABASE MAP
===================================================== */
export interface DBTableMap {
  profiles: {
    id: string;
    email: string;
    full_name: string;
    role: Role;
    status: UserStatus;
    class_id?: string;
    created_at: string;
  };

  exams: {
    id: string;
    title: string;
    teacher_id: string;
    duration: number;
    subject: string;
    is_published: boolean;
    created_at: string;
  };

  questions: {
    id: string;
    exam_id: string;
    content: string;
    options: string[] | null;
    correct_answer: string;
    points: number;
    order: number;
  };
}
