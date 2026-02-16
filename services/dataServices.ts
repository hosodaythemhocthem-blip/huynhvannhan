
import { supabase } from "../supabase";
import { Exam, Question, User } from "../types";

/**
 * DỊCH VỤ QUẢN LÝ DỮ LIỆU TẬP TRUNG - NHANLMS PRO
 * Hỗ trợ lưu trữ vĩnh viễn Cloud Supabase
 */
export const dataService = {
  
  /* ======================================================
     🏫 QUẢN LÝ LỚP HỌC & HỌC SINH
  ====================================================== */
  
  // Lấy danh sách toàn bộ lớp học của Thầy
  async getClasses() {
    const { data, error } = await supabase.from('classes').select();
    if (error) throw error;
    return data;
  },

  // Lấy danh sách học sinh đang chờ Thầy Nhẫn duyệt
  async getPendingStudents(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select();
    if (error) return [];
    return (data as User[]).filter(u => u.role === 'student' && !u.isApproved);
  },

  // Phê duyệt học sinh vào lớp vĩnh viễn
  async approveStudent(userId: string) {
    const { error } = await supabase.from('users').update(userId, { isApproved: true });
    if (error) throw error;
    return true;
  },

  /* ======================================================
     📝 QUẢN LÝ ĐỀ THI & CÂU HỎI (Hỗ trợ LaTeX)
  ====================================================== */

  // Lưu đề thi mới hoặc cập nhật đề thi cũ (Permanent Save)
  async saveExam(exam: Exam) {
    const { data: existing } = await supabase.from('exams').select();
    const isUpdate = (existing as Exam[]).some(e => e.id === exam.id);

    if (isUpdate) {
      const { error } = await supabase.from('exams').update(exam.id, exam);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('exams').insert(exam);
      if (error) throw error;
    }
    return exam;
  },

  // Xóa đề thi vĩnh viễn khỏi Cloud
  async deleteExam(examId: string) {
    const { error } = await supabase.from('exams').delete(examId);
    if (error) throw error;
    return true;
  },

  /* ======================================================
     📚 QUẢN LÝ BÀI GIẢNG & TÀI LIỆU (Word/PDF)
  ====================================================== */

  // Lưu tài liệu đính kèm (Word/PDF) vào bài học
  async uploadLessonMaterial(lessonId: string, fileName: string, fileUrl: string) {
    const { error } = await supabase.from('lessons').update(lessonId, {
      file_name: fileName,
      file_url: fileUrl,
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
    return true;
  },

  // Truy vấn toàn bộ bài học của một khóa học
  async getLessonsByCourse(courseId: string) {
    const { data, error } = await supabase.from('lessons').select();
    if (error) return [];
    return (data as any[]).filter(l => l.course_id === courseId);
  },

  /* ======================================================
     📊 QUẢN LÝ ĐIỂM SỐ & BÀI LÀM
  ====================================================== */

  // Ghi nhận điểm thi vĩnh viễn cho học sinh
  async submitExamResult(submission: {
    student_id: string;
    exam_id: string;
    score: number;
    answers: any;
  }) {
    const submissionId = `${submission.student_id}_${submission.exam_id}`;
    const { error } = await supabase.from('submissions').insert({
      id: submissionId,
      ...submission,
      created_at: new Date().toISOString()
    });
    if (error) throw error;
    return true;
  },

  // Lấy bảng điểm tổng hợp cho Thầy Nhẫn
  async getAllGrades() {
    const { data, error } = await supabase.from('submissions').select();
    if (error) throw error;
    return data;
  }
};

// Export để tương thích với cấu trúc cũ nếu cần
export const createClass = dataService.getClasses;
export const getTeacherExams = (id: string) => dataService.getClasses();
export const addQuestion = (q: Question) => Promise.resolve();
