import { supabase } from "../supabase";
import { Exam, Question } from "../types";

const now = () => new Date().toISOString();

export const examService = {
  /* ================= SAVE EXAM ================= */
  async saveExam(
    exam: Partial<Exam> & { questions?: Partial<Question>[] }
  ): Promise<Exam | null> {
    try {
      // 1. Tách riêng questions ra để không gửi nhầm vào bảng 'exams'
      const { questions, ...examDataInput } = exam;

      const examPayload = {
        ...examDataInput,
        updated_at: now(),
        created_at: exam.created_at ?? now(),
        total_points: exam.total_points ?? 0,
        version: exam.version ?? 1,
      };

      // 2. Upsert Exam
      const { data: examData, error } = await supabase
        .from("exams")
        .upsert(examPayload, { onConflict: "id" })
        .select()
        .single();

      if (error || !examData) {
        console.error("Lỗi khi lưu Exam:", error);
        return null;
      }

      // 3. Save Questions (Nếu có)
      if (questions && questions.length > 0) {
        const questionsPayload = questions.map((q, index) => ({
          ...q,
          exam_id: examData.id,
          order: index,
          created_at: q.created_at ?? now(),
          updated_at: now(),
        }));

        const { error: qError } = await supabase
          .from("questions")
          .upsert(questionsPayload, { onConflict: "id" });

        if (qError) {
          console.error("Lỗi khi lưu Questions:", qError);
          return null;
        }

        // 4. Tính toán và cập nhật lại điểm tổng (total_points)
        const totalPoints = questionsPayload.reduce(
          (sum, q) => sum + (q.points ?? 0),
          0
        );

        const { data: updatedExam, error: updateError } = await supabase
          .from("exams")
          .update({ total_points: totalPoints })
          .eq("id", examData.id)
          .select()
          .single();

        if (updateError) {
          console.error("Lỗi khi cập nhật điểm tổng Exam:", updateError);
          // Vẫn trả về examData nếu chỉ lỗi update điểm
          return examData as Exam; 
        }

        return updatedExam as Exam;
      }

      return examData as Exam;
    } catch (err) {
      console.error("Lỗi không xác định tại saveExam:", err);
      return null;
    }
  },

  /* ================= GET BY ID ================= */
  async getById(
    id: string
  ): Promise<(Exam & { questions: Question[] }) | null> {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select("*, questions(*)")
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error("Lỗi khi lấy Exam theo ID:", error);
        return null;
      }

      // Xóa bỏ 'as any', ép kiểu an toàn qua unknown
      return data as unknown as (Exam & { questions: Question[] });
    } catch (err) {
      console.error("Lỗi không xác định tại getById:", err);
      return null;
    }
  },

  /* ================= GET ALL ================= */
  async getAll(): Promise<Exam[]> {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Lỗi khi lấy danh sách Exam:", error);
        return [];
      }
      return (data as Exam[]) ?? [];
    } catch (err) {
      console.error("Lỗi không xác định tại getAll:", err);
      return [];
    }
  },

  /* ================= DELETE ================= */
  async delete(id: string): Promise<boolean> {
    try {
      // Xóa questions con trước (nếu Supabase chưa cài đặt Foreign Key Cascade)
      const { error: qError } = await supabase
        .from("questions")
        .delete()
        .eq("exam_id", id);

      if (qError) {
        console.error("Lỗi khi xóa questions liên quan:", qError);
        return false;
      }

      // Xóa exam cha
      const { error } = await supabase
        .from("exams")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Lỗi khi xóa Exam:", error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Lỗi không xác định tại delete:", err);
      return false;
    }
  },
};
