
import { User, Exam, Question, Role, QuestionType } from "../types";

/* ======================================================
   👤 DANH SÁCH NGƯỜI DÙNG HỆ THỐNG
   (Bao gồm Thầy Nhẫn và các trạng thái Học sinh)
====================================================== */
export const MOCK_USERS: User[] = [
  {
    id: "teacher-nhan",
    email: "huynhvannhan@gmail.com",
    fullName: "Thầy Huỳnh Văn Nhẫn",
    role: "teacher" as Role,
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nhẫn",
    isApproved: true
  },
  {
    id: "student-01",
    email: "hocsinh1@gmail.com",
    fullName: "Nguyễn Văn Đạt",
    role: "student" as Role,
    isApproved: true
  },
  {
    id: "student-02",
    email: "hocsinh2@gmail.com",
    fullName: "Lê Thị Hồng",
    role: "student" as Role,
    isApproved: false // Trạng thái chờ Thầy Nhẫn duyệt
  }
];

/* ======================================================
   📝 THƯ VIỆN ĐỀ THI TOÁN HỌC (SIÊU CÔNG THỨC)
   (Dữ liệu mẫu cho tính năng soạn thảo và AI)
====================================================== */
export const MOCK_EXAMS: Exam[] = [
  {
    id: "exam-vinh-vien-01",
    title: "Chuyên đề: Đạo hàm và Ứng dụng tích phân $\\int_a^b f(x)dx$",
    description: "Bộ đề ôn luyện chuyên sâu tích hợp công thức LaTeX siêu đẹp. Hỗ trợ giải chi tiết bởi Lumina AI.",
    teacherId: "teacher-nhan",
    duration: 90,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subject: "Toán",
    grade: "12",
    isLocked: false,
    questions: [
      {
        id: "q-math-1",
        // Fix: Add missing type property required by Question interface
        type: QuestionType.MCQ,
        text: "Tính đạo hàm của hàm số $f(x) = \\sqrt{x^2 + 2x + 5}$ tại điểm $x = 1$?",
        options: [
          "$f'(1) = \\frac{1}{2\\sqrt{8}}$",
          "$f'(1) = \\frac{1}{2}$",
          "$f'(1) = \\frac{3}{2\\sqrt{8}}$",
          "$f'(1) = 2\\sqrt{8}$"
        ],
        correctAnswer: "C",
        points: 1
      },
      {
        id: "q-math-2",
        // Fix: Add missing type property required by Question interface
        type: QuestionType.MCQ,
        text: "Cho tích phân $I = \\int_0^{\\pi} \\sin^2(x) dx$. Giá trị của $I$ là:",
        options: [
          "$\\frac{\\pi}{2}$",
          "$\\pi$",
          "$\\frac{\\pi}{4}$",
          "$2\\pi$"
        ],
        correctAnswer: "A",
        points: 1
      },
      {
        id: "q-math-3",
        // Fix: Add missing type property required by Question interface
        type: QuestionType.MCQ,
        text: "Giải phương trình lượng giác sau trên tập số thực $\\mathbb{R}$: \n$$2\\cos^2(x) + 3\\sin(x) - 3 = 0$$",
        options: [
          "$x = \\frac{\\pi}{2} + k2\\pi$",
          "$x = \\frac{\\pi}{6} + k2\\pi$",
          "$x = \\frac{5\\pi}{6} + k2\\pi$",
          "Cả A, B, C đều đúng"
        ],
        correctAnswer: "D",
        points: 1
      }
    ]
  }
];

/* ======================================================
   📘 DANH SÁCH KHÓA HỌC & TÀI LIỆU
====================================================== */
export const MOCK_COURSES = [
  {
    id: "course-12-pro",
    title: "Luyện thi THPT Quốc Gia: Toán 12 Pro",
    grade: "12",
    teacherName: "Thầy Huỳnh Văn Nhẫn",
    description: "Lộ trình học tập cá nhân hóa với trợ lý AI. Học về $f(x)$, $\\log_a x$, và $\\vec{u} \\cdot \\vec{v}$.",
    lessonCount: 45,
    fileCount: 12,
    createdAt: new Date().toISOString()
  },
  {
    id: "course-11-core",
    title: "Toán học 11: Hình học không gian trực quan",
    grade: "11",
    teacherName: "Thầy Huỳnh Văn Nhẫn",
    description: "Khám phá thế giới 3D qua các công thức quan hệ vuông góc $\\perp$ và song song $\\parallel$.",
    lessonCount: 30,
    fileCount: 8,
    createdAt: new Date().toISOString()
  }
];

/* ======================================================
   📊 DỮ LIỆU TIẾN ĐỘ (Dashboard Chart)
====================================================== */
export const STUDY_PROGRESS = [
  { day: "Thứ 2", activeMinutes: 45, exercises: 12 },
  { day: "Thứ 3", activeMinutes: 120, exercises: 25 },
  { day: "Thứ 4", activeMinutes: 60, exercises: 15 },
  { day: "Thứ 5", activeMinutes: 180, exercises: 40 },
  { day: "Thứ 6", activeMinutes: 90, exercises: 20 },
  { day: "Thứ 7", activeMinutes: 240, exercises: 55 },
  { day: "Chủ Nhật", activeMinutes: 30, exercises: 5 }
];

/* ======================================================
   🎲 DỮ LIỆU ĐẤU TRƯỜNG (Game Management)
====================================================== */
export const MOCK_CLASSES = [
  { id: "class-12a1", name: "Lớp 12A1 - Chuyên Toán", studentCount: 45 },
  { id: "class-11b2", name: "Lớp 11B2 - Nâng cao", studentCount: 38 }
];

export const MOCK_GAME_HISTORY = [
  { id: "h1", game_name: "Đua Vịt", winner: "Nguyễn Văn Đạt", class_name: "12A1", created_at: new Date().toISOString() },
  { id: "h2", game_name: "Vòng Quay", winner: "Lê Thị Hồng", class_name: "11B2", created_at: new Date().toISOString() }
];
