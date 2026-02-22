import { GoogleGenerativeAI } from "@google/generative-ai";

/* =========================================================
    🔐 CẤU HÌNH API KEY
========================================================= */
const API_KEY = import.meta.env?.VITE_GEMINI_API_KEY || "";

// Khởi tạo SDK chính thức từ Google
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

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
    🛡️ ÁO GIÁP THÉP: PARSE JSON CHỐNG SẬP (ANTI-CRASH)
========================================================= */
const parseSafeJSON = (rawText: string | undefined) => {
  if (!rawText) throw new Error("AI trả về chuỗi rỗng.");
  
  try {
    let cleaned = rawText.trim();
    
    // 1. Dọn dẹp Markdown rác
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

    // 2. CHỐNG SẬP LATEX: Đảm bảo mọi dấu gạch chéo đơn (\) đều trở thành gạch chéo kép (\\)
    // Ngoại trừ trường hợp nó đang dùng để escape dấu nháy kép (\")
    cleaned = cleaned.replace(/\\(?!["])/g, "\\\\");
    
    // 3. Xóa các ký tự ẩn (control characters) gây rách file JSON
    cleaned = cleaned.replace(/[\u0000-\u001F]+/g, "");

    const parsed = JSON.parse(cleaned);

    // 4. Chuẩn hóa về mảng câu hỏi
    let rawArray: any[] = [];
    if (Array.isArray(parsed)) rawArray = parsed;
    else if (parsed.questions && Array.isArray(parsed.questions)) rawArray = parsed.questions;
    else rawArray = Object.values(parsed).find(v => Array.isArray(v)) || [];

    // 5. Map dữ liệu
    return rawArray.map((item: any) => ({
      type: item.type || "multiple_choice",
      question: item.question || "Nội dung trống",
      options: Array.isArray(item.options) ? item.options : [],
      correctAnswer: item.correctAnswer,
      explanation: item.explanation || ""
    }));

  } catch (error: any) {
    console.error("❌ Lỗi Parse JSON:", error, "\nChuỗi gốc AI trả về:", rawText);
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
      
      QUY TẮC TOÁN HỌC & JSON (BẮT BUỘC BẢO VỆ MẠNG SỐNG):
      - Mọi công thức Toán phải bọc trong $...$.
      - Vì output là JSON, MỌI dấu gạch chéo ngược (\\) của lệnh LaTeX BẮT BUỘC phải viết thành hai dấu (\\\\).
      - Ví dụ SAI (sẽ làm sập hệ thống): $\\sqrt{x}$, $\\begin{cases}$
      - Ví dụ ĐÚNG (phải làm theo): $\\\\sqrt{x}$, $\\\\begin{cases}$
      - Không cần giải thích thêm, chỉ xuất Data JSON.

      CẤU TRÚC JSON:
      [ { "type": "multiple_choice", "question": "...", "options": [...], "correctAnswer": 0, "explanation": "..." } ]

      VĂN BẢN ĐỀ THI:
      ${text}
    `;

    const raw = await generate(prompt, { isJson: true, temperature: 0.1 });
    return parseSafeJSON(raw);
  },

  async generateExam(topic: string, grade: string, count = 10) {
    const prompt = `
      Hãy tạo ${count} câu hỏi môn Toán lớp ${grade}, chủ đề "${topic}".
      TUYỆT ĐỐI tuân thủ: Dùng LaTeX trong $...$, và MỌI dấu (\\) phải viết thành (\\\\) (ví dụ: $\\\\frac{1}{2}$).
      Trả về JSON Array câu hỏi gồm: type, question, options, correctAnswer (index), explanation.
    `;

    const raw = await generate(prompt, { isJson: true, temperature: 0.7 });
    return parseSafeJSON(raw);
  },

  async chatWithAI(prompt: string): Promise<string> {
    const result = await generate(prompt, { temperature: 0.7 });
    return result || "AI không phản hồi.";
  }
};
