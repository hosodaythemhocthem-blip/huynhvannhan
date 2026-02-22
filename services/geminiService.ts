import { GoogleGenerativeAI } from "@google/generative-ai";

/* =========================================================
    🔐 CẤU HÌNH API KEY (Đã fix lỗi TypeScript Vercel)
========================================================= */
// Dùng (import.meta as any) để Vercel không báo lỗi đỏ
const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";

// Khởi tạo SDK
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/* =========================================================
    🧠 HELPER: GỌI MODEL
========================================================= */
const generate = async (prompt: string, temperature = 0.2) => {
  if (!genAI) throw new Error("Chưa cấu hình API Key cho Gemini.");

  try {
    // Dùng gemini-1.5-flash ổn định nhất, không bị lỗi 404
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });

    const result = await model.generateContent(prompt);
    return await result.response.text();
  } catch (error: any) {
    console.error("❌ Lỗi gọi API Gemini:", error);
    throw new Error(`Lỗi kết nối AI: ${error.message}`);
  }
};

/* =========================================================
    🛡️ ÁO GIÁP THÉP: PARSE JSON CHỐNG ĐỨT GÃY
========================================================= */
const parseSafeJSON = (rawText: string | undefined) => {
  if (!rawText) throw new Error("AI trả về chuỗi rỗng.");
  
  try {
    let cleaned = rawText.trim();
    
    // 1. Tự động tìm và cắt đúng phần JSON (bỏ qua rác Markdown dư thừa)
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }

    // 2. CHỐNG SẬP LATEX: Nhân đôi dấu gạch chéo
    cleaned = cleaned.replace(/\\(?!["])/g, "\\\\");
    
    // 3. Xóa các ký tự ẩn gây lỗi
    cleaned = cleaned.replace(/[\u0000-\u001F]+/g, "");

    const parsed = JSON.parse(cleaned);

    let rawArray: any[] = [];
    if (Array.isArray(parsed)) rawArray = parsed;
    else if (parsed.questions && Array.isArray(parsed.questions)) rawArray = parsed.questions;
    else rawArray = Object.values(parsed).find(v => Array.isArray(v)) || [];

    return rawArray.map((item: any) => ({
      type: item.type || "multiple_choice",
      question: item.question || "Nội dung trống",
      options: Array.isArray(item.options) ? item.options : [],
      correctAnswer: item.correctAnswer ?? 0,
      explanation: item.explanation || ""
    }));

  } catch (error: any) {
    console.error("❌ Lỗi Parse JSON:", error, "\nChuỗi gốc AI:", rawText);
    throw new Error("Dữ liệu AI trả về bị đứt đoạn. Thầy vui lòng ấn thử lại nhé.");
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
      
      QUY TẮC TOÁN HỌC (BẮT BUỘC):
      - Bọc mọi công thức Toán trong $...$.
      - MỌI dấu gạch chéo ngược (\\) của lệnh LaTeX phải viết thành hai dấu (\\\\). Ví dụ: $\\\\sqrt{x}$.
      
      CẤU TRÚC JSON (Bắt đầu bằng [ và kết thúc bằng ]):
      [ { "type": "multiple_choice", "question": "...", "options": [...], "correctAnswer": 0, "explanation": "..." } ]

      VĂN BẢN ĐỀ THI:
      ${text}
    `;

    const raw = await generate(prompt, 0.1);
    return parseSafeJSON(raw);
  },

  async generateExam(topic: string, grade: string, count = 10) {
    const prompt = `
      Tạo ${count} câu hỏi môn Toán lớp ${grade}, chủ đề "${topic}".
      Dùng LaTeX bọc trong $...$. Nhân đôi dấu (\\) thành (\\\\).
      Trả về JSON Array gồm: type, question, options, correctAnswer, explanation.
    `;

    const raw = await generate(prompt, 0.7);
    return parseSafeJSON(raw);
  },

  async chatWithAI(prompt: string): Promise<string> {
    const result = await generate(prompt, 0.7);
    return result || "AI không phản hồi.";
  }
};
