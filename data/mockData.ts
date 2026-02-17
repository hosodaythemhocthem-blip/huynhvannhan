import { User, Exam, Question, Class } from "../types"

/* ======================================================
   🧠 UTILITIES
====================================================== */

const now = () => new Date().toISOString()

const baseEntity = (id: string) => ({
  id,
  created_at: now(),
  updated_at: now(),
})

/* ======================================================
   👤 MOCK USERS
====================================================== */

export const MOCK_USERS: User[] = [
  {
    ...baseEntity("teacher-nhan"),
    email: "huynhvannhan@gmail.com",
    full_name: "Thầy Huỳnh Văn Nhẫn",
    role: "teacher",
    status: "approved", // ✅ FIX
    class_id: null,
  },
  {
    ...baseEntity("student-01"),
    email: "hocsinh1@gmail.com",
    full_name: "Nguyễn Văn Đạt",
    role: "student",
    status: "approved", // ✅ FIX
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
]

/* ======================================================
   📝 MOCK EXAMS
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
    total_points: 30, // ✅ FIX
    version: 1,       // ✅ FIX
  },
]

/* ======================================================
   ❓ MOCK QUESTIONS
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
    points: 10,  // ✅ FIX
    order: 1,    // ✅ FIX
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
    points: 10,  // ✅ FIX
    order: 2,    // ✅ FIX
    explanation: null,
    section: null,
  },
  {
    ...baseEntity("q-3"),
    exam_id: "exam-01",
    type: "multiple_choice",
    content:
      "Cho $J = \\int_0^1 x e^x dx$. Khẳng định nào đúng?",
    options: [
      "$J = 1$",
      "$J = e - 1$",
      "$J = e$",
      "$J = 0$",
    ],
    correct_answer: "0",
    points: 10,  // ✅ FIX
    order: 3,    // ✅ FIX
    explanation: null,
    section: null,
  },
]

/* ======================================================
   🎓 MOCK CLASSES
====================================================== */

export const MOCK_CLASSES: Class[] = [
  {
    ...baseEntity("class-12a1"),
    name: "Lớp 12A1 - Chuyên Toán",
    teacher_id: "teacher-nhan",
    description: "Lớp chuyên toán năm học 2025",
    is_active: true, // ✅ FIX
  },
]

/* ======================================================
   📊 BIỂU ĐỒ
====================================================== */

export const STUDY_PROGRESS = [
  { day: "Thứ 2", activeMinutes: 45, exercises: 12 },
  { day: "Thứ 3", activeMinutes: 120, exercises: 25 },
  { day: "Thứ 4", activeMinutes: 60, exercises: 15 },
  { day: "Thứ 5", activeMinutes: 180, exercises: 40 },
  { day: "Thứ 6", activeMinutes: 90, exercises: 20 },
  { day: "Thứ 7", activeMinutes: 240, exercises: 55 },
  { day: "Chủ Nhật", activeMinutes: 30, exercises: 5 },
]
