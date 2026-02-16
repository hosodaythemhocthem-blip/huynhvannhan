
export type Role = 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl?: string;
  isApproved?: boolean;
  classId?: string; // Lưu ID lớp học sinh đăng ký
  className?: string; // Lưu tên lớp để hiển thị nhanh
}

export enum QuestionType {
  MCQ = 'MCQ',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER'
}

export interface ExamChoice {
  id: string;
  label: string;
  content: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  choices?: ExamChoice[];
  options?: string[];
  subQuestions?: any[];
  correctAnswer: any;
  points: number;
  explanation?: string;
  section?: number;
}

export type MathQuestion = Question;

export interface Exam {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
  duration: number;
  subject: string;
  grade: string;
  file_url?: string;
  isLocked: boolean;
  assignedClassIds?: string[];
}

export type OnlineExam = Exam;

export interface Course {
  id: string;
  title: string;
  grade: string;
  description?: string;
  teacherName?: string;
  lessonCount?: number;
  fileCount?: number;
  lessons?: any[];
  createdAt?: string;
}

export interface ProgressData {
  name: string;
  hours: number;
}
