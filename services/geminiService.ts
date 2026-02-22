import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

/* =========================================================
    🔐 LẤY API KEY (Sửa lỗi TS2339 cho Vite)
========================================================= */
// Ép kiểu (as any) để TypeScript bỏ qua lỗi 'env' không tồn tại trên import.meta
const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

const getModel = (isJson: boolean = false, temperature: number = 0.7): GenerativeModel => {
  if (!API_KEY) {
    console.error("❌ Thiếu VITE_GEMINI_API_KEY!");
  }

  return genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature,
      ...(isJson ? { responseMimeType: "application/json" } : {}),
    },
  });
};

/* =========================================================
    🚀 CÁC SERVICE CHÍNH
========================================================= */
export const geminiService = {
  // 1. Phân tích đề thi
  async parseExamWithAI(text: string) {
    if (!text.trim()) return null;
    const model = getModel(true, 0.1);
    const prompt = `Bạn là chuyên gia giáo dục. Chuyển văn bản sau thành JSON chuẩn: ${text}`;
    
    try {
      const result = await model.generateContent(prompt);
      const textResponse = result.response.text();
      const cleanedJson = textResponse.replace(/```json|```/gi, "").trim();
      return JSON.parse(cleanedJson);
    } catch (error) {
      console.error("Lỗi Gemini:", error);
      throw error;
    }
  },

  // 2. Chat với trợ lý
  async chatWithAI(prompt: string): Promise<string> {
    const model = getModel(false, 0.7);
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Lỗi Chat:", error);
      return "AI đang bận, thử lại sau nhé!";
    }
  },

  // 3. Tạo đề thi ngẫu nhiên
  async generateExam(topic: string, grade: string, count = 10) {
    const model = getModel(true, 0.8);
    const prompt = `Tạo ${count} câu hỏi trắc nghiệm Toán lớp ${grade} về ${topic} dưới dạng mảng JSON.`;
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text().replace(/```json|```/gi, "").trim());
  }
};
