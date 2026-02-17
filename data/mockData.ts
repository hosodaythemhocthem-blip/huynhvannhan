import {
  User,
  Exam,
  QuestionType,
  Class,
} from "../types";

/* ======================================================
   🧠 UTILITIES
====================================================== */

const now = () => new Date().toISOString();

const baseEntity = (id: string) => ({
  id,
  createdAt: now(),
  updatedAt: now(),
  isDeleted: false,
});

/* ======================================================
   👤 HỆ THỐNG NGƯỜI DÙNG
====================================================== */

export const MOCK_USERS: User[] = [
  {
    ...baseEntity("teacher-nhan"),
    email: "huynhvannhan@gmail.com",
    fullName: "Thầy Huỳnh Văn Nhẫn",
    role: "teacher",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nhan",
    status: "active",
  },
  {
    ...baseEntity("student-01"),
    email: "hocsinh1@gmail.com",
    fullName: "Nguyễn Văn Đạt",
    role: "student",
    status: "active",
    classId: "class-12a1",
  },
  {
    ...baseEntity("student-02"),
    email: "hocsinh2@gmail.com",
    fullName: "Lê Thị Hồng",
    role: "student",
    status: "pending",
    pendingClassId: "class-12a1",
  },
];

/* ======================================================
   📝 HỆ THỐNG ĐỀ THI MẪU (LATEX READY)
====================================================== */

export const MOCK_EXAMS: Exam[] = [
  {
    ...baseEntity("exam-vinh-vien-01"),

    title: "Chuyên đề: Đạo hàm & Tích phân $I = \\int_a^b f(x)dx$",
    description:
      "Bộ đề ôn luyện chuyên sâu tích hợp công thức LaTeX chuẩn quốc tế.",

    teacherId: "teacher-nhan",
    duration: 90,
    subject: "Toán học",
    grade: "12",
    isPublished: true,

    totalPoints: 10,
    questionCount: 3,

    questions: [
      {
        ...baseEntity("q-1"),
        examId: "exam-vinh-vien-01",
        type: QuestionType.MCQ,
        content:
          "Tính đạo hàm của hàm số $f(x) = \\ln(x^2 + 1)$ tại điểm $x = 1$.",
        options: ["$1$", "$\\frac{1}{2}$", "$2$", "$0$"],
        correctAnswer: 0,
        points: 3,
        order: 1,
        ai_suggested: false,
        meta: {
          source: "manual",
        },
      },
      {
        ...baseEntity("q-2"),
        examId: "exam-vinh-vien-01",
        type: QuestionType.MATH,
        content:
          "Tìm nguyên hàm của hàm số $g(x) = e^{2x} + \\sin(x)$.",
        correctAnswer:
          "$\\frac{1}{2}e^{2x} - \\cos(x) + C$",
        points: 4,
        order: 2,
        ai_suggested: false,
        meta: {
          source: "manual",
        },
      },
      {
        ...baseEntity("q-3"),
        examId: "exam-vinh-vien-01",
        type: QuestionType.MCQ,
        content:
          "Cho tích phân $J = \\int_0^1 x e^x dx$. Khẳng định nào sau đây đúng?",
        options: [
          "$J = 1$",
          "$J = e - 1$",
          "$J = e$",
          "$J = 0$",
        ],
        correctAnswer: 0,
        points: 3,
        order: 3,
        ai_suggested: false,
        meta: {
          source: "manual",
        },
      },
    ],
  },
];

/* ======================================================
   📊 DỮ LIỆU BIỂU ĐỒ
====================================================== */

export const STUDY_PROGRESS = [
  { day: "Thứ 2", activeMinutes: 45, exercises: 12 },
  { day: "Thứ 3", activeMinutes: 120, exercises: 25 },
  { day: "Thứ 4", activeMinutes: 60, exercises: 15 },
  { day: "Thứ 5", activeMinutes: 180, exercises: 40 },
  { day: "Thứ 6", activeMinutes: 90, exercises: 20 },
  { day: "Thứ 7", activeMinutes: 240, exercises: 55 },
  { day: "Chủ Nhật", activeMinutes: 30, exercises: 5 },
];

/* ======================================================
   🎓 HỆ THỐNG LỚP HỌC
====================================================== */

export const MOCK_CLASSES: Class[] = [
  {
    ...baseEntity("class-12a1"),
    name: "Lớp 12A1 - Chuyên Toán",
    teacherId: "teacher-nhan",
    inviteCode: "TOAN12A1",
    studentCount: 45,
    activeStudentIds: ["student-01"],
    pendingStudentIds: ["student-02"],
  },
];
