/* ======================================================
   BASE ENTITY
====================================================== */

export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

/* ======================================================
   USER (TABLE: profiles)
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

/* ======================================================
   QUESTION
====================================================== */

export type QuestionType = "mcq" | "true_false" | "short_answer"

export interface Question extends BaseEntity {
  exam_id: string
  content: string
  type: QuestionType
  options: string[] | null
  correct_answer: string | null
  explanation: string | null
  points: number
  order_index: number
}
