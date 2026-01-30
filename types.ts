/* ======================================================
   AUTH + RBAC – PHÂN QUYỀN NGƯỜI DÙNG
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
  school?: string;
  classId?: string;
  requestedClassName?: string;
  createdAt: string;
  lastLoginAt?: string;
}

/* ======================================================
   UI COMPONENT CATALOG (ADMIN / AI BUILDER)
====================================================== */

export enum ComponentCategory {
  ACTIONS = "Actions",
  FORMS = "Forms",
  DATA_DISPLAY = "Data Display",
  FEEDBACK = "Feedback",
  NAVIGATION = "Navigation",
  AI = "AI Powered",
  MANAGEMENT = "Management",
}

export interface UIComponent {
  id: string;
  name: string;
  description: string;
  category: ComponentCategory;
  code: string;
}

/* ======================================================
   LMS CORE – COURSE / MODULE / LESSON
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
  content: string; // Markdown + LaTeX
  duration?: string;
  completed?: boolean;

  videoUrl?: string;
  attachments?: string[];

  aiSuggestedFocus?: string;
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

  imageUrl?: string;
  category?: string;
  description?: string;
  level?: "Cơ bản" | "Trung cấp" | "Nâng cao" | "Chuyên sâu" | string;

  progress?: number;
  rating?: number;
  students?: number;

  modules?: Module[];

  /** ⚠️ Legacy support */
  lessons: Lesson[];

  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/* ======================================================
   HỆ THỐNG ĐỀ THI – CHUẨN THPT 2025
====================================================== */

export enum QuestionType {
  MULTIPLE_CHOICE = "mcq",
  TRUE_FALSE = "tf",
  SHORT_ANSWER = "short",
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
  difficulty?: "Dễ" | "Trung bình" | "Khó" | "Cực khó";

  options?: string[];
  subQuestions?: SubQuestion[];

  correctAnswer: number | boolean[] | string;

  points?: number;
  explanation?: string;
}

export interface Exam {
  id: string;
  title: string;
  createdAt: string;

  duration: number;
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
   ĐIỂM SỐ – CHẤM BÀI – AI PHÂN TÍCH
====================================================== */

export interface Grade {
  id: string;

  studentId: string;
  studentName: string;
  classId: string;

  examId: string;
  examTitle: string;

  score: number;
  maxScore: number;
  attempt: number;

  submittedAt: string;
  timeSpent: number;

  cheatingRisk: "Low" | "Medium" | "High";

  aiAnalysis?: {
    weakPoints: string[];
    improvementPlan: string;
    recommendedLessons?: string[];
  };
}

/* ======================================================
   HỌC SINH – GAMIFICATION
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

  rank: "Đồng" | "Bạc" | "Vàng" | "Kim cương" | "Thách đấu";
}

/* ======================================================
   DASHBOARD – THỐNG KÊ
====================================================== */

export interface ProgressData {
  name: string;
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
   AI CHAT / TUTOR
====================================================== */

export interface ChatMessage {
  id: string;
  role: "user" | "model" | "system";
  text: string;
  timestamp: Date;
  isMathFormula?: boolean;
}
