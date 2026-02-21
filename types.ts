/* ======================================================
   BASE ENTITY
====================================================== */

export interface BaseEntity {
  id: string
  created_at?: string // Thêm dấu ? để frontend có thể tự tạo ID tạm mà không bị lỗi thiếu field
  updated_at?: string
}

/* ======================================================
   USER
====================================================== */

export type UserRole = "admin" | "teacher" | "student"

export type UserStatus =
  | "pending"
  | "active"   // Đổi từ approved thành active cho khớp với logic Login
  | "rejected"
  | "suspended"

export interface User extends BaseEntity {
  email: string
  full_name: string
  role: UserRole
  status?: UserStatus // Optional cho lúc mới đăng nhập
  class_id?: string | null
  avatar?: string     // Thêm field avatar cho giao diện
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

// Interface dùng chung cho Database
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
  teacher_id?: string // Thêm optional cho lúc tạo mới chưa có ID

  description?: string | null
  is_locked?: boolean
  is_archived?: boolean

  file_url?: string | null
  raw_content?: string | null
  
  // Field bổ sung để Frontend lưu mảng JSON câu hỏi trực tiếp vào bảng Exam (nếu muốn)
  questions?: any[] | null 

  total_points?: number
  version?: number
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
