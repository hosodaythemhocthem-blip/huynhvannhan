import { Course, ProgressData, QuestionType, Exam } from "./types";

/* ======================================================
   BIỂU ĐỒ TIẾN ĐỘ HỌC TẬP HÀNG TUẦN
====================================================== */
export const STUDY_DATA: Readonly<ProgressData[]> = Object.freeze([
  { name: "Thứ 2", hours: 1.5 },
  { name: "Thứ 3", hours: 3.8 },
  { name: "Thứ 4", hours: 2.2 },
  { name: "Thứ 5", hours: 4.5 },
  { name: "Thứ 6", hours: 3.1 },
  { name: "Thứ 7", hours: 5.4 },
  { name: "CN", hours: 2.0 },
]);

/* ======================================================
   KHÓA HỌC MẪU (DEMO / SEED DATA)
====================================================== */
export const MOCK_COURSES: Readonly<Course[]> = Object.freeze([
  {
    id: "c1",
    title: "Giải tích 12: Đạo hàm & Khảo sát hàm số",
    instructor: "Thầy Huỳnh Văn Nhẫn",
    description:
      "Nắm vững phương pháp giải nhanh trắc nghiệm 3 phần chuẩn cấu trúc Bộ GD 2025.",
    imageUrl:
      "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=800",
    category: "Giải tích",
    progress: 65,
    lessons: [
      {
        id: "l1",
        title: "Tính đơn điệu của hàm số",
        duration: "15m",
        completed: true,
        content: `
### 1. Định lý về tính đơn điệu

Giả sử hàm số $f$ có đạo hàm trên khoảng $K$.

- Nếu $f'(x) > 0$ với mọi $x \\in K$ thì hàm số **đồng biến** trên $K$.
- Nếu $f'(x) < 0$ với mọi $x \\in K$ thì hàm số **nghịch biến** trên $K$.
        `.trim(),
      },
      {
        id: "l2",
        title: "Cực trị của hàm số bậc ba",
        duration: "25m",
        completed: false,
        content: `
Để tìm cực trị hàm bậc ba $y=ax^3+bx^2+cx+d$, ta giải:

$$y' = 3ax^2 + 2bx + c = 0$$
        `.trim(),
      },
    ],
  },
  {
    id: "c2",
    title: "Hình học 11: Quan hệ vuông góc",
    instructor: "Lumina AI Tutor",
    description:
      "Sử dụng AI để trực quan hóa các mặt phẳng vuông góc và khoảng cách trong không gian.",
    imageUrl:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800",
    category: "Hình học",
    progress: 20,
    lessons: [
      {
        id: "l3",
        title: "Đường thẳng vuông góc mặt phẳng",
        duration: "20m",
        completed: false,
        content: `
**Định lý:**  
Nếu đường thẳng $d$ vuông góc với hai đường thẳng cắt nhau nằm trong $(P)$  
thì $d \\perp (P)$.
        `.trim(),
      },
    ],
  },
]);

/* ======================================================
   ĐỀ THI MẪU – CẤU TRÚC 3 PHẦN (BỘ GD)
====================================================== */
export const MOCK_EXAMS: Readonly<Exam[]> = Object.freeze([
  {
    id: "e1",
    title: "Đề ôn tập Chương 1 - Giải tích 12",
    createdAt: new Date("2024-05-25").toISOString(),
    questionCount: 3,
    duration: 90,
    totalPoints: 1.75,
    subject: "Toán",
    grade: "12",
    difficulty: "medium",
    isLocked: false,
    questions: [
      {
        id: "q1",
        type: QuestionType.MULTIPLE_CHOICE,
        section: 1,
        text: "Tìm đạo hàm của hàm số $y = \\ln(x^2 + 1)$:",
        options: [
          "$\\frac{2x}{x^2+1}$",
          "$\\frac{1}{x^2+1}$",
          "$\\frac{x}{x^2+1}$",
          "$2x(x^2+1)$",
        ],
        correctAnswer: 0,
        points: 0.25,
      },
      {
        id: "q2",
        type: QuestionType.TRUE_FALSE,
        section: 2,
        text: "Cho hàm số $y = x^3 - 3x$. Các mệnh đề sau đúng hay sai?",
        subQuestions: [
          {
            id: "a",
            text: "Hàm số đồng biến trên $(-\\infty; -1)$",
            correctAnswer: true,
          },
          {
            id: "b",
            text: "Hàm số đạt cực đại tại $x = 1$",
            correctAnswer: false,
          },
        ],
        correctAnswer: null,
        points: 1.0,
      },
      {
        id: "q3",
        type: QuestionType.SHORT_ANSWER,
        section: 3,
        text: "Tìm giá trị cực tiểu của hàm số $y = x^2 - 4x + 5$:",
        correctAnswer: "1",
        points: 0.5,
      },
    ],
  },
]);
