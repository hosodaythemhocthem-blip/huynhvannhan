export enum UserRole {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
}

export enum AccountStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  BLOCKED = "BLOCKED",
}

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  createdAt?: any;
}
