import { User, Exam, Question, Class } from "../types";

/* ======================================================
   UTILITIES
====================================================== */

const now = () => new Date().toISOString();

const baseEntity = (id: string) => ({
  id,
  created_at: now(),
  updated_at: now(),
});

/* ======================================================
   USERS
====================================================== */

export const MOCK_USERS: User[] = [
  {
    ...baseEntity("teacher-nhan"),
    email: "huynhvannhan@gmail.com",
    full_name: "Thầy Huỳnh Văn Nhẫn",
    role: "teacher",
    status: "active", // Đã sửa từ "approved" thành "active"
    class_id: null,
  },
  {
    ...baseEntity("student-01"),
    email: "hocsinh1@gmail.com",
    full_name: "Nguyễn Văn Đạt",
    role: "student",
    status: "active", // Đã sửa từ "approved" thành "active"
    class_id: "class-12a1",
  },
  {
    ...baseEntity("student-02"),
    email: "hocsinh2@gmail.com",
    full_name: "Lê Thị Hồng",
    role: "student",
    status: "pending",
    class_id: null,
  },
];

/* ======================================================
   EXAMS
====================================================== */

export const MOCK_EXAMS: Exam[] = [
  {
    ...baseEntity("exam-01"),
    title: "Chuyên đề: Đạo hàm & Tích phân",
    teacher_id: "teacher-nhan",
    description: "Bộ đề ôn luyện tích hợp LaTeX",
    is_locked: false,
    is_archived: false,
    file_url: null,
    raw_content: null,
    total_points: 30,
    version: 1,
    duration: 45, // Thêm duration để sửa lỗi bên StudentQuiz
  },
];

/* ======================================================
   QUESTIONS
====================================================== */

export const MOCK_QUESTIONS: Question[] = [
  {
    ...baseEntity("q-1"),
    exam_id: "exam-01",
    type: "multiple_choice",
    content:
      "Tính đạo hàm của hàm số $f(x) = \\ln(x^2 + 1)$ tại $x = 1$",
    options: ["$1$", "$\\frac{1}{2}$", "$2$", "$0$"],
    correct_answer: "0",
    points: 10,
    order: 1,
    explanation: null,
    section: null,
  },
  {
    ...baseEntity("q-2"),
    exam_id: "exam-01",
    type: "essay",
    content:
      "Tìm nguyên hàm của $g(x) = e^{2x} + \\sin(x)$",
    correct_answer:
      "$\\frac{1}{2}e^{2x} - \\cos(x) + C$",
    options: null,
    points: 10,
    order: 2,
    explanation: null,
    section: null,
  },
];

/* ======================================================
   CLASSES
====================================================== */

export const MOCK_CLASSES: Class[] = [
  {
    ...baseEntity("class-12a1"),
    name: "Lớp 12A1 - Chuyên Toán",
    teacher_id: "teacher-nhan",
    description: "Lớp chuyên toán năm học 2025",
    is_active: true,
  },
];
