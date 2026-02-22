import { GoogleGenAI } from "@google/genai";

/* =========================================================
   🔐 LẤY API KEY CHUẨN VITE 
========================================================= */
const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";

if (!API_KEY) {
  console.error("❌ Thiếu VITE_GEMINI_API_KEY trong environment variables");
}

// Chỉ khởi tạo AI nếu có API Key để tránh lỗi sập App
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

/* =========================================================
   🧠 HELPER: GỌI MODEL
========================================================= */
const generate = async (
  prompt: string,
  options?: {
    temperature?: number;
    isJson?: boolean;
  }
) => {
  if (!ai) {
    throw new Error("Chưa cấu hình API Key cho Gemini. Vui lòng kiểm tra biến môi trường VITE_GEMINI_API_KEY.");
  }

  const { temperature = 0.7, isJson = false } = options || {};

  const response = await ai.models.generateContent({
    // Đã nâng cấp model để sửa lỗi 404 Not Found
    model: "gemini-2.5-flash", 
    contents: prompt,
    config: { 
      temperature,
      ...(isJson ? { responseMimeType: "application/json" } : {}),
    },
  });

  return response.text;
};

/* =========================================================
   🧹 HELPER: DỌN DẸP JSON (Chống lỗi Crash App)
========================================================= */
const parseSafeJSON = (rawText: string | undefined) => {
  if (!rawText) return null;
  try {
    const cleaned = rawText.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("❌ Lỗi parse JSON từ AI:", rawText);
    throw new Error("AI trả về sai định dạng JSON.");
  }
};

/* =========================================================
   🚀 SERVICE CHÍNH
========================================================= */
export const geminiService = {
  /* ------------------------------------------------------
     1️⃣ Phân tích đề thi thành JSON
  ------------------------------------------------------ */
  async parseExamWithAI(text: string) {
    if (!text.trim()) return null;

    const prompt = `Bạn là chuyên gia giáo dục. Chuyển văn bản sau thành JSON chuẩn, không thêm markdown:\n\n${text}`;

    try {
      const raw = await generate(prompt, {
        temperature: 0.1,
        isJson: true,
      });

      return parseSafeJSON(raw);
    } catch (error) {
      console.error("❌ Lỗi parseExamWithAI:", error);
      throw new Error("Không thể phân tích đề thi bằng AI.");
    }
  },

  /* ------------------------------------------------------
     2️⃣ Chat AI
  ------------------------------------------------------ */
  async chatWithAI(prompt: string): Promise<string> {
    try {
      const result = await generate(prompt, { temperature: 0.7 });
      return result || "AI không phản hồi.";
    } catch (error: any) {
      console.error("❌ Lỗi chatWithAI:", error);
      return error.message.includes("API Key") 
        ? "Lỗi hệ thống: Thiếu API Key." 
        : "AI đang bận, thử lại sau nhé!";
    }
  },

  /* ------------------------------------------------------
     3️⃣ Tạo đề thi
  ------------------------------------------------------ */
  async generateExam(topic: string, grade: string, count = 10) {
    const prompt = `Tạo ${count} câu hỏi trắc nghiệm Toán lớp ${grade} về chủ đề "${topic}". Trả về duy nhất mảng JSON hợp lệ.`;

    try {
      const raw = await generate(prompt, {
        temperature: 0.8,
        isJson: true,
      });

      return parseSafeJSON(raw);
    } catch (error) {
      console.error("❌ Lỗi generateExam:", error);
      throw new Error("Không thể tạo đề thi.");
    }
  },
};
