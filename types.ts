
/* =========================
   HỆ THỐNG ĐỊNH DANH & PHÂN QUYỀN
========================= */

export enum UserRole {
  GUEST = 'guest',
  TEACHER = 'teacher',
  STUDENT = 'student',
  ADMIN = 'admin'
}

export enum AccountStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

/* =========================
   HỆ THỐNG KHÓA HỌC & BÀI GIẢNG (LMS CORE)
========================= */

export type LessonType = 'video' | 'reading' | 'quiz' | 'ai_interactive';

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: LessonType;
  content: string; // Hỗ trợ Markdown + LaTeX
  completed?: boolean;
  videoUrl?: string;
  aiSuggestedFocus?: string; // AI gợi ý phần cần tập trung
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  description?: string;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  imageUrl: string; // Đồng bộ với thumbnail
  progress: number;
  category: string;
  description: string;
  level?: 'Cơ bản' | 'Trung cấp' | 'Nâng cao' | 'Chuyên sâu' | string;
  rating?: number;
  students?: number;
  modules?: Module[];
  // Added lessons property to fix errors in components referencing lessons directly on Course
  lessons: Lesson[]; 
  tags?: string[];
}

/* =========================
   CẤU TRÚC ĐỀ THI & CÂU HỎI (THPT 2025 STANDARD)
========================= */

export enum QuestionType {
  MULTIPLE_CHOICE = 'mcq',   // Phần I: 4 chọn 1 (0.25đ)
  TRUE_FALSE = 'tf',         // Phần II: Đúng/Sai 4 ý (1.0đ)
  SHORT_ANSWER = 'short',    // Phần III: Trả lời ngắn điền số (0.5đ)
}

export interface SubQuestion {
  id: string; // a, b, c, d
  text: string;
  correctAnswer: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  section: 1 | 2 | 3;
  text: string;
  options?: string[]; // Dành cho MCQ
  subQuestions?: SubQuestion[]; // Dành cho Đúng/Sai
  correctAnswer: any; // index (MCQ), boolean[] (TF), string (Short)
  points?: number;
  explanation?: string; // Giải thích từ AI
  difficulty?: 'Dễ' | 'Trung bình' | 'Khó' | 'Cực khó';
}

export interface Exam {
  id: string;
  title: string;
  createdAt: string;
  questionCount: number;
  isLocked: boolean;
  assignedClassIds?: string[];
  duration: number; // Phút
  maxScore: number;
  questions: Question[];
  scoringConfig: {
    part1Points: number;
    part2Points: number;
    part3Points: number;
  };
}

/* =========================
   HỆ THỐNG ĐIỂM SỐ & AI ANALYTICS
========================= */

export interface Grade {
  id: string;
  studentName: string;
  examId: string;
  examTitle: string;
  classId: string;
  score: number;
  attempt: number;
  submittedAt: string;
  timeSpent: number; // Giây
  cheatingRisk: 'Low' | 'Medium' | 'High';
  aiAnalysis?: {
    weakPoints: string[]; // Các phần kiến thức yếu
    improvementPlan: string; // Lộ trình AI gợi ý
  };
}

/* =========================
   GAMIFICATION (VINH DANH & TRÒ CHƠI)
========================= */

export interface Badge {
  id: string;
  name: string;
  icon: string;
  criteria: string;
  color: string;
}

export interface StudentAccount {
  username: string;
  name: string;
  classId: string;
  teacherUsername: string;
  points: number; // Điểm kinh nghiệm (XP)
  badges: Badge[];
  streak: number; // Số ngày học liên tiếp
  rank: 'Đồng' | 'Bạc' | 'Vàng' | 'Kim cương' | 'Thách đấu';
}

/* =========================
   DỮ LIỆU THỐNG KÊ (DASHBOARD)
========================= */

export interface ProgressData {
  name: string; // Thứ hoặc Ngày
  hours: number;
  tasksCompleted?: number;
}

export interface DashboardStats {
  totalStudents: number;
  avgScore: number;
  passRate: number;
  activeLessons: number;
}

/* =========================
   AI & TRỢ LÝ ẢO
========================= */

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  isMathFormula?: boolean;
}
