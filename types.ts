/* ======================================================
   USER
====================================================== */

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "teacher" | "student"

  isApproved?: boolean

  createdAt: string
  updatedAt: string
}

/* ======================================================
   EXAM
====================================================== */

export interface Exam {
  id: string
  title: string
  teacher_id: string

  description?: string

  questions: Question[]

  isLocked?: boolean
  isArchived?: boolean

  file_url?: string
  raw_content?: string

  version: number

  createdAt: string
  updatedAt: string
}

/* ======================================================
   QUESTION
====================================================== */

export enum QuestionType {
  MCQ = "MCQ",
  TRUE_FALSE = "TRUE_FALSE",
  SHORT_ANSWER = "SHORT_ANSWER",
}

export interface Question {
  id: string
  examId?: string   // 🔥 optional để tránh TS2741

  type: QuestionType

  content: string

  options?: string[]
  correctAnswer?: number

  points: number
  order: number
  section?: number

  explanation?: string
  image_url?: string

  aiGenerated?: boolean

  isDeleted: boolean
  version: number

  createdAt: string
  updatedAt: string
}
