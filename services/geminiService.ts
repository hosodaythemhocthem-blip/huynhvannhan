import { GoogleGenerativeAI } from "@google/generative-ai";

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

// Khởi tạo model (Dùng dummy-key để bypass lúc Vercel build)
const genAI = new GoogleGenerativeAI(API_KEY || "dummy-key");
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", 
  generationConfig: {
    temperature: 0.7, 
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
   * Phân tích văn bản thô (từ PDF/Word) thành cấu trúc câu hỏi JSON
   */
  async parseExamWithAI(text: string) {
    if (!text.trim()) return null;

    const prompt = `
    Bạn là một trợ lý AI chuyên soạn đề thi trắc nghiệm Toán học và Khoa học tại Việt Nam.
    Nhiệm vụ: Phân tích văn bản thô bên dưới và trích xuất thành danh sách câu hỏi trắc nghiệm chuẩn JSON.

    Yêu cầu cấu trúc JSON trả về chính xác như sau:
    {
      "title": "Tên đề thi (nếu có, hoặc tự đặt dựa trên nội dung)",
      "questions": [
        {
          "text": "Nội dung câu hỏi (giữ nguyên các công thức LaTeX dạng $...$ hoặc $$...$$)",
          "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
          "correctAnswer": 0
        }
      ]
    }

    Lưu ý quan trọng:
    1. Giữ nguyên định dạng LaTeX.
    2. Tự động loại bỏ các từ thừa như "Câu 1:", "A.", "B." ở đầu nội dung.
    3. Nếu văn bản bị lỗi font, hãy cố gắng sửa lỗi chính tả tiếng Việt.

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
      throw new Error("Không thể phân tích đề thi. Vui lòng kiểm tra lại nội dung đầu vào.");
    }
  },

  /**
   * Tạo đề thi mới dựa trên chủ đề
   */
  async generateExam(topic: string, grade: string, questionCount: number = 10) {
    const prompt = `
    Hãy đóng vai giáo viên giỏi. Tạo một đề thi trắc nghiệm môn Toán lớp ${grade} về chủ đề: "${topic}".
    Số lượng: ${questionCount} câu.
    Độ khó: Tăng dần.
    
    Yêu cầu Output JSON:
    [
       {
        "question": "Nội dung câu hỏi (dùng LaTeX cho công thức)",
        "options": ["A", "B", "C", "D"],
        "answer": 0,
        "explanation": "Giải thích ngắn gọn tại sao chọn đáp án đó"
      }
    ]
    `;

    try {
      const result = await model.generateContent(prompt);
      const cleanedJson = cleanJsonString(result.response.text());
      return JSON.parse(cleanedJson);
    } catch (error) {
      console.error("Gemini Generate Error:", error);
      throw new Error("Lỗi khi tạo đề thi mới.");
    }
  },

  /**
   * Chấm bài tự luận
   */
  async gradeEssay(question: string, userAnswer: string) {
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
