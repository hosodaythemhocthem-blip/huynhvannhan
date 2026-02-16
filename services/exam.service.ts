import { supabase } from "../supabase";
import { OnlineExam, MathQuestion } from "../examFo";

export const ExamService = {
  // Lưu hoặc cập nhật đề thi vĩnh viễn
  async saveExam(exam: OnlineExam): Promise<boolean> {
    try {
      const { error } = await (supabase.from('exams') as any).upsert(exam);
      return !error;
    } catch (err) {
      console.error("Lỗi lưu đề:", err);
      return false;
    }
  },

  // Xóa đề thi vĩnh viễn
  async deleteExam(examId: string): Promise<boolean> {
    try {
      const { error } = await (supabase.from('exams') as any).eq('id', examId).delete();
      return !error;
    } catch (err) {
      return false;
    }
  },

  // Lấy toàn bộ đề thi của Thầy
  async getAllExams(): Promise<OnlineExam[]> {
    const { data } = await (supabase.from('exams') as any).select();
    return (data as OnlineExam[]) || [];
  },

  // AI bóc tách đề từ văn bản thô
  formatQuestionsForUI(rawQs: any[]): MathQuestion[] {
    return rawQs.map(q => ({
      id: q.id || `q_${Math.random().toString(36).substr(2, 9)}`,
      type: q.type || 'MCQ',
      text: q.text || q.content || "",
      options: q.options || ["", "", "", ""],
      correctAnswer: q.correctAnswer || "A",
      points: q.points || 1
    }));
  }
};
