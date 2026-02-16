import { Course, QuestionType, Exam } from "./types";

/* ======================================================
   BIỂU ĐỒ TIẾN ĐỘ HỌC TẬP HÀNG TUẦN (SUPABASE READY)
====================================================== */
export const STUDY_DATA = Object.freeze([
  { name: "Thứ 2", hours: 1.5 },
  { name: "Thứ 3", hours: 3.8 },
  { name: "Thứ 4", hours: 2.2 },
  { name: "Thứ 5", hours: 4.5 },
  { name: "Thứ 6", hours: 3.1 },
  { name: "Thứ 7", hours: 5.4 },
  { name: "CN", hours: 2.0 },
]);

/* ======================================================
   KHÓA HỌC MẪU (LUXURY VERSION)
====================================================== */
export const MOCK_COURSES: Readonly<Course[]> = Object.freeze([
  {
    id: "c1",
    title: "Giải tích 12: Đạo hàm & Khảo sát hàm số",
    grade: "12",
    teacherId: "teacher-nhan",
    description: "Nắm vững phương pháp giải nhanh trắc nghiệm 3 phần chuẩn cấu trúc Bộ GD 2025.",
    createdAt: new Date().toISOString(),
    lessonCount: 15,
    fileCount: 8
  },
  {
    id: "c2",
    title: "Hình học Oxyz: Tọa độ trong không gian",
    grade: "12",
    teacherId: "teacher-nhan",
    description: "Trọn bộ kỹ thuật giải toán không gian bằng phương pháp tọa độ.",
    createdAt: new Date().toISOString(),
    lessonCount: 12,
    fileCount: 5
  }
]);

/* ======================================================
   DANH SÁCH ĐỀ THI MẪU (ĐÃ FIX LỖI TYPE TS2322)
====================================================== */
export const MOCK_EXAMS: Readonly<Exam[]> = Object.freeze([
  {
    id: "exam-001",
    title: "Khảo sát hàm số & Đạo hàm - Đề số 1",
    description: "Đề kiểm tra định kỳ chương 1 Giải tích 12",
    teacherId: "teacher-nhan",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    duration: 90,
    subject: "Toán học",
    grade: "12",
    isLocked: false,
    questions: [
      {
        id: "q1",
        type: QuestionType.MCQ,
        content: "Cho hàm số $y = \\frac{2x+1}{x-1}$. Đạo hàm của hàm số là:",
        options: [
          "$y' = \\frac{-3}{(x-1)^2}$",
          "$y' = \\frac{3}{(x-1)^2}$",
          "$y' = \\frac{-1}{(x-1)^2}$",
          "$y' = \\frac{1}{(x-1)^2}$"
        ],
        correctAnswer: 0,
        points: 0.25,
        explanation: "Áp dụng công thức đạo hàm hàm phân thức bậc nhất: $(ad-bc)/(cx+d)^2$"
      },
      {
        id: "q2",
        type: QuestionType.MCQ,
        content: "Giá trị cực đại của hàm số $y = x^3 - 3x + 2$ là:",
        options: ["0", "2", "4", "-1"],
        correctAnswer: 2,
        points: 0.25,
        explanation: "$y' = 3x^2 - 3 = 0 \\Leftrightarrow x = \\pm 1$. Tại $x = -1, y = 4$."
      }
    ]
  }
]);
