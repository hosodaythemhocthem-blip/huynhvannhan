import { Timestamp } from "firebase/firestore";

/**
 * Vai trò người dùng trong hệ thống
 */
export enum UserRole {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
}

/**
 * Trạng thái tài khoản
 */
export enum AccountStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  BLOCKED = "BLOCKED",
}

/**
 * User dùng chung cho toàn hệ thống
 * - Lưu trong Firestore
 * - Đồng bộ Auth + DB
 */
export interface AppUser {
  /** UID từ Firebase Auth */
  uid: string;

  /** Email đăng nhập */
  email: string;

  /** Vai trò hệ thống */
  role: UserRole;

  /** Trạng thái tài khoản */
  status: AccountStatus;

  /** Thời điểm tạo (Firestore) */
  createdAt?: Timestamp;

  /** Thời điểm cập nhật gần nhất */
  updatedAt?: Timestamp;
}
