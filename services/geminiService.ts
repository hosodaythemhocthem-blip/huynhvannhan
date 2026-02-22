// services/geminiService.ts
import { GoogleGenAI } from "@google/genai";

/* =========================================================
   🔐 LẤY API KEY CHUẨN VITE 
========================================================= */
const API_KEY = import.meta.env?.VITE_GEMINI_API_KEY || "";

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
    // 1. Gọt bỏ markdown
    const cleaned = rawText.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // 2. Chống lú cho AI: Nếu AI lỡ trả về Object chứa mảng thay vì mảng trực tiếp
    if (parsed && !Array.isArray(parsed)) {
      if (Array.isArray(parsed.questions)) return parsed.questions;
      if (Array.isArray(parsed.data)) return parsed.data;
      if (Array.isArray(parsed.exam)) return parsed.exam;
    }

    return parsed;
  } catch (error) {
    console.error("❌ Lỗi parse JSON từ AI. Dữ liệu thô AI trả về:", rawText);
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

    // 🔥 ĐÃ FIX: Chỉ thị rõ ràng cấu trúc Mảng (Array) cho AI
    const prompt = `
      Bạn là một hệ thống trích xuất dữ liệu đề thi tự động.
      Hãy đọc toàn bộ nội dung đề thi sau và chuyển nó thành MỘT MẢNG JSON (JSON Array) hợp lệ.
      
      QUY TẮC BẮT BUỘC:
      1. CHỈ trả về mảng JSON [...], tuyệt đối KHÔNG bọc trong Object.
      2. Không giải thích, không thêm bất kỳ dòng chữ nào khác.
      3. Cấu trúc mỗi câu hỏi bắt buộc phải tuân theo mẫu sau:
      [
        {
          "question": "Nội dung câu hỏi...",
          "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
          "correctAnswer": 0, 
          "explanation": "Giải thích chi tiết (nếu không có thì để rỗng)"
        }
      ]
      * Lưu ý: correctAnswer là số (0 tương ứng A, 1 là B, 2 là C, 3 là D).

      Nội dung đề thi cần xử lý:
      ${text}
    `;

    try {
      const raw = await generate(prompt, {
        temperature: 0.1, // Chỉnh nhiệt độ xuống cực thấp (0.1) để AI không sáng tạo linh tinh, chỉ tập trung trích xuất
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
    // 🔥 ĐÃ FIX: Đồng bộ cấu trúc Prompt
    const prompt = `
      Tạo ${count} câu hỏi trắc nghiệm Toán lớp ${grade} về chủ đề "${topic}". 
      Trả về MỘT MẢNG JSON hợp lệ với cấu trúc sau, không thêm markdown:
      [
        {
          "question": "...",
          "options": ["...", "...", "...", "..."],
          "correctAnswer": 0,
          "explanation": "..."
        }
      ]
    `;

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
