// services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
export interface ExamQuestion {
  text: string; // <-- Đã sửa thành 'text' để Vercel không báo lỗi TS2345
  type: "multiple_choice" | "true_false" | "essay";
  options: string[];
  correct_answer: string | null;
  explanation: string | null;
  points: number;
}

export interface ExamData {
  title: string;
  description: string;
  questions: ExamQuestion[];
}

export interface GradeResult {
  score: number;
  feedback: string;
  suggestions: string;
}

// --- 2. CẤU HÌNH API KEY AN TOÀN ---
const getApiKey = (): string => {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_GEMINI_API_KEY) {
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  }
  if (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_GEMINI_API_KEY) {
    return (import.meta as any).env.VITE_GEMINI_API_KEY;
  }
  return "";
};

const API_KEY = getApiKey();

// --- 3. KHỞI TẠO MODEL GEMINI ---
const genAI = new GoogleGenerativeAI(API_KEY || "dummy-key");
const model = genAI.getGenerativeModel({
  model: "gemini-pro", // <-- FIX LỖI 404: Dùng gemini-pro thay vì 1.5-flash cho tương thích thư viện cũ
  generationConfig: {
    temperature: 0.1, 
    topP: 0.8,
    topK: 40,
    // Đã xóa responseMimeType để sửa lỗi TS2353 trên Vercel
  }
});

// --- 4. HELPER: XỬ LÝ CHUỖI JSON ---
const cleanAndParseJSON = <T>(text: string): T => {
  try {
    const cleanedText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleanedText) as T;
  } catch (error) {
    console.error("Lỗi parse JSON từ chuỗi:", text);
    throw new Error("Dữ liệu AI trả về không đúng định dạng JSON. Vui lòng thử lại.");
  }
};

// --- 5. SERVICE CHÍNH ---
export const geminiService = {
  
  async parseExamWithAI(text: string): Promise<ExamData | null> {
    if (!API_KEY || API_KEY === "dummy-key") {
      throw new Error("CHƯA CẤU HÌNH API KEY! Vui lòng kiểm tra lại file .env");
    }

    if (!text.trim()) return null;

    const prompt = `Bạn là một chuyên gia AI về giáo dục tại Việt Nam.
Nhiệm vụ: Chuyển đổi văn bản thô sau thành file JSON chuẩn xác.

Yêu cầu Output JSON:
{
  "title": "Tên đề thi (Trích xuất từ văn bản, mặc định: Đề thi mới)",
  "description": "Mô tả ngắn gọn (nếu có)",
  "questions": [
    {
      "text": "Nội dung câu hỏi", 
      "type": "multiple_choice", 
      "options": ["Đáp án 1", "Đáp án 2", "Đáp án 3", "Đáp án 4"],
      "correct_answer": "Nội dung chính xác của đáp án đúng",
      "explanation": "Lời giải chi tiết (nếu có, không thì null)",
      "points": 1
    }
  ]
}

QUY TẮC:
1. Xóa các tiền tố câu hỏi (Câu 1:, Bài 2:).
2. Xóa các tiền tố đáp án (A., B., C., D.).
3. Giữ nguyên vẹn công thức LaTeX ($...$ hoặc $$...$$).
4. Sửa lỗi chính tả OCR tiếng Việt cho tự nhiên.
5. Chỉ lấy thông tin có trong văn bản, KHÔNG BỊA ĐẶT.
6. Chỉ trả về JSON thuần túy, không thêm bất kỳ chữ nào khác.

Văn bản cần xử lý:
"""
${text}
"""`;

    try {
      const result = await model.generateContent(prompt);
      return cleanAndParseJSON<ExamData>(result.response.text());
    } catch (error: any) {
      console.error("Gemini Parse Error Detail:", error);
      throw new Error(error?.message || "Lỗi đọc dữ liệu từ AI. Xem Console (F12) để biết chi tiết.");
    }
  },

  async generateExam(topic: string, grade: string, questionCount: number = 10): Promise<ExamQuestion[]> {
    if (!API_KEY || API_KEY === "dummy-key") {
      throw new Error("Chưa cấu hình API Key của Gemini.");
    }

    const prompt = `Hãy đóng vai một giáo viên giỏi. Tạo một đề thi trắc nghiệm môn Toán lớp ${grade} về chủ đề: "${topic}".
Số lượng: ${questionCount} câu. Độ khó tăng dần.

Yêu cầu Output JSON là một MẢNG các câu hỏi:
[
  {
    "text": "Nội dung câu hỏi (dùng LaTeX cho công thức trong cặp $...$)",
    "type": "multiple_choice",
    "options": ["Tùy chọn 1", "Tùy chọn 2", "Tùy chọn 3", "Tùy chọn 4"],
    "correct_answer": "Text của tùy chọn đúng",
    "explanation": "Giải thích chi tiết tại sao chọn đáp án đó",
    "points": 1
  }
]
Chỉ trả về chuỗi JSON thuần túy, không giải thích gì thêm.`;

    try {
      const result = await model.generateContent(prompt);
      return cleanAndParseJSON<ExamQuestion[]>(result.response.text());
    } catch (error: any) {
      console.error("Gemini Generate Error:", error);
      throw new Error(error?.message || "Lỗi khi tạo đề thi mới bằng AI.");
    }
  },

  async gradeEssay(question: string, userAnswer: string): Promise<GradeResult> {
    if (!API_KEY || API_KEY === "dummy-key") {
      return { score: 0, feedback: "Chưa cấu hình API Key", suggestions: "" };
    }

    const prompt = `Câu hỏi: ${question}
Bài làm của học sinh: ${userAnswer}

Hãy chấm điểm trên thang 10 và đưa ra nhận xét chi tiết.
Yêu cầu Output JSON:
{
  "score": 8.5,
  "feedback": "Nhận xét chi tiết về bài làm...",
  "suggestions": "Gợi ý cách cải thiện..."
}`;

    try {
      const result = await model.generateContent(prompt);
      return cleanAndParseJSON<GradeResult>(result.response.text());
    } catch (error: any) {
      console.error("Gemini Grade Error:", error);
      return { 
        score: 0, 
        feedback: `Lỗi chấm bài AI: ${error?.message || "Không xác định"}`, 
        suggestions: "Vui lòng thử lại sau." 
      };
    }
  },
};
