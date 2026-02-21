import { Exam } from "./types";

/**
 * Helper: tính tổng điểm từ danh sách câu hỏi
 */
const calculateTotalPoints = (questions: { points?: number }[]): number => {
  // Thêm type rõ ràng cho q để sửa lỗi TS7006 (implicit any)
  return questions.reduce((sum: number, q: { points?: number }) => sum + (q.points ?? 0), 0);
};

/**
 * Helper: tạo timestamp an toàn
 */
const now = new Date().toISOString();

/**
 * MOCK EXAMS - Stable & Strict Safe
 */
export const MOCK_EXAMS: Readonly<Exam[]> = Object.freeze([
  (() => {
    const questions = [
      {
        id: "q1",
        type: "multiple_choice",
        content: "Cho hàm số $y = \\frac{2x+1}{x-1}$. Đạo hàm của hàm số là:",
        options: [
          "$y' = \\frac{-3}{(x-1)^2}$",
          "$y' = \\frac{3}{(x-1)^2}$",
          "$y' = \\frac{-1}{(x-1)^2}$",
          "$y' = \\frac{1}{(x-1)^2}$",
        ],
        correct_answer: "0",
        points: 0.25,
        explanation:
          "Áp dụng công thức đạo hàm hàm phân thức bậc nhất: (ad - bc)/(cx + d)^2",
      },
      {
        id: "q2",
        type: "multiple_choice",
        content: "Giá trị cực đại của hàm số $y = x^3 - 3x + 2$ là:",
        options: ["0", "2", "4", "-1"],
        correct_answer: "2",
        points: 0.25,
        explanation:
          "y' = 3x^2 - 3 = 0 ⇔ x = ±1. Tại x = -1, y = 4.",
      },
    ];

    return {
      id: "exam-001",
      title: "Khảo sát hàm số & Đạo hàm - Đề số 1",
      description: "Đề kiểm tra định kỳ chương 1 Giải tích 12",
      teacher_id: "teacher-nhan",
      created_at: now,
      updated_at: now,
      duration: 90,
      is_locked: false,
      is_archived: false,
      total_points: calculateTotalPoints(questions),
      version: 1,
      file_url: null,
      raw_content: null,
    } as unknown as Exam;
  })(),
]);
