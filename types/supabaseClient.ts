// types/supabaseClient.ts

/**
 * ==========================================================
 * SUPABASE DATABASE TYPES – LMS PRO
 * ==========================================================
 * Typed chuẩn để fix toàn bộ lỗi TS:
 * - .eq
 * - .order
 * - insert/update/delete
 * - count errors
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: "teacher" | "student" | "admin";
          is_approved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          role: "teacher" | "student" | "admin";
          is_approved?: boolean;
          created_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string;
          role?: "teacher" | "student" | "admin";
          is_approved?: boolean;
        };
      };

      classes: {
        Row: {
          id: string;
          name: string;
          teacher_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          teacher_id: string;
          created_at?: string;
        };
        Update: {
          name?: string;
        };
      };

      exams: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          teacher_id: string;
          file_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          teacher_id: string;
          file_url?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          file_url?: string | null;
        };
      };

      grades: {
        Row: {
          id: string;
          exam_id: string;
          student_id: string;
          score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          exam_id: string;
          student_id: string;
          score: number;
          created_at?: string;
        };
        Update: {
          score?: number;
        };
      };

      app_sync: {
        Row: {
          id: string;
          type: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          payload: Json;
          created_at?: string;
        };
        Update: {
          payload?: Json;
        };
      };
    };
  };
}
