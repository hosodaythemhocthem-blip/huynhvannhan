import { GoogleGenerativeAI } from "@google/generative-ai";

/* =========================================================
    🔐 CẤU HÌNH API KEY
========================================================= */
const API_KEY = import.meta.env?.VITE_GEMINI_API_KEY || "";

// Khởi tạo SDK chính thức từ Google
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/* =========================================================
    🧠 HELPER: GỌI MODEL (FIXED MODEL ID & CONFIG)
========================================================= */
const generate = async (
  prompt: string,
  options?: {
    temperature?: number;
    isJson?: boolean;
  }
) => {
  if (!genAI) {
    throw new Error("Chưa cấu hình API Key cho Gemini.");
  }

  const { temperature = 0.1, isJson = false } = options || {};

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: isJson ? "application/json" : "text/plain",
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("❌ Lỗi gọi API Gemini:", error);
    throw new Error(`Lỗi kết nối AI: ${error.message || "Không xác định"}`);
  }
};

/* =========================================================
    🧹 HELPER: PARSE JSON CHUẨN (ĐÃ FIX LỖI SYNTAX)
========================================================= */
const parseSafeJSON = (rawText: string | undefined) => {
  if (!rawText) throw new Error("AI trả về chuỗi rỗng.");
  
  try {
    let cleaned = rawText.trim();
    
    // 1. Dọn dẹp Markdown rác nếu AI lỡ tay bọc thêm vào
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

    // 2. Phân tích thẳng JSON (vì Gemini application/json đã xuất định dạng chuẩn 100%)
    const parsed = JSON.parse(cleaned);

    // 3. Chuẩn hóa về mảng câu hỏi
    let rawArray: any[] = [];
    if (Array.isArray(parsed)) rawArray = parsed;
    else if (parsed.questions && Array.isArray(parsed.questions)) rawArray = parsed.questions;
    else rawArray = Object.values(parsed).find(v => Array.isArray(v)) || [];

    // 4. Map dữ liệu về Schema chuẩn của App
    return rawArray.map((item: any) => ({
      type: item.type || "multiple_choice",
      question: item.question || "Nội dung trống",
      options: Array.isArray(item.options) ? item.options : [],
      correctAnswer: item.correctAnswer,
      explanation: item.explanation || ""
    }));

  } catch (error: any) {
    console.error("❌ Lỗi Parse JSON:", error, "\nRaw:", rawText);
    throw new Error("Dữ liệu AI không đúng định dạng. Vui lòng thử lại.");
  }
};

/* =========================================================
    🚀 EXPORT SERVICE
========================================================= */
export const geminiService = {
  async parseExamWithAI(text: string) {
    if (!text.trim()) return null;

    const prompt = `
      Nhiệm vụ: Trích xuất câu hỏi từ đề thi sang JSON Array.
      
      QUY TẮC CÔNG THỨC TOÁN (BẮT BUỘC):
      - Sử dụng chuẩn LaTeX cho mọi ký hiệu toán học.
      - Bọc LaTeX trong cặp dấu $...$. Ví dụ: $x^2 + \\sqrt{y} = 0$.
      - Không cần giải thích thêm, chỉ xuất data.

      CẤU TRÚC JSON:
      Trả về một mảng [ { "type": "...", "question": "...", "options": [...], "correctAnswer": ..., "explanation": "..." } ]
      - type: "multiple_choice" | "true_false" | "short_answer"
      - correctAnswer: Index (0-3) cho trắc nghiệm, hoặc chuỗi đáp án cho câu hỏi ngắn.

      VĂN BẢN ĐỀ THI:
      ${text}
    `;

    const raw = await generate(prompt, { isJson: true, temperature: 0.1 });
    return parseSafeJSON(raw);
  },

  async generateExam(topic: string, grade: string, count = 10) {
    const prompt = `
      Hãy tạo ${count} câu hỏi môn Toán lớp ${grade}, chủ đề "${topic}".
      Sử dụng LaTeX chuẩn nằm trong dấu $...$ cho công thức.
      Trả về JSON Array câu hỏi gồm: type, question, options, correctAnswer (index hoặc string), explanation.
    `;

    const raw = await generate(prompt, { isJson: true, temperature: 0.7 });
    return parseSafeJSON(raw);
  },

  async chatWithAI(prompt: string): Promise<string> {
    const result = await generate(prompt, { temperature: 0.7 });
    return result || "AI không phản hồi.";
  }
};
