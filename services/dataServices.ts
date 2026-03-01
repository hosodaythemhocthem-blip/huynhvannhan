import { supabase } from "../supabase";
import { Exam } from "../types";

export const dataServices = {
  // ==========================================
  // 1. DÀNH CHO GIÁO VIÊN (Giữ nguyên của bạn)
  // ==========================================
  async getExamsByTeacher(teacher_id: string): Promise<Exam[]> {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("teacher_id", teacher_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Lỗi getExamsByTeacher:", error);
      return [];
    }

    return (data as Exam[]) ?? [];
  },

  // ==========================================
  // 2. DÀNH CHO HỌC SINH (CODE MỚI ĐỂ FIX LỖI)
  // ==========================================
  async getExamsForStudent(student_id: string): Promise<Exam[]> {
    try {
      // Bước 1: Tìm danh sách các lớp học sinh đang tham gia (và đã được duyệt)
      // Lưu ý: Đổi chữ "class_members" thành tên bảng chứa học sinh & lớp trong database của bạn nhé.
      const { data: enrolledClasses, error: classError } = await supabase
        .from("class_members") 
        .select("class_id")
        .eq("student_id", student_id)
        .eq("status", "approved"); // Chỉ lấy các lớp hiển thị "Đã duyệt" như trong ảnh

      if (classError) throw classError;

      // Nếu chưa vào lớp nào thì chắc chắn không có bài tập
      if (!enrolledClasses || enrolledClasses.length === 0) {
        return []; 
      }

      // Trích xuất ra mảng các ID lớp học (Ví dụ: [1, 2, 5])
      const classIds = enrolledClasses.map(c => c.class_id);

      // Bước 2: Lấy tất cả bài tập thuộc các lớp mà học sinh đang học
      const { data: exams, error: examError } = await supabase
        .from("exams")
        .select("*")
        .in("class_id", classIds) // Dùng .in() để quét qua mảng class_id siêu mượt
        // .eq("is_published", true) // Bỏ comment dòng này nếu database bạn có cột phân biệt Lưu nháp/Đã giao
        .order("created_at", { ascending: false });

      if (examError) throw examError;

      return (exams as Exam[]) ?? [];

    } catch (error) {
      console.error("Lỗi nghiêm trọng khi tải bài tập học sinh:", error);
      return [];
    }
  },
};
