import { GoogleGenAI, SchemaType } from "@google/genai";

// Cấu hình API Key (Thầy Nhẫn hãy cài đặt trong file .env hoặc Vercel Dashboard)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenAI(API_KEY);

export const geminiService = {
  /**
   * Hỏi đáp AI Lumina - Trợ lý của Thầy Nhẫn
   */
  async askGemini(prompt: string, context: string = ""): Promise<string> {
    if (!API_KEY) return "⚠️ Thầy Nhẫn ơi, hệ thống thiếu API Key rồi ạ!";

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: `Bạn là Lumina AI, trợ lý học tập cao cấp của Thầy Huỳnh Văn Nhẫn. 
        Nhiệm vụ: Giải đáp các thắc mắc về Toán học, Lý, Hóa một cách chuyên sâu.
        Yêu cầu:
        1. Sử dụng LaTeX cho MỌI công thức toán học. Ví dụ: $x^2 + y^2 = r^2$ hoặc $$\\int_0^\\infty f(x)dx$$.
        2. Ngôn ngữ: Tiếng Việt, lễ phép, nhiệt tình.
        3. Nếu nội dung liên quan đến file học liệu: ${context}, hãy bám sát nội dung đó.`,
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Lỗi AI Ask:", error);
      return "⚠️ Hệ thống Lumina đang bận xử lý dữ liệu Cloud. Thầy thử lại sau vài giây nhé!";
    }
  },

  /**
   * Bóc tách đề thi từ Word/PDF sang định dạng Supabase vĩnh viễn
   */
  async parseExamWithAI(rawText: string): Promise<any> {
    if (!API_KEY) throw new Error("API Key missing");

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro", // Dùng bản Pro để bóc tách chính xác tuyệt đối
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1, // Độ chính xác cao nhất
        },
      });

      const prompt = `
        Hãy đóng vai chuyên gia bóc tách dữ liệu giáo dục. 
        Chuyển văn bản thô từ file đề thi sau đây thành cấu hình JSON chuẩn.
        VĂN BẢN: """ ${rawText} """

        YÊU CẦU ĐỊNH DẠNG JSON:
        {
          "title": "Tên đề thi (tự suy luận từ nội dung)",
          "duration": 45, (tự suy luận số phút)
          "questions": [
            {
              "text": "Nội dung câu hỏi (chứa LaTeX nếu có công thức)",
              "options": ["A", "B", "C", "D"],
              "correctAnswer": 0, (vị trí index 0-3)
              "explanation": "Lời giải chi tiết bằng LaTeX"
            }
          ]
        }
        LƯU Ý: Tuyệt đối không để trống explanation, AI hãy tự giải câu đó nếu đề bài không có lời giải.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonStr = response.text();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Lỗi AI Parsing:", error);
      throw new Error("AI không thể đọc hiểu cấu trúc file này. Thầy hãy kiểm tra lại file Word/PDF nhé!");
    }
  }
};

export const askGemini = geminiService.askGemini;
