import { GoogleGenAI } from "@google/genai";

/* =========================================================
   🔐 LẤY API KEY CHUẨN VITE (Đã lách lỗi TypeScript Vercel)
========================================================= */
const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";

if (!API_KEY) {
  console.error("❌ Thiếu VITE_GEMINI_API_KEY trong environment variables");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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
  const { temperature = 0.7, isJson = false } = options || {};

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: prompt,
    // ⚠️ CHÚ Ý: SDK mới dùng "config", không phải "generationConfig"
    config: { 
      temperature,
      ...(isJson ? { responseMimeType: "application/json" } : {}),
    },
  });

  return response.text; // Trong SDK mới, text là property (thuộc tính), không phải hàm text()
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
    } catch (error) {
      console.error("❌ Lỗi chatWithAI:", error);
      return "AI đang bận, thử lại sau nhé!";
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
