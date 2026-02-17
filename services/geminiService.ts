import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

if (!API_KEY) {
  console.warn("⚠️ VITE_GEMINI_API_KEY chưa được cấu hình.");
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/* =========================================================
   INTERNAL UTILITIES
========================================================= */

const safeExtractJSON = (text: string) => {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Invalid JSON format");

    return JSON.parse(text.substring(start, end + 1));
  } catch (err) {
    throw new Error("AI trả về dữ liệu không hợp lệ.");
  }
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 2): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    return withRetry(fn, retries - 1);
  }
};

/* =========================================================
   GEMINI SERVICE – LUMINA AI V8
========================================================= */

export const geminiService = {
  /* =======================================================
     🤖 AI TUTOR – GIẢI TOÁN & GIẢNG DẠY
  ======================================================== */
  async askGemini(prompt: string, context: string = ""): Promise<string> {
    if (!genAI) {
      return "⚠️ Hệ thống chưa cấu hình Gemini API Key.";
    }

    return withRetry(async () => {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: `
Bạn là Lumina AI – trợ lý cao cấp của Thầy Huỳnh Văn Nhẫn.

QUY TẮC:
1. Tất cả công thức phải dùng LaTeX: $...$ hoặc $$...$$
2. Giải thích rõ từng bước
3. Nếu có context: ${context}
4. Giọng văn chuyên nghiệp, truyền cảm hứng
        `,
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    });
  },

  /* =======================================================
     📄 PARSE WORD / PDF → JSON EXAM
  ======================================================== */
  async parseExamWithAI(rawText: string): Promise<any> {
    if (!genAI) {
      throw new Error("⚠️ Chưa cấu hình Gemini API Key.");
    }

    return withRetry(async () => {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const prompt = `
Bạn là chuyên gia số hóa đề thi.

Hãy chuyển văn bản sau thành JSON chuẩn LMS:

""" ${rawText} """

YÊU CẦU:
- title
- duration
- questions[]
- Mọi công thức phải bọc $LaTeX$
- correctAnswer từ 0-3
- explanation chi tiết
- type = "multiple-choice"

MẪU:
{
  "title": "Tên đề",
  "duration": 90,
  "questions": [
    {
      "content": "Câu hỏi có $LaTeX$",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Lời giải có $LaTeX$",
      "points": 0.25,
      "type": "multiple-choice"
    }
  ]
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return safeExtractJSON(text);
    });
  },
};
