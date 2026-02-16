import { supabase } from "../supabase";
import { Exam, Question, User } from "../types";

/**
 * HỆ THỐNG QUẢN LÝ DỮ LIỆU TẬP TRUNG - PHIÊN BẢN THẦY HUỲNH VĂN NHẪN
 * Đã cấu hình lưu trữ vĩnh viễn trên Supabase Cloud
 */
export const dataService = {
  
  /* ======================================================
     🏫 QUẢN LÝ LỚP HỌC & PHÊ DUYỆT HỌC SINH
  ====================================================== */
  
  // Lấy danh sách học sinh đang chờ Thầy duyệt vào lớp
  async getPendingStudents(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student')
      .eq('is_approved', false);
    
    if (error) {
      console.error("Lỗi lấy DS chờ duyệt:", error);
      return [];
    }
    return data as User[];
  },

  // Phê duyệt học sinh vào hệ thống vĩnh viễn
  async approveStudent(userId: string) {
    const { error } = await supabase
      .from('users')
      .update({ is_approved: true })
      .eq('id', userId);
    
    if (error) throw error;
    return true;
  },

  // Lấy danh sách lớp học của Thầy
  async getClasses() {
    const { data, error } = await supabase.from('classes').select('*');
    if (error) throw error;
    return data;
  },

  /* ======================================================
     📝 QUẢN LÝ ĐỀ THI (Word/PDF/AI) - Hỗ trợ LaTeX
  ====================================================== */

  // Lưu đề thi mới hoặc cập nhật đề cũ lên Cloud
  async saveExam(exam: Exam) {
    // Chuẩn hóa dữ liệu trước khi lưu vĩnh viễn
    const examData = {
      ...exam,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('exams')
      .upsert(examData)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Xóa đề thi vĩnh viễn
  async deleteExam(examId: string) {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', examId);
    
    if (error) throw error;
    return true;
  },

  // Lấy toàn bộ đề thi hiện có cho giáo viên
  async getAllExams(teacherId: string): Promise<Exam[]> {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data as Exam[];
  },

  /* ======================================================
     📊 QUẢN LÝ ĐIỂM SỐ & KẾT QUẢ BÀI LÀM
  ====================================================== */

  // Ghi nhận điểm thi vĩnh viễn khi học sinh nộp bài
  async submitGrade(payload: {
    student_id: string,
    student_name: string,
    exam_id: string,
    exam_title: string,
    score: number,
    answers: any
  }) {
    const { error } = await supabase
      .from('grades')
      .insert([{
        ...payload,
        completed_at: new Date().toISOString()
      }]);

    if (error) throw error;
    return true;
  },

  // Lấy bảng điểm tổng hợp cho Thầy Nhẫn quản lý
  async getGradesReport() {
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .order('completed_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// Export đồng bộ với cấu trúc cũ để không gãy hệ thống
export default dataService;
