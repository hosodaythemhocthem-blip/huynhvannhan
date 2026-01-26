// src/types.ts

export enum UserRole {
  GUEST = 'GUEST',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN'
}

export enum TabType {
  EXAMS = 'EXAMS',
  CLASSES = 'CLASSES',
  GRADES = 'GRADES',
  GAMES = 'GAMES'
}

export interface TeacherAccount {
  username: string;
  name: string;
}

export interface Question {
  id: string;
  content: string;
  options?: string[];
  correctAnswer?: string;
}

export interface Exam {
  id: string;
  title: string;
  createdAt: string;
  questionCount: number;
  questions: Question[];
  isLocked: boolean;
  assignedClassIds: string[];
}
