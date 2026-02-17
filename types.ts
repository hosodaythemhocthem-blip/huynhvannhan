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
  | "pending"     // học sinh chờ duyệt
  | "approved"    // đã được duyệt
  | "rejected"    // bị từ chối
  | "suspended"   // bị khóa

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
  content: string              // hỗ trợ LaTeX
  type: QuestionType

  options?: string[] | null
  correct_answer?: string | null

  points: number               // điểm câu
  order: number                // thứ tự hiển thị

  explanation?: string | null  // lời giải AI
  section?: string | null      // phần I, II, III
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

  file_url: string | null       // file word/pdf gốc
  raw_content: string | null    // nội dung đã parse

  total_points: number
  version: number               // phục vụ autosave
}

/* ======================================================
   EXAM SUBMISSION
====================================================== */

export interface ExamSubmission extends BaseEntity {
  exam_id: string
  student_id: string

  answers: Record<string, string>  // question_id -> answer
  score: number | null

  is_submitted: boolean
}

/* ======================================================
   AI LOG (phân tích học lực sau này)
====================================================== */

export interface AiLog extends BaseEntity {
  user_id: string
  exam_id?: string | null
  prompt: string
  response: string
}
