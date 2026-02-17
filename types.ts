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
export type UserStatus = "pending" | "active" | "rejected"

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
  options?: string[]
  correct_answer?: string
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
}
