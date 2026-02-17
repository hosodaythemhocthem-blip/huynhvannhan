/* ======================================================
   BASE ENTITY (MAP SUPABASE)
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
}

/* ======================================================
   QUESTION (TABLE: questions)
====================================================== */

export interface Question extends BaseEntity {
  exam_id: string
  content: string
  options: string[] | null
  correct_answer: number | null
  points: number
  order_index: number
  explanation: string | null
  image_url: string | null
}

/* ======================================================
   EXAM (TABLE: exams)
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
