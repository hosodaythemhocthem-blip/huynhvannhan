/* =====================================================
   USER ROLES
===================================================== */

export enum UserRole {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
}

/* =====================================================
   ACCOUNT STATUS
===================================================== */

export enum AccountStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  BLOCKED = "BLOCKED",
}

/* =====================================================
   SUPABASE USER MODEL
===================================================== */

export interface AppUser {
  /** ID từ Supabase Auth (uuid) */
  id: string;

  /** Username đăng nhập */
  username: string;

  /** Email nội bộ (username@lms.local) */
  email: string;

  /** Vai trò hệ thống */
  role: UserRole;

  /** Trạng thái tài khoản */
  status: AccountStatus;

  /** Thời điểm tạo */
  created_at?: string;

  /** Thời điểm cập nhật */
  updated_at?: string;
}
