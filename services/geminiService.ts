// @ts-nocheck
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GradeResult {
  score: number;
  feedback: string;
  suggestions: string;
}

// --- HELPER LẤY API KEY AN TOÀN ---
const getApiKey = (): string => {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_GEMINI_API_KEY) {
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  }
  if (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_GEMINI_API_KEY) {
    return (import.meta as any).env.VITE_GEMINI_API_KEY;
  }
  return "";
};

// --- HELPER LÀM SẠCH CHUỖI JSON ---
const cleanAndParseJSON = (text: string): any => {
  try {
    const cleanedText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Lỗi parse JSON từ chuỗi:", text);
    throw new Error("Dữ liệu AI trả về không đúng định dạng JSON.");
  }
};

export const geminiService = {
  
  // 1. Chuyển đổi đề thi thô thành JSON
  async parseExamWithAI(text: string): Promise<any> {
    const key = getApiKey();
    if (!key) throw new Error("CHƯA CẤU HÌNH API KEY! Vui lòng kiểm tra lại file .env");
    if (!text.trim()) return null;

    // Khởi tạo model bên TRONG hàm để đảm bảo nhận đúng API Key
    const genAI = new GoogleGenerativeAI(key);
    const jsonModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // Bắt buộc dùng model này để tránh 404
      generationConfig: {
        temperature: 0.1, 
        topP: 0.8,
        topK: 40,
        responseMimeType: "application/json", 
      }
    } as any); // "as any" để Vercel không báo lỗi TypeScript

    const prompt = `Bạn là chuyên gia giáo dục. Chuyển đổi văn bản thô sau thành JSON chuẩn xác.

Yêu cầu Output JSON:
{
  "title": "Tên đề thi (Trích xuất từ văn bản, mặc định: Đề thi mới)",
  "description": "Mô tả ngắn gọn (nếu có)",
  "questions": [
    {
      "text": "Nội dung câu hỏi", 
      "type": "multiple_choice", 
      "options": ["Đáp án 1", "Đáp án 2", "Đáp án 3", "Đáp án 4"],
      "correctAnswer": "Nội dung đáp án đúng",
      "explanation": "Lời giải chi tiết (nếu có, không thì null)",
      "points": 1
    }
  ]
}

QUY TẮC:
1. Xóa các tiền tố câu hỏi (Câu 1:, Bài 2:).
2. Xóa các tiền tố đáp án (A., B., C., D.).
3. Giữ nguyên vẹn công thức LaTeX ($...$ hoặc $$...$$).
4. Chỉ lấy thông tin có trong văn bản, KHÔNG BỊA ĐẶT.
5. Chỉ trả về JSON thuần túy.

Văn bản:
"""
${text}
"""`;

    try {
      const result = await jsonModel.generateContent(prompt);
      return cleanAndParseJSON(result.response.text());
    } catch (error: any) {
      console.error("Gemini Parse Error:", error);
      throw new Error(error?.message || "Lỗi đọc dữ liệu từ AI.");
    }
  },

  // 2. Tự động sinh đề thi mới (JSON)
  async generateExam(topic: string, grade: string, questionCount: number = 10): Promise<any> {
    const key = getApiKey();
    if (!key) throw new Error("Chưa cấu hình API Key của Gemini.");

    const genAI = new GoogleGenerativeAI(key);
    const jsonModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7, 
        responseMimeType: "application/json",
      }
    } as any);

    const prompt = `Tạo một đề thi trắc nghiệm môn Toán lớp ${grade} về chủ đề: "${topic}".
Số lượng: ${questionCount} câu. Độ khó tăng dần.

Yêu cầu Output JSON là một MẢNG các câu hỏi:
[
  {
    "text": "Nội dung câu hỏi (dùng LaTeX trong cặp $...$)",
    "type": "multiple_choice",
    "options": ["Tùy chọn 1", "Tùy chọn 2", "Tùy chọn 3", "Tùy chọn 4"],
    "correctAnswer": "Text của tùy chọn đúng",
    "explanation": "Giải thích chi tiết",
    "points": 1
  }
]`;

    try {
      const result = await jsonModel.generateContent(prompt);
      return cleanAndParseJSON(result.response.text());
    } catch (error: any) {
      console.error("Gemini Generate Error:", error);
      throw new Error(error?.message || "Lỗi khi tạo đề thi mới bằng AI.");
    }
  },

  // 3. Chấm điểm bài luận (JSON)
  async gradeEssay(question: string, userAnswer: string): Promise<GradeResult> {
    const key = getApiKey();
    if (!key) return { score: 0, feedback: "Chưa cấu hình API Key", suggestions: "" };

    const genAI = new GoogleGenerativeAI(key);
    const jsonModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2, 
        responseMimeType: "application/json",
      }
    } as any);

    const prompt = `Câu hỏi: ${question}
Bài làm của học sinh: ${userAnswer}

Chấm điểm trên thang 10 và đưa ra nhận xét.
Output JSON:
{
  "score": 8.5,
  "feedback": "Nhận xét...",
  "suggestions": "Gợi ý..."
}`;

    try {
      const result = await jsonModel.generateContent(prompt);
      return cleanAndParseJSON(result.response.text());
    } catch (error: any) {
      console.error("Gemini Grade Error:", error);
      return { 
        score: 0, 
        feedback: `Lỗi chấm bài AI: ${error?.message || "Không xác định"}`, 
        suggestions: "Vui lòng thử lại sau." 
      };
    }
  },

  // 4. Chat tự do với Trợ lý AI (Text thường)
  async chatWithAI(prompt: string): Promise<string> {
    const key = getApiKey();
    if (!key) return "Hệ thống chưa cấu hình API Key. Vui lòng liên hệ quản trị viên.";

    const genAI = new GoogleGenerativeAI(key);
    const chatModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7, 
      }
    } as any);

    try {
      const result = await chatModel.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      return "Xin lỗi, tôi đang gặp sự cố kết nối. Bạn vui lòng thử lại sau nhé!";
    }
  }
};
