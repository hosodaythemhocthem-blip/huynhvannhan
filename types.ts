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

/** 🔁 Alias để tương thích code cũ */
export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  status: AccountStatus | ApprovalStatus;
  displayName?: string;
  photoURL?: string;
  school?: string;
  classId?: string;
  requestedClassName?: string;
  createdAt: string;
  lastLoginAt?: string;
}

/** Legacy support */
export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  school?: string;
  status?: ApprovalStatus;
  classId?: string;
  requestedClassName?: string;
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
  content: string;
  type?: LessonType;
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
  instructor?: string;
  teacherName?: string; // legacy
  imageUrl?: string;
  thumbnail?: string;
  category?: string;
  description?: string;
  grade?: string;
  level?: string;
  rating?: number;
  students?: number;
  progress?: number;
  lessonCount?: number;
  lessons?: Lesson[]; // legacy
  modules?: Module[];
  createdAt?: any;
  updatedAt?: string;
}

/* ======================================================
   HỆ THỐNG ĐỀ THI – CHUẨN THPT
====================================================== */

export enum QuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
  TRUE_FALSE = "true_false",
  SHORT_ANSWER = "short_answer",
}

export interface SubQuestion {
  id: string;
  text: string;
  correctAnswer: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  section: number;
  text: string;
  options?: string[];
  subQuestions?: SubQuestion[];
  correctAnswer?: any;
  difficulty?: string;
  points: number;
  explanation?: string;
}

export interface ScoringConfig {
  part1Points: number;
  part2Points: number;
  part3Points: number;
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
  scoringConfig?: ScoringConfig;
  assignedClassIds?: string[];
  assignedClass?: string;
}

/* ======================================================
   ĐIỂM SỐ – CHẤM BÀI
====================================================== */

export interface Grade {
  id: string;
  studentName: string;
  studentId?: string;
  examTitle: string;
  examId?: string;
  score: number;
  maxScore?: number;
  attempt: number;
  cheatingRisk: string;
  submittedAt: string;
  timeSpent?: number;
  classId: string;
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
  uid?: string;
  username: string;
  name: string;
  status?: ApprovalStatus;
  classId: string;
  requestedClassName?: string;
  teacherUsername?: string;
  points?: number;
  badges?: Badge[];
  streak?: number;
  rank?: string;
}

/* ======================================================
   DASHBOARD – THỐNG KÊ
====================================================== */

export interface ProgressData {
  name: string;
  hours: number;
}

export interface DashboardStats {
  courses?: number;
  exams?: number;
  students?: number;
  totalStudents?: number;
  avgScore?: number;
  passRate?: number;
  activeLessons?: number;
}

/* ======================================================
   LỚP HỌC
====================================================== */

export interface ClassItem {
  id: string;
  name: string;
  grade: string;
  teacher: string;
  studentCount: number;
}

/* ======================================================
   AI CHAT / TUTOR
====================================================== */

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "model" | "system";
  content?: string;
  text?: string;
  timestamp?: Date;
  isMathFormula?: boolean;
}
