import { GoogleGenAI } from "@google/genai";

// Lấy API Key từ môi trường (Vercel/Vite)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenAI(API_KEY);

export const geminiService = {
  /**
   * TRỢ LÝ LUMINA - GIẢI ĐÁP TOÁN HỌC SIÊU CẤP
   */
  async askGemini(prompt: string, context: string = ""): Promise<string> {
    if (!API_KEY) return "⚠️ Thầy Nhẫn ơi, hệ thống chưa có API Key Gemini!";

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: `Bạn là Lumina AI, trợ lý riêng của Thầy Huỳnh Văn Nhẫn.
        Nhiệm vụ: Giải toán, lý, hóa.
        YÊU CẦU BẮT BUỘC:
        1. Sử dụng LaTeX cho MỌI công thức. Ví dụ: $x^2$ hoặc $$\\frac{a}{b}$$.
        2. Nếu có hình ảnh hoặc ngữ cảnh học liệu: ${context}, hãy bám sát.
        3. Trả lời chuyên nghiệp, rõ ràng, dễ hiểu.`
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Lỗi AI:", error);
      return "⚠️ Lumina gặp sự cố nhỏ, Thầy thử lại sau giây lát nhé!";
    }
  },

  /**
   * CÔNG CỤ BÓC TÁCH ĐỀ THI WORD/PDF (PRO VERSION)
   */
  async parseExamWithAI(rawText: string): Promise<any> {
    if (!API_KEY) throw new Error("Missing API Key");

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro", // Dùng bản Pro để bóc tách chính xác nhất
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const prompt = `
        Hãy bóc tách văn bản đề thi sau thành JSON chuẩn cho hệ thống LMS Thầy Nhẫn.
        VĂN BẢN: """ ${rawText} """

        QUY TẮC ĐỊNH DẠNG JSON:
        {
          "title": "Tên đề thi tự suy luận",
          "duration": 90,
          "questions": [
            {
              "content": "Nội dung câu hỏi (Dùng LaTeX $...$ cho công thức)",
              "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
              "correctAnswer": 0, (0=A, 1=B, 2=C, 3=D)
              "explanation": "Lời giải chi tiết bằng LaTeX (AI tự giải nếu đề không có)",
              "points": 0.25
            }
          ]
        }
        LƯU Ý: Tuyệt đối không để trống 'explanation'.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      console.error("AI Parsing Error:", error);
      throw new Error("AI không thể đọc hiểu file này, Thầy kiểm tra lại định dạng nhé.");
    }
  }
};

export const askGemini = geminiService.askGemini;
