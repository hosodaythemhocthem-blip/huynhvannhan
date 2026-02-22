import { GoogleGenAI } from "@google/genai";

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

if (!API_KEY) {
  console.warn("⚠ Missing API KEY for Gemini");
}

// Khởi tạo SDK mới của Google
// Truyền fallback "dummy-key" để Vercel không ném lỗi crash lúc build
const ai = new GoogleGenAI({ apiKey: API_KEY || "dummy-key" });

// Sử dụng model mới nhất để tránh lỗi 404 Not Found
const MODEL_NAME = "gemini-2.5-flash"; 

export const aiService = {
  /* ======================================================
     CHAT AI
  ====================================================== */
  async askGemini(prompt: string): Promise<string> {
    try {
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });
      return result.text || "AI hiện không phản hồi.";
    } catch (error) {
      console.error("askGemini error:", error);
      return "AI hiện không phản hồi.";
    }
  },

  /* ======================================================
     PHÂN TÍCH ĐỀ THI
  ====================================================== */
  async analyzeExamText(text: string): Promise<string> {
    try {
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Phân tích nội dung đề thi sau:\n${text}`,
      });
      return result.text || "Không thể phân tích đề thi.";
    } catch (error) {
      console.error("analyzeExamText error:", error);
      return "Không thể phân tích đề thi.";
    }
  },

  /* ======================================================
     TẠO ĐỀ THI
  ====================================================== */
  async generateExam(topic: string, grade: string): Promise<string> {
    try {
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Tạo đề thi môn ${topic} cho lớp ${grade}`,
      });
      return result.text || "Không thể tạo đề thi.";
    } catch (error) {
      console.error("generateExam error:", error);
      return "Không thể tạo đề thi.";
    }
  },

  /* ======================================================
     CHẤM TỰ LUẬN
  ====================================================== */
  async gradeEssay(question: string, answer: string): Promise<string> {
    try {
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Chấm điểm bài tự luận.\nCâu hỏi: ${question}\nBài làm: ${answer}`,
      });
      return result.text || "Không thể chấm bài.";
    } catch (error) {
      console.error("gradeEssay error:", error);
      return "Không thể chấm bài.";
    }
  },

  /* ======================================================
     PARSE ĐỀ THI SANG JSON
  ====================================================== */
  async parseExamWithAI(text: string): Promise<string> {
    try {
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Chuyển đề thi sau thành JSON hợp lệ:\n${text}`,
      });
      return result.text || "Không thể chuyển đề thi.";
    } catch (error) {
      console.error("parseExamWithAI error:", error);
      return "Không thể chuyển đề thi.";
    }
  }
};
