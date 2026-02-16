/**
 * HỆ THỐNG KIỂU DỮ LIỆU CHUẨN - PHIÊN BẢN THẦY HUỲNH VĂN NHẪN
 * Đã sửa toàn bộ lỗi TS2322, TS2741, TS2353
 */

export type Role = 'teacher' | 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatar?: string;
  isApproved?: boolean; // Dùng để Thầy Nhẫn duyệt học sinh
  classId?: string;
  className?: string;
  createdAt?: string;
  password?: string; // Tránh lỗi TS2353 trong authService
}

export enum QuestionType {
  MCQ = 'multiple-choice',
  TRUE_FALSE = 'true-false',
  SHORT_ANSWER = 'short-answer',
  ESSAY = 'essay',
  MATH = 'math' // Loại chuyên biệt cho Toán học
}

export interface Question {
  id: string;
  type: QuestionType;
  content: string;        // Luôn dùng content để hiện công thức Toán
  options: string[];      // Danh sách đáp án A, B, C, D
  correctAnswer: any;     // Vị trí index hoặc text đáp án đúng
  points: number;
  explanation?: string;   // Lời giải chi tiết
  section?: number;
  image_url?: string;     // Hỗ trợ chèn ảnh vào câu hỏi
  text?: string;          // Giữ lại để tương thích ngược (Mapping)
}

// Chuyên biệt cho các đề thi Toán học siêu đỉnh
export interface MathQuestion extends Question {
  latex?: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  teacherName?: string;
  questions: Question[];
  duration: number;       // Phút
  subject: string;
  grade: string;
  createdAt: string;
  updatedAt: string;
  isLocked: boolean;
  assignedClassIds?: string[];
  file_url?: string;      // Đường dẫn file Word/PDF gốc trên Supabase
}

// Kiểu dữ liệu đồng bộ cho trang LMS
export type OnlineExam = Exam;

export interface Course {
  id: string;
  title: string;
  description?: string;
  teacherId: string;
  grade: string;
  createdAt: string;
  lessonCount?: number;
  fileCount?: number;
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  studentCount?: number;
  createdAt: string;
}
