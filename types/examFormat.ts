// types/examFormat.ts

/* ===============================
   QUESTION TYPES
================================ */

export type ExamQuestionType =
  | "multiple_choice"
  | "essay"
  | "true_false"
  | "short_answer";

/* ===============================
   CHOICE
================================ */

export interface ExamChoice {
  id: string;
  content: string; // hỗ trợ LaTeX string
}

/* ===============================
   QUESTION
================================ */

export interface ExamQuestion {
  id: string;
  order: number;
  type: ExamQuestionType;

  // Nội dung câu hỏi (hỗ trợ công thức toán LaTeX)
  content: string;

  // MCQ
  choices?: ExamChoice[];
  correctAnswer?: string;

  // Tự luận
  maxScore?: number;

  // Metadata mở rộng
  explanation?: string;
}

/* ===============================
   EXAM
================================ */

export interface OnlineExam {
  id: string;
  title: string;

  subject?: string;
  grade?: string;
  difficulty?: string;

  questions: ExamQuestion[];

  createdBy: string;
  createdAt: number;
  updatedAt?: number;

  durationMinutes?: number;
  shuffleQuestions?: boolean;
  shuffleChoices?: boolean;

  totalPoints?: number;

  isLocked?: boolean;
}
