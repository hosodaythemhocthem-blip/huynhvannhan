// services/exam.service.ts

import { supabase } from "../supabase";
import { Exam } from "../types";

const TABLE = "exams";
const BUCKET = "exam-files";

export const ExamService = {
  /* =========================
     ➕ CREATE
  ========================= */
  async createExam(
    exam: Exam,
    file?: File
  ): Promise<string> {
    let fileUrl: string | null = null;
    let filePath: string | null = null;

    /* ===== UPLOAD FILE IF EXISTS ===== */
    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${exam.teacherId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file);

      if (uploadError) {
        throw new Error("file-upload-failed");
      }

      const { data } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      fileUrl = data.publicUrl;
      filePath = path;
    }

    /* ===== INSERT DATABASE ===== */
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        title: exam.title,
        description: exam.description,
        teacher_id: exam.teacherId,
        file_url: fileUrl,
        file_path: filePath,
        is_archived: false,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error("exam-create-failed");
    }

    return data.id;
  },

  /* =========================
     ✏️ UPDATE
  ========================= */
  async updateExam(
    examId: string,
    data: Partial<Exam>
  ): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({
        title: data.title,
        description: data.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", examId);

    if (error) {
      throw new Error("exam-update-failed");
    }
  },

  /* =========================
     📥 GET BY ID
  ========================= */
  async getExamById(
    examId: string
  ): Promise<Exam | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", examId)
      .eq("is_archived", false)
      .single();

    if (error || !data) return null;

    return this.mapExam(data);
  },

  /* =========================
     📚 GET BY TEACHER
  ========================= */
  async getExamsByTeacher(
    teacherId: string
  ): Promise<Exam[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("teacher_id", teacherId)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map(this.mapExam);
  },

  /* =========================
     🗑️ ARCHIVE (SOFT DELETE + DELETE FILE)
  ========================= */
  async archiveExam(examId: string): Promise<void> {
    const { data } = await supabase
      .from(TABLE)
      .select("file_path")
      .eq("id", examId)
      .single();

    if (data?.file_path) {
      await supabase.storage
        .from(BUCKET)
        .remove([data.file_path]);
    }

    const { error } = await supabase
      .from(TABLE)
      .update({
        is_archived: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", examId);

    if (error) {
      throw new Error("exam-archive-failed");
    }
  },

  /* =========================
     🧠 INTERNAL MAP
  ========================= */
  mapExam(raw: any): Exam {
    return {
      id: raw.id,
      title: raw.title,
      description: raw.description,
      teacherId: raw.teacher_id,
      fileUrl: raw.file_url,
      filePath: raw.file_path,
      isArchived: raw.is_archived,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };
  },
};
