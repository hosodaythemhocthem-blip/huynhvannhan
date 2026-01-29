/* ======================================================
   HỆ THỐNG ĐỊNH DANH & PHÂN QUYỀN (AUTH + RBAC)
====================================================== */

export enum UserRole {
  GUEST = "guest",
  STUDENT = "student",
  TEACHER = "teacher",
  ADMIN = "admin",
}

export enum AccountStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  lastLoginAt?: string;
}

/* ======================================================
   LMS CORE – KHÓA HỌC / MODULE / BÀI HỌC
====================================================== */

export type LessonType =
  | "video"
  | "reading"
  | "quiz"
  | "ai_interactive";

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  duration?: string;
  content: string; // Markdown + LaTeX
  completed?: boolean;

  videoUrl?: string;
  attachments?: string[];

  aiSuggestedFocus?: string; // AI phân tích điểm yếu
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  instructor: string;

  imageUrl: string;
  category: string;
  description: string;

  level?: "Cơ bản" | "Trung cấp" | "Nâng cao" | "Chuyên sâu" | string;

  progress: number; // %
  rating?: number;
  students?: number;

  modules?: Module[];

  /** ⚠️ Giữ để tương thích component cũ */
  lessons: Lesson[];

  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/* ======================================================
   HỆ THỐNG ĐỀ THI – CHUẨN THPT 2025
====================================================== */

export enum QuestionType {
  MULTIPLE_CHOICE = "mcq",   // Phần I – 4 chọn 1
  TRUE_FALSE = "tf",         // Phần II – Đúng/Sai 4 ý
  SHORT_ANSWER = "short",    // Phần III – Trả lời ngắn
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

  text: string; // hỗ trợ LaTeX
  difficulty?: "Dễ" | "Trung bình" | "Khó" | "Cực khó";

  options?: string[];
  subQuestions?: SubQuestion[];

  /**
   * MCQ  : number (index)
   * TF   : boolean[]
   * Short: string | number
   */
  correctAnswer: number | boolean[] | string;

  points?: number;
  explanation?: string; // AI giải thích chi tiết
}

export interface Exam {
  id: string;
  title: string;
  createdAt: string;

  duration: number; // phút
  maxScore: number;

  questionCount: number;
  questions: Question[];

  isLocked: boolean;
  assignedClassIds?: string[];

  scoringConfig: {
    part1Points: number;
    part2Points: number;
    part3Points: number;
  };
}

/* ======================================================
   ĐIỂM SỐ – CHẤM BÀI – AI ANALYTICS
====================================================== */

export interface Grade {
  id: string;
  studentId: string;
  studentName: string;

  examId: string;
  examTitle: string;
  classId: string;

  score: number;
  maxScore: number;
  attempt: number;

  submittedAt: string;
  timeSpent: number; // giây

  cheatingRisk: "Low" | "Medium" | "High";

  aiAnalysis?: {
    weakPoints: string[];
    improvementPlan: string;
    recommendedLessons?: string[];
  };
}

/* ======================================================
   GAMIFICATION – ĐỘNG LỰC HỌC TẬP
====================================================== */

export interface Badge {
  id: string;
  name: string;
  icon: string;
  criteria: string;
  color: string;
}

export interface StudentAccount {
  uid: string;
  username: string;
  name: string;

  classId: string;
  teacherUsername: string;

  points: number;
  badges: Badge[];
  streak: number;

  rank:
    | "Đồng"
    | "Bạc"
    | "Vàng"
    | "Kim cương"
    | "Thách đấu";
}

/* ======================================================
   DASHBOARD – THỐNG KÊ & BIỂU ĐỒ
====================================================== */

export interface ProgressData {
  name: string; // ngày / tuần
  hours: number;
  tasksCompleted?: number;
}

export interface DashboardStats {
  totalStudents: number;
  avgScore: number;
  passRate: number;
  activeLessons: number;
}

/* ======================================================
   AI ASSISTANT / CHAT / TUTOR
====================================================== */

export interface ChatMessage {
  id: string;
  role: "user" | "model" | "system";
  text: string;
  timestamp: Date;
  isMathFormula?: boolean;
}
