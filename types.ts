/* ======================================================
   BASE ENTITY
====================================================== */
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

/* ======================================================
   USER (profiles)
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

  // 🔥 thêm để tránh lỗi build
  duration?: number
  questions?: any[]
}
