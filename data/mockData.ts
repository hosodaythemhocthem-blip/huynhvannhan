import {
  User,
  Exam,
  QuestionType,
  Course,
  Class
} from "../types";

/* ======================================================
   👤 USERS
====================================================== */

export const MOCK_USERS: User[] = [
  {
    id: "teacher-nhan",
    email: "huynhvannhan@gmail.com",
    fullName: "Thầy Huỳnh Văn Nhẫn",
    role: "teacher",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nhan",
    isApproved: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "student-01",
    email: "hocsinh1@gmail.com",
    fullName: "Nguyễn Văn Đạt",
    role: "student",
    isApproved: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "student-02",
    email: "hocsinh2@gmail.com",
    fullName: "Lê Thị Hồng",
    role: "student",
    isApproved: false,
    createdAt: new Date().toISOString(),
  },
];

/* ======================================================
   📝 EXAMS
====================================================== */

export const MOCK_EXAMS: Exam[] = [
  {
    id: "exam-vinh-vien-01",
    title:
      "Chuyên đề: Đạo hàm và Ứng dụng tích phân $\\int_a^b f(x)dx$",
    description:
      "Bộ đề ôn luyện chuyên sâu tích hợp công thức LaTeX siêu đẹp.",
    teacherId: "teacher-nhan",
    teacherName: "Thầy Huỳnh Văn Nhẫn",

    duration: 90,
    subject: "Toán",
    grade: "12",

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    isLocked: false,
    isPublished: true,
    shuffleQuestions: false,
    shuffleOptions: false,

    totalPoints: 3,
    questionCount: 3,

    questions: [
      {
        id: "q-math-1",
        type: QuestionType.MCQ,
        content:
          "Tính đạo hàm của $f(x)=\\sqrt{x^2+2x+5}$ tại $x=1$?",
        options: [
          "$\\frac{1}{2\\sqrt{8}}$",
          "$\\frac{1}{2}$",
          "$\\frac{3}{2\\sqrt{8}}$",
          "$2\\sqrt{8}$",
        ],
        correctAnswer: 2,
        points: 1,
      },
      {
        id: "q-math-2",
        type: QuestionType.MCQ,
        content:
          "Cho $I = \\int_0^{\\pi} \\sin^2(x)dx$. Giá trị của $I$ là?",
        options: [
          "$\\frac{\\pi}{2}$",
          "$\\pi$",
          "$\\frac{\\pi}{4}$",
          "$2\\pi$",
        ],
        correctAnswer: 0,
        points: 1,
      },
      {
        id: "q-math-3",
        type: QuestionType.MCQ,
        content:
          "Giải phương trình:\n$$2\\cos^2(x)+3\\sin(x)-3=0$$",
        options: [
          "$x=\\frac{\\pi}{2}+k2\\pi$",
          "$x=\\frac{\\pi}{6}+k2\\pi$",
          "$x=\\frac{5\\pi}{6}+k2\\pi$",
          "Cả A,B,C",
        ],
        correctAnswer: 3,
        points: 1,
      },
    ],
  },
];

/* ======================================================
   📘 COURSES
====================================================== */

export const MOCK_COURSES: Course[] = [
  {
    id: "course-12-pro",
    title: "Luyện thi THPT Quốc Gia: Toán 12 Pro",
    description:
      "Học chuyên sâu $f(x)$, $\\log_a x$, $\\vec{u}\\cdot\\vec{v}$",
    teacherId: "teacher-nhan",
    grade: "12",
    lessonCount: 45,
    fileCount: 12,
    createdAt: new Date().toISOString(),
  },
  {
    id: "course-11-core",
    title: "Toán 11: Hình học không gian",
    description:
      "Quan hệ vuông góc $\\perp$ và song song $\\parallel$",
    teacherId: "teacher-nhan",
    grade: "11",
    lessonCount: 30,
    fileCount: 8,
    createdAt: new Date().toISOString(),
  },
];

/* ======================================================
   📊 STUDY PROGRESS
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
   🎲 CLASSES
====================================================== */

export const MOCK_CLASSES: Class[] = [
  {
    id: "class-12a1",
    name: "Lớp 12A1 - Chuyên Toán",
    teacherId: "teacher-nhan",
    studentCount: 45,
    createdAt: new Date().toISOString(),
  },
  {
    id: "class-11b2",
    name: "Lớp 11B2 - Nâng cao",
    teacherId: "teacher-nhan",
    studentCount: 38,
    createdAt: new Date().toISOString(),
  },
];
