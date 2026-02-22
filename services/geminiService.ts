import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// 1. Lấy API Key dành riêng cho Vite
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

// 2. Hàm khởi tạo model chuẩn
const getModel = (isJson: boolean = false, temperature: number = 0.7): GenerativeModel => {
  if (!API_KEY) {
    console.error("❌ API Key bị trống! Hãy kiểm tra lại biến VITE_GEMINI_API_KEY trên Vercel.");
  }

  // SỬA LỖI 404: Dùng tên model chuẩn xác nhất cho bản ổn định
  return genAI.getGenerativeModel({
    model: "gemini-1.5-flash", 
    generationConfig: {
      temperature,
      ...(isJson ? { responseMimeType: "application/json" } : {}),
    },
  });
};

/* =========================================================
   🚀 CÁC SERVICE CHÍNH (GIỮ NGUYÊN LOGIC CỦA BẠN)
========================================================= */
export const geminiService = {
  // Parse đề thi
  async parseExamWithAI(text: string) {
    if (!text.trim()) return null;
    const model = getModel(true, 0.1);
    const prompt = `Bạn là chuyên gia giáo dục. Chuyển văn bản sau thành JSON: ${text}`;
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text().replace(/```json|```/gi, "").trim());
    } catch (error) {
      console.error("Lỗi AI:", error);
      throw error;
    }
  },

  // Chat tự do
  async chatWithAI(prompt: string): Promise<string> {
    const model = getModel(false, 0.7);
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      return "AI đang bận, bạn thử lại sau nhé!";
    }
  }
  // ... Bạn có thể copy lại các hàm generateExam, gradeEssay từ bản trước của mình vào đây
};
