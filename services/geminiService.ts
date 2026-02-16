
import { GoogleGenAI, Type } from "@google/genai";

export const geminiService = {
  async askGemini(prompt: string, systemInstruction?: string): Promise<string> {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "⚠️ Thiếu API Key trong hệ thống.";

    try {
      // Khởi tạo SDK theo chuẩn mới: dùng named parameter { apiKey }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || 
            "Bạn là Lumina AI, trợ lý học tập của Thầy Huỳnh Văn Nhẫn. Hãy giải đáp toán học một cách chuyên sâu, sử dụng LaTeX $...$ cho mọi công thức.",
          temperature: 0.7,
        },
      });
      // Lấy text trực tiếp từ thuộc tính .text (KHÔNG dùng .text())
      return response.text || "Lumina đang suy nghĩ...";
    } catch (error) {
      console.error("Lỗi AI:", error);
      return "⚠️ Hệ thống AI Lumina đang bảo trì hoặc API Key hết hạn. Thầy hãy kiểm tra lại nhé.";
    }
  },

  async parseExamWithAI(rawText: string): Promise<any> {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key missing");

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Chuyển văn bản sau thành cấu hình JSON đề thi chuẩn: ${rawText}`,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "Bạn là chuyên gia bóc tách đề thi Toán học. Trích xuất tiêu đề và danh sách câu hỏi. Mọi công thức Toán phải dùng LaTeX $...$. Đảm bảo đúng định dạng JSON yêu cầu.",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    type: { type: Type.STRING }
                  },
                  required: ["text", "options", "correctAnswer"]
                }
              }
            },
            required: ["title", "questions"]
          }
        },
      });
      // Lấy text trực tiếp từ thuộc tính .text
      const jsonStr = response.text || '{}';
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("AI Parsing Error:", error);
      throw new Error("AI không thể bóc tách nội dung này.");
    }
  }
};

export const askGemini = geminiService.askGemini;
