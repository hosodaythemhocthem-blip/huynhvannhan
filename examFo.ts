export type QuestionType = "MCQ" | "TRUE_FALSE" | "SHORT";

export interface BaseQuestion {
  id: string;
  content: string;
  points: number;
  type: QuestionType;
}

export interface MCQQuestion extends BaseQuestion {
  type: "MCQ";
  options: string[];
  correct_answer: number;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: "TRUE_FALSE";
  correct_answer: boolean;
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: "SHORT";
  correct_answer: string;
}

export type ExamQuestion =
  | MCQQuestion
  | TrueFalseQuestion
  | ShortAnswerQuestion;
