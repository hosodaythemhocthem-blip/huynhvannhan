import { GoogleGenerativeAI } from "@google/generative-ai";

/* =========================================================
    🔐 CẤU HÌNH API KEY 
========================================================= */
const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/* =========================================================
    🧠 GỌI MODEL "GEMINI-PRO" (TƯƠNG THÍCH 100%, KHÔNG BỊ 404)
========================================================= */
const generate = async (prompt: string, temperature = 0.1) => {
  if (!genAI) throw new Error("Chưa cấu hình API Key cho Gemini.");

  try {
    // Đổi sang "gemini-pro" chuẩn để dứt điểm lỗi 404 Not Found
    const model = genAI.getGenerativeModel({
      model: "gemini-pro", 
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: temperature,
        topP: 0.8,
        topK: 10,
      }
    });
    return result.response.text();
  } catch (error: any) {
    console.error("❌ Lỗi gọi API Gemini:", error);
    throw new Error(`Lỗi kết nối AI: ${error.message}`);
  }
};

/* =========================================================
    🛡️ THUẬT TOÁN "BỌC THÉP" JSON - XỬ LÝ TRIỆT ĐỂ LATEX
========================================================= */
const parseSafeJSON = (rawText: string | undefined) => {
  if (!rawText) throw new Error("AI trả về chuỗi rỗng.");
  
  try {
    let cleaned = rawText.trim();
    
    // 1. Chỉ lấy phần trong ngoặc vuông
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }

    // 2. ÉP PHẲNG CHUỖI: Ép mọi dấu xuống dòng (\n) thành khoảng trắng
    cleaned = cleaned.replace(/[\r\n]+/g, " ");

    // 3. KHẮC PHỤC TRIỆT ĐỂ LỖI LATEX (\begin, \frac...)
    // Biến mọi dấu \ đơn lẻ thành \\ để JSON.parse không hiểu lầm
    cleaned = cleaned.replace(/\\(?![\\"])/g, "\\\\");

    // 4. Lọc ký tự rác
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
    console.error("❌ Lỗi Parse JSON:", error, "\nChuỗi AI gốc:", rawText);
    throw new Error("Dữ liệu chứa phương trình Toán học phức tạp gây nhiễu. Thầy vui lòng ấn tạo lại nhé.");
  }
};

/* =========================================================
    🚀 EXPORT SERVICE CÙNG PROMPT ÉP KHUÔN NGHIÊM NGẶT
========================================================= */
export const geminiService = {
  async parseExamWithAI(text: string) {
    if (!text.trim()) return null;

    const prompt = `
      Nhiệm vụ: Trích xuất câu hỏi từ đề thi sang JSON Array.
      
      ⚠️ LỆNH CẤM & QUY TẮC SỐNG CÒN (PHẢI TUÂN THỦ):
      1. TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON MẢNG: [ { "type": "multiple_choice", "question": "...", "options": ["A. ...", "B. ..."], "correctAnswer": 0, "explanation": "..." } ]
      2. MỌI công thức Toán phải bọc trong $...$.
      3. LATEX: TUYỆT ĐỐI nhân đôi dấu gạch chéo ngược. Ví dụ: phải viết là \\\\begin{cases}, \\\\sqrt, \\\\frac. (Nếu bạn chỉ ghi \\begin, JSON sẽ bị lỗi).
      4. KHÔNG XUỐNG DÒNG (Enter) bên trong nội dung câu hỏi hoặc đáp án. Mọi thứ ghi liền trên 1 dòng.

      VĂN BẢN ĐỀ THI:
      ${text}
    `;

    const raw = await generate(prompt, 0.1);
    return parseSafeJSON(raw);
  },

  async generateExam(topic: string, grade: string, count = 10) {
    const prompt = `
      Tạo ${count} câu hỏi Toán lớp ${grade}, chủ đề "${topic}".
      ⚠️ QUY TẮC BẮT BUỘC: 
      - Trả về JSON Array: [ { "type": "multiple_choice", "question": "...", "options": ["..."], "correctAnswer": 0, "explanation": "..." } ]
      - KHÔNG DÙNG dấu xuống dòng trong nội dung. 
      - CÁC LỆNH LATEX PHẢI ĐƯỢC NHÂN ĐÔI DẤU GẠCH CHÉO (ví dụ: \\\\sqrt, \\\\frac).
    `;

    const raw = await generate(prompt, 0.7);
    return parseSafeJSON(raw);
  },

  async chatWithAI(prompt: string): Promise<string> {
    const result = await generate(prompt, 0.7);
    return result || "AI không phản hồi.";
  }
};
