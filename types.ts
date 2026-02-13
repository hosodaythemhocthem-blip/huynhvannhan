export type UserRole = "teacher" | "student" | "admin";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  approval_status: ApprovalStatus;
  created_at?: string;
}
