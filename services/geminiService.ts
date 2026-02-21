// services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { QuestionType } from "../types"; // Import type từ file types.ts (Thầy nhớ check đường dẫn nhé)

// Tương thích an toàn cho cả môi trường Vite và Next.js/Vercel
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

// Khởi tạo model 
const genAI = new GoogleGenerativeAI(API_KEY || "dummy-key");
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", 
  generationConfig: {
    temperature: 0.2, // Giảm temperature xuống 0.2 để AI bóc tách chính xác, bớt "sáng tạo" thêm chữ
    topP: 0.8,
    topK: 40,
  }
});

// --- HELPER: Làm sạch chuỗi JSON từ AI ---
const cleanJsonString = (text: string): string => {
  let clean = text.replace(/```json/g, "").replace(/```/g, "");
  const firstOpen = clean.indexOf("[");
  const firstBrace = clean.indexOf("{");
  const start = (firstOpen !== -1 && (firstBrace === -1 || firstOpen < firstBrace)) ? firstOpen : firstBrace;
  
  const lastClose = clean.lastIndexOf("]");
  const lastBrace = clean.lastIndexOf("}");
  const end = (lastClose !== -1 && (lastBrace === -1 || lastClose > lastBrace)) ? lastClose : lastBrace;

  if (start !== -1 && end !== -1) {
    clean = clean.substring(start, end + 1);
  }
  return clean.trim();
};

export const geminiService = {
  /**
   * CỰC ĐỈNH: Phân tích văn bản thô (từ PDF/Word) thành cấu trúc JSON chuẩn xác theo types.ts
   */
  async parseExamWithAI(text: string) {
    if (!text.trim()) return null;

    const prompt = `
    Bạn là một chuyên gia AI về giáo dục, phân tích dữ liệu xuất sắc tại Việt Nam.
    Nhiệm vụ: Chuyển đổi văn bản thô (được trích xuất từ file Word/PDF) thành cấu trúc JSON chuẩn xác để import vào hệ thống NhanLMS Pro.

    Yêu cầu Output JSON phải tuân thủ nghiêm ngặt cấu trúc sau:
    {
      "title": "Tên đề thi (Trích xuất từ văn bản, hoặc tự tóm tắt. Mặc định: Đề thi mới)",
      "description": "Mô tả ngắn gọn về đề thi (nếu có)",
      "questions": [
        {
          "content": "Nội dung câu hỏi",
          "type": "multiple_choice", // Chỉ được chọn 1 trong 3: "multiple_choice", "true_false", "essay"
          "options": ["Đáp án 1", "Đáp án 2", "Đáp án 3", "Đáp án 4"], // Nếu type="essay" thì mảng này rỗng []
          "correct_answer": "Nội dung chính xác của đáp án đúng (Ví dụ: 'Đáp án 1' - lấy nguyên text đáp án. Nếu là essay thì để null)",
          "explanation": "Lời giải chi tiết hoặc giải thích (nếu có trong văn bản, nếu không để null)",
          "points": 1 // Mặc định là 1 điểm
        }
      ]
    }

    QUY TẮC NGHIÊM NGẶT CẦN TUÂN THỦ:
    1. TIỀN TỐ CÂU HỎI: Xóa bỏ các tiền tố ở đầu nội dung như "Câu 1:", "Bài 2:"... Hệ thống sẽ tự đánh số.
    2. TIỀN TỐ ĐÁP ÁN: Xóa bỏ các tiền tố ở đầu đáp án như "A.", "B.", "C.", "D."... Chỉ giữ lại nội dung thật của đáp án.
    3. CÔNG THỨC TOÁN HỌC: Giữ nguyên vẹn mọi công thức LaTeX trong cặp $...$ hoặc $$...$$. Tuyệt đối không tự ý format lại làm hỏng công thức.
    4. SỬA LỖI OCR: Nếu văn bản PDF bị lỗi font chữ tiếng Việt, hãy cố gắng sửa lỗi chính tả cho tự nhiên.
    5. KHÔNG BỊA ĐẶT: Tuyệt đối không tự tạo thêm câu hỏi. Chỉ trích xuất đúng những gì có trong văn bản.
    6. TRẢ VỀ DUY NHẤT JSON: Không kèm theo bất kỳ lời giải thích hay văn bản nào khác ngoài chuỗi JSON.

    Văn bản cần xử lý:
    """
    ${text}
    """
    `;

    try {
      const result = await model.generateContent(prompt);
      const rawText = result.response.text();
      const cleanedJson = cleanJsonString(rawText);
      return JSON.parse(cleanedJson);
    } catch (error) {
      console.error("Gemini Parse Error:", error);
      throw new Error("Không thể phân tích đề thi. Đảm bảo file Word/PDF rõ ràng và có cấu trúc hợp lý.");
    }
  },

  /**
   * Tạo đề thi mới tự động (Đã nâng cấp khớp với types.ts)
   */
  async generateExam(topic: string, grade: string, questionCount: number = 10) {
    const prompt = `
    Hãy đóng vai một giáo viên giỏi. Tạo một đề thi trắc nghiệm môn Toán lớp ${grade} về chủ đề: "${topic}".
    Số lượng: ${questionCount} câu. Độ khó tăng dần.
    
    Yêu cầu Output JSON:
    [
      {
        "content": "Nội dung câu hỏi (dùng LaTeX cho công thức trong cặp $...$)",
        "type": "multiple_choice",
        "options": ["Tùy chọn 1", "Tùy chọn 2", "Tùy chọn 3", "Tùy chọn 4"],
        "correct_answer": "Text của tùy chọn đúng",
        "explanation": "Giải thích chi tiết tại sao chọn đáp án đó",
        "points": 1
      }
    ]
    Chỉ trả về JSON, không giải thích gì thêm.
    `;

    try {
      const result = await model.generateContent(prompt);
      const cleanedJson = cleanJsonString(result.response.text());
      return JSON.parse(cleanedJson);
    } catch (error) {
      console.error("Gemini Generate Error:", error);
      throw new Error("Lỗi khi tạo đề thi mới bằng AI.");
    }
  },

  /**
   * Chấm bài tự luận (Giữ nguyên)
   */
  async gradeEssay(question: string, userAnswer: string) {
    // ... (Phần này của Thầy đã hoàn hảo, em giữ nguyên hoàn toàn)
    const prompt = `
    Câu hỏi: ${question}
    Bài làm của học sinh: ${userAnswer}
    
    Hãy chấm điểm trên thang 10 và đưa ra nhận xét chi tiết.
    Output JSON:
    {
      "score": number,
      "feedback": "Nhận xét chi tiết...",
      "suggestions": "Gợi ý cải thiện..."
    }
    `;

    try {
      const result = await model.generateContent(prompt);
      const cleanedJson = cleanJsonString(result.response.text());
      return JSON.parse(cleanedJson);
    } catch (error) {
      console.error("Gemini Grade Error:", error);
      return { score: 0, feedback: "Lỗi chấm bài AI", suggestions: "" };
    }
  },
};
