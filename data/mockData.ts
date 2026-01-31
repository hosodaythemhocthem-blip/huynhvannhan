import { Course, ProgressData, QuestionType, Exam } from "../types";

/* ======================================================
   📊 DỮ LIỆU HỌC TẬP – BIỂU ĐỒ TUẦN
   (Dashboard / Analytics)
====================================================== */
export const STUDY_DATA: ProgressData[] = [
  { name: "Thứ 2", hours: 1.5 },
  { name: "Thứ 3", hours: 3.8 },
  { name: "Thứ 4", hours: 2.2 },
  { name: "Thứ 5", hours: 4.5 },
  { name: "Thứ 6", hours: 3.1 },
  { name: "Thứ 7", hours: 5.4 },
  { name: "CN", hours: 2.0 },
];

/* ======================================================
   📘 DANH SÁCH KHÓA HỌC – LUMINA LMS
====================================================== */
export const MOCK_COURSES: Course[] = [
  {
    id: "c1",
    title: "Giải tích 12: Đạo hàm & Khảo sát hàm số",
    instructor: "Thầy Huỳnh Văn Nhẫn",
    description:
      "Nắm vững phương pháp giải nhanh trắc nghiệm chuẩn cấu trúc Bộ GD.",
    thumbnail:
      "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=800",
    category: "Giải tích",
    grade: "12",
    progress: 65,

    modules: [
      {
        id: "m1",
        title: "Chương 1: Đạo hàm",
        lessons: [
          {
            id: "l1",
            title: "Tính đơn điệu của hàm số",
            duration: "15m",
            completed: true,
            type: "reading",
            content: `
### 📌 Định lý
- Nếu $f'(x) > 0$ → hàm **đồng biến**
- Nếu $f'(x) < 0$ → hàm **nghịch biến**
            `,
          },
          {
            id: "l2",
            title: "Cực trị hàm bậc ba",
            duration: "25m",
            completed: false,
            type: "reading",
            content: `
Giải phương trình đạo hàm:
$$y' = 3ax^2 + 2bx + c = 0$$
            `,
          },
        ],
      },
    ],
  },

  {
    id: "c2",
    title: "Hình học 11: Quan hệ vuông góc",
    instructor: "Lumina AI Tutor",
    description: "Trực quan hóa hình học không gian bằng AI.",
    thumbnail:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800",
    category: "Hình học",
    grade: "11",
    progress: 20,

    modules: [
      {
        id: "m2",
        title: "Quan hệ vuông góc",
        lessons: [
          {
            id: "l3",
            title: "Đường thẳng ⟂ mặt phẳng",
            duration: "20m",
            completed: false,
            type: "video",
            content:
              "Nếu đường thẳng vuông góc với hai đường cắt nhau trong mặt phẳng thì vuông góc với mặt phẳng đó.",
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
          },
        ],
      },
    ],
  },
];

/* ======================================================
   📝 ĐỀ THI MẪU – CHUẨN CẤU TRÚC THPT
====================================================== */
export const MOCK_EXAMS: Exam[] = [
  {
    id: "e1",
    title: "Ôn tập Giải tích 12 – Chương 1",
    createdAt: "25/05/2024",
    questionCount: 3,
    duration: 90, // phút
    isLocked: false,
    maxScore: 10,

    questions: [
      /* -------- PHẦN I: TRẮC NGHIỆM -------- */
      {
        id: "q1",
        type: QuestionType.MULTIPLE_CHOICE,
        section: 1,
        text: "Đạo hàm của $y = \\ln(x^2 + 1)$ là:",
        options: [
          "$\\frac{2x}{x^2+1}$",
          "$\\frac{1}{x^2+1}$",
          "$\\frac{x}{x^2+1}$",
          "$2x(x^2+1)$",
        ],
        correctAnswer: 0,
        points: 0.25,
      },

      /* -------- PHẦN II: ĐÚNG / SAI -------- */
      {
        id: "q2",
        type: QuestionType.TRUE_FALSE,
        section: 2,
        text: "Cho hàm $y = x^3 - 3x$. Khẳng định sau đúng hay sai?",
        subQuestions: [
          {
            id: "a",
            text: "Hàm số đồng biến trên $(-\\infty;-1)$",
            correctAnswer: true,
          },
          {
            id: "b",
            text: "Hàm số có cực đại tại $x = 1$",
            correctAnswer: false,
          },
        ],
        correctAnswer: null,
        points: 1,
      },

      /* -------- PHẦN III: TRẢ LỜI NGẮN -------- */
      {
        id: "q3",
        type: QuestionType.SHORT_ANSWER,
        section: 3,
        text: "GTNN của hàm số $y = x^2 - 4x + 5$ là:",
        correctAnswer: "1",
        points: 0.5,
      },
    ],
  },
];
