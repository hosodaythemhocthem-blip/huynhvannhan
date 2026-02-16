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
    totalPoints: 0.5,
    questionCount: 2,
    version: 1,

    questions: [
      {
        id: "q1",
        type: QuestionType.MCQ,
        content: "Cho hàm số $y = \\frac{2x+1}{x-1}$. Đạo hàm của hàm số là:",
        options: [
          "$y' = \\frac{-3}{(x-1)^2}$",
          "$y' = \\frac{3}{(x-1)^2}$",
          "$y' = \\frac{-1}{(x-1)^2}$",
          "$y' = \\frac{1}{(x-1)^2}$",
        ],
        correctAnswer: 0,
        points: 0.25,
        explanation:
          "Áp dụng công thức đạo hàm hàm phân thức bậc nhất: $(ad-bc)/(cx+d)^2$",
      },
      {
        id: "q2",
        type: QuestionType.MCQ,
        content: "Giá trị cực đại của hàm số $y = x^3 - 3x + 2$ là:",
        options: ["0", "2", "4", "-1"],
        correctAnswer: 2,
        points: 0.25,
        explanation:
          "$y' = 3x^2 - 3 = 0 \\Leftrightarrow x = \\pm 1$. Tại x = -1, y = 4.",
      },
    ],
  },
])
