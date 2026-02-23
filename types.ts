/* ======================================================
   BASE ENTITY
====================================================== */

export interface BaseEntity {
  id: string;
  created_at?: string; // Thêm dấu ? để frontend có thể tự tạo ID tạm
  updated_at?: string;
}

/* ======================================================
   USER & AUTHENTICATION
====================================================== */

export type UserRole = "admin" | "teacher" | "student";

// Status này dùng cho trạng thái TÀI KHOẢN của User
export type UserStatus = "pending" | "active" | "rejected" | "suspended";

export interface User extends BaseEntity {
  email: string;
  full_name: string;
  role: UserRole;
  status?: UserStatus; 
  avatar?: string;
  phone?: string | null; // Bổ sung sđt nếu cần liên hệ
  
  // Vẫn giữ lại nếu thầy đang dùng cấu trúc 1 học sinh - 1 lớp
  class_id?: string | null; 
}

/* ======================================================
   CLASS & ENROLLMENT (HỆ THỐNG DUYỆT HỌC SINH)
====================================================== */

export interface Class extends BaseEntity {
  name: string;
  teacher_id: string;
  description?: string | null;
  invite_code?: string | null; // Mã lớp để học sinh nhập vào xin gia nhập
  is_active: boolean;
}

// Trạng thái khi học sinh xin vào lớp
export type EnrollmentStatus = "pending" | "approved" | "rejected";

// BẢNG MỚI: Quản lý việc học sinh đăng ký lớp
export interface ClassEnrollment extends BaseEntity {
  class_id: string;
  student_id: string;
  status: EnrollmentStatus;
  
  // Lấy thêm thông tin để hiển thị UI không cần join bảng quá nhiều
  student_name?: string; 
  student_email?: string;
  
  joined_at?: string; // Ngày chính thức được duyệt
}

/* ======================================================
   QUESTION
====================================================== */

export type QuestionType = "multiple_choice" | "true_false" | "essay";
export type QuestionDifficulty = "easy" | "medium" | "hard"; // Phân loại độ khó

export interface Question extends BaseEntity {
  exam_id: string;
  content: string;
  type: QuestionType;
  difficulty?: QuestionDifficulty; // Bổ sung độ khó

  options?: string[] | null;
  correct_answer?: string | null;

  points: number;
  order: number;

  explanation?: string | null;
  section?: string | null;
}

/* ======================================================
   EXAM (ĐỀ THI)
====================================================== */

export interface Exam extends BaseEntity {
  title: string;
  teacher_id?: string;
  class_id?: string | null; // Gắn đề thi vào một lớp cụ thể

  description?: string | null;
  is_locked?: boolean;
  is_archived?: boolean;

  file_url?: string | null;
  raw_content?: string | null;
  
  questions?: any[] | null; 

  total_points?: number;
  version?: number;
  
  // Bổ sung quản lý thời gian thi
  duration_minutes?: number; // Thời gian làm bài (phút)
  start_time?: string | null; // Thời gian bắt đầu mở đề
  end_time?: string | null;   // Thời gian đóng đề
}

/* ======================================================
   EXAM SUBMISSION (BÀI NỘP)
====================================================== */

export interface ExamSubmission extends BaseEntity {
  exam_id: string;
  student_id: string;

  answers: Record<string, string>;
  score: number | null;

  is_submitted: boolean;
  
  // Theo dõi chi tiết thời gian làm bài
  started_at?: string; 
  completed_at?: string;
  
  teacher_feedback?: string | null; // Giáo viên nhận xét bài làm
}

/* ======================================================
   AI LOG (NHẬT KÝ TRỢ LÝ AI)
====================================================== */

export interface AiLog extends BaseEntity {
  user_id: string;
  exam_id?: string | null;
  prompt: string;
  response: string;
}

/* ======================================================
   NOTIFICATION (HỆ THỐNG THÔNG BÁO - TÙY CHỌN)
====================================================== */

// BẢNG MỚI: Dùng để đẩy thông báo "Có 1 học sinh xin vào lớp" cho giáo viên
export interface Notification extends BaseEntity {
  user_id: string; // ID của người nhận thông báo (Giáo viên)
  title: string;
  message: string;
  is_read: boolean;
  link_url?: string; // Link bấm vào (ví dụ: /teacher/class-management)
}
