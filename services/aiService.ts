import { GoogleGenAI } from "@google/genai";

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
const ai = new GoogleGenAI({ apiKey: API_KEY || "dummy-key" });

// Lưu ý: "gemini-1.5-flash" là phiên bản ổn định nhất hiện tại
const MODEL_NAME = "gemini-1.5-flash"; 

export const aiService = {
  /* ======================================================
     PARSE ĐỀ THI SANG JSON (ĐÃ SỬA LỖI KHÔNG HIỆN ĐỀ)
  ====================================================== */
  async parseExamWithAI(text: string): Promise<string> {
    try {
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Chuyển đề thi sau thành JSON. 
        CHỈ trả về JSON thuần túy, KHÔNG bọc trong dấu ngoặc block code hay bất kỳ chữ nào khác.
        Nội dung: ${text}`,
      });
      
      let rawText = result.text || "";
      // Xử lý xóa bỏ các ký tự thừa (```json ...) nếu AI lỡ tay thêm vào
      rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      
      return rawText;
    } catch (error) {
      console.error("parseExamWithAI error:", error);
      return "[]"; 
    }
  },

  async askGemini(prompt: string): Promise<string> {
    try {
      const result = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt });
      return result.text || "AI hiện không phản hồi.";
    } catch (error) {
      console.error("askGemini error:", error);
      return "AI hiện không phản hồi.";
    }
  },

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
  }
};
