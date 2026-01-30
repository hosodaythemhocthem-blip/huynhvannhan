export type ExamQuestionType =
  | "multiple_choice"
  | "essay";

export interface ExamChoice {
  id: string;
  content: string;
}

export interface ExamQuestion {
  id: string;
  order: number;
  type: ExamQuestionType;
  content: string;

  // dùng cho trắc nghiệm
  choices?: ExamChoice[];
  correctAnswer?: string;

  // dùng cho tự luận
  maxScore?: number;
}

export interface OnlineExam {
  id: string;
  title: string;
  subject?: string;
  grade?: string;

  questions: ExamQuestion[];

  createdBy: string;
  createdAt: number;

  // mở rộng sau
  durationMinutes?: number;
  shuffleQuestions?: boolean;
}
