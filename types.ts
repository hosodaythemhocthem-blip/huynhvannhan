/* ======================================================
   BASE ENTITY
====================================================== */

export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

/* ======================================================
   USER
====================================================== */

export type UserRole = "admin" | "teacher" | "student"

export type UserStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"

export interface User extends BaseEntity {
  email: string
  full_name: string
  role: UserRole
  status: UserStatus
  class_id?: string | null
}

/* ======================================================
   CLASS
====================================================== */

export interface Class extends BaseEntity {
  name: string
  teacher_id: string
  description?: string | null
  is_active: boolean
}

/* ======================================================
   QUESTION
====================================================== */

export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "essay"

export interface Question extends BaseEntity {
  exam_id: string
  content: string
  type: QuestionType

  options?: string[] | null
  correct_answer?: string | null

  points: number
  order: number

  explanation?: string | null
  section?: string | null
}

/* ======================================================
   EXAM
====================================================== */

export interface Exam extends BaseEntity {
  title: string
  teacher_id: string

  description: string | null
  is_locked: boolean
  is_archived: boolean

  file_url: string | null
  raw_content: string | null

  total_points: number
  version: number
}

/* ======================================================
   EXAM SUBMISSION
====================================================== */

export interface ExamSubmission extends BaseEntity {
  exam_id: string
  student_id: string

  answers: Record<string, string>
  score: number | null

  is_submitted: boolean
}

/* ======================================================
   AI LOG
====================================================== */

export interface AiLog extends BaseEntity {
  user_id: string
  exam_id?: string | null
  prompt: string
  response: string
}
