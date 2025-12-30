
export enum TabType {
  EXAMS = 'exams',
  CLASSES = 'classes',
  GRADES = 'grades',
  GAMES = 'games'
}

export enum UserRole {
  GUEST = 'guest',
  TEACHER = 'teacher',
  STUDENT = 'student',
  ADMIN = 'admin'
}

export type AccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TeacherAccount {
  username: string;
  password?: string;
  name: string;
  school: string;
  code: string;
  status: AccountStatus;
  createdAt: string;
}

export interface StudentAccount {
  username: string;
  password?: string;
  name: string;
  classId: string;
  requestedClassName?: string;
  status: AccountStatus;
  createdAt: string;
  teacherUsername: string;
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'mcq', // Phần I: 4 chọn 1
  TRUE_FALSE = 'tf',       // Phần II: Đúng/Sai
  SHORT_ANSWER = 'short'   // Phần III: Trả lời ngắn
}

export interface SubQuestion {
  id: string; // a, b, c, d
  text: string;
  correctAnswer: boolean; // true = Đúng, false = Sai
}

export interface Question {
  id: string;
  type: QuestionType;
  section: 1 | 2 | 3;
  text: string;
  options: string[];      // Dùng cho MCQ (Phần I)
  subQuestions?: SubQuestion[]; // Dùng cho Đúng/Sai (Phần II)
  correctAnswer: any;     // MCQ: index, Short: string, TF: xử lý riêng
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
  duration: number;
  maxScore: number;
  questions?: Question[];
  scoringConfig?: {
    part1Points: number; // Mặc định 0.25
    part2Points: number; // Mặc định 1.0 (cho 4 ý)
    part3Points: number; // Mặc định 0.5
  };
}

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

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// Fix: Added Lesson interface for course modules
export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'reading';
  content: string;
  completed?: boolean;
  videoUrl?: string;
}

// Fix: Added Module interface for grouping lessons in a course
export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

// Fix: Added Course interface to resolve errors in multiple files (mockData.ts, constants.tsx, components)
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

// Fix: Added ProgressData interface for chart data components
export interface ProgressData {
  name: string;
  hours: number;
}
