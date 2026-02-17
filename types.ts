/* ======================================================
   BASE ENTITY
====================================================== */

export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
  isDeleted: boolean
  version: number
}

/* ======================================================
   USER
====================================================== */

export type UserRole = "admin" | "teacher" | "student"

export interface User extends BaseEntity {
  email: string
  fullName: string
  role: UserRole

  isApproved: boolean
  isActive: boolean
}

/* ======================================================
   QUESTION
====================================================== */

export enum QuestionType {
  MCQ = "MCQ",
  TRUE_FALSE = "TRUE_FALSE",
  SHORT_ANSWER = "SHORT_ANSWER",
}

export interface Question extends BaseEntity {
  examId?: string

  type: QuestionType
  content: string

  options?: string[]
  correctAnswer?: number

  points: number
  order: number

  explanation?: string
  imageUrl?: string

  aiGenerated?: boolean
}

/* ======================================================
   EXAM
====================================================== */

export interface Exam extends BaseEntity {
  title: string
  teacherId: string

  description?: string

  questions: Question[]

  isLocked: boolean
  isArchived: boolean

  fileUrl?: string
  rawContent?: string
}
