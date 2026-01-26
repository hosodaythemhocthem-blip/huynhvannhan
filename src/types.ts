/* =========================
   TAB & ROLE
========================= */

export enum TabType {
  EXAMS = 'exams',
  CLASSES = 'classes',
  GRADES = 'grades',
  GAMES = 'games',
}

export enum UserRole {
  GUEST = 'guest',
  TEACHER = 'teacher',
  STUDENT = 'student',
  ADMIN = 'admin',
}

export type AccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/* =========================
   ACCOUNT
========================= */

export interface BaseAccount {
  username: string;
  password?: string;
  name: string;
  status: AccountStatus;
  createdAt: string;
}

export interface TeacherAccount extends BaseAccount {
  school: string;
  code: string; // mã giáo viên
}

export interface StudentAccount extends BaseAccount {
  classId: string;
  requestedClassName?: string;
  teacherUsername: string;
}

/* =========================
   QUESTION & EXAM
========================= */

export enum QuestionType {
  MULTIPLE_CHOICE = 'mcq',   // Phần I: 4 chọn 1
  TRUE_FALSE = 'tf',         // Phần II: Đúng / Sai
  SHORT_ANSWER = 'short',    // Phần III: Trả lời ngắn
}

export interface SubQuestion {
  id: string;               // a, b, c, d
  text: string;
  correctAnswer: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  section: 1 | 2 | 3;
  text: string;
  options?: string[];            // chỉ dùng cho MCQ
  subQuestions?: SubQuestion[];  // chỉ dùng cho Đúng / Sai
  correctAnswer: number | string | boolean | boolean[];
  points?: number;
}

export interface Exam {
  id: string;
  title: string;
  createdAt: string;
  questionCount: number;
  isLocked: boolean;

  assignedClass: string;
  assignedClassId: string;
  assignedClassIds?: string[];

  duration: number; // phút
  maxScore: number;

  questions?: Question[];

  scoringConfig?: {
    part1Points: number; // mặc định 0.25
    part2Points: number; // mặc định 1.0 (4 ý)
    part3Points: number; // mặc định 0.5
  };
}

/* =========================
   CLASS & GRADE
========================= */

export interface Class {
  id: string;
  name: string;
  studentCount: number;
}

export interface Grade {
  id: string;
  studentName: string;
  examTitle: string;
  classId: string;
  attempt: number;
  score: number;
  cheatingRisk: string;
  submittedAt: string;
}

/* =========================
   AI CHAT
========================= */

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

/* =========================
   COURSE / LMS
========================= */

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'reading';
  content: string;
  completed?: boolean;
  videoUrl?: string;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  thumbnail: string;
  progress: number;
  category: string;
  description: string;
  level: string;
  rating: number;
  students: number;
  modules: Module[];
}

/* =========================
   CHART / STAT
========================= */

export interface ProgressData {
  name: string;
  hours: number;
}
