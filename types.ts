export type Role = 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatar?: string;       // Sửa lỗi TS2353 trong authService.ts
  avatarUrl?: string;    // Giữ lại để tương thích ngược
  isApproved?: boolean;
  classId?: string; 
  className?: string; 
  createdAt?: string;    // Sửa lỗi TS2353 trong authService.ts
}

export enum QuestionType {
  MCQ = 'multiple-choice', // Đổi giá trị để khớp với logic AI và Editor
  TRUE_FALSE = 'true-false',
  SHORT_ANSWER = 'short-answer',
  ESSAY = 'essay'
}

export interface ExamChoice {
  id: string;
  label: string;
  content: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  content: string;        // Thống nhất dùng 'content' thay vì 'text' để khớp với Editor
  text?: string;          // Giữ lại để tránh lỗi các file cũ chưa cập nhật
  choices?: ExamChoice[];
  options: string[];      // Ép kiểu array string để dễ xử lý công thức toán
  subQuestions?: any[];
  correctAnswer: any;
  points: number;
  explanation?: string;
  section?: number;
}

// Sửa lỗi TS2305: Module có exported member 'MathQuestion'
export interface MathQuestion extends Question {
  latex?: string;
}

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
