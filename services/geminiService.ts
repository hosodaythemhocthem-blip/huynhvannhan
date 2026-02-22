import { GoogleGenerativeAI } from "@google/generative-ai";

/* =========================================================
    🔐 CẤU HÌNH API KEY 
========================================================= */
const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/* =========================================================
    🧠 GỌI MODEL MỚI NHẤT (FIX LỖI 404)
========================================================= */
const generate = async (prompt: string, temperature = 0.2) => {
  if (!genAI) throw new Error("Chưa cấu hình API Key cho Gemini.");

  try {
    // 🟢 Sửa thành flash-latest để Google không báo lỗi 404 Not Found
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest", 
      generationConfig: {
        temperature,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    console.error("❌ Lỗi gọi API:", error);
    throw new Error(`Lỗi kết nối AI: ${error.message}`);
  }
};

/* =========================================================
    🛡️ THUẬT TOÁN "BỌC THÉP" CHỐNG SẬP JSON LATEX
========================================================= */
const parseSafeJSON = (rawText: string | undefined) => {
  if (!rawText) throw new Error("AI trả về chuỗi rỗng.");
  
  try {
    let cleaned = rawText.trim();
    
    // 1. Chỉ lấy phần nằm trong ngoặc vuông (loại bỏ rác AI nói chuyện)
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }

    // 2. ÉP PHẲNG CHUỖI: Thay thế toàn bộ dấu xuống dòng bằng dấu cách
    // Đây là nguyên nhân chính gây lỗi "Unterminated string in JSON"
    cleaned = cleaned.replace(/\n/g, " ").replace(/\r/g, "");

    // 3. NHÂN ĐÔI GẠCH CHÉO LATEX: \sqrt biến thành \\sqrt để JSON hiểu được
    cleaned = cleaned.replace(/\\(?![\\"])/g, "\\\\");
    
    // 4. Lọc ký tự ẩn
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
    throw new Error("Dữ liệu AI toán học quá phức tạp gây gãy chuỗi. Thầy vui lòng bấm tạo lại lần nữa.");
  }
};

/* =========================================================
    🚀 EXPORT SERVICE CÙNG PROMPT ÉP KHUÔN
========================================================= */
export const geminiService = {
  async parseExamWithAI(text: string) {
    if (!text.trim()) return null;

    const prompt = `
      Nhiệm vụ: Trích xuất câu hỏi từ đề thi sang JSON Array.
      
      ⚠️ LỆNH CẤM (RẤT QUAN TRỌNG):
      1. KHÔNG DÙNG dấu xuống dòng (Enter/Newline) bên trong nội dung câu hỏi hoặc đáp án. Mọi thứ phải viết liền trên 1 dòng.
      2. MỌI công thức Toán phải bọc trong $...$.
      3. MỌI dấu gạch chéo ngược (\\) của LaTeX phải viết thành hai dấu (\\\\). Vd: $\\\\sqrt{x}$.
      
      CẤU TRÚC JSON:
      [ { "type": "multiple_choice", "question": "...", "options": [...], "correctAnswer": 0, "explanation": "..." } ]

      VĂN BẢN ĐỀ THI:
      ${text}
    `;

    const raw = await generate(prompt, 0.1);
    return parseSafeJSON(raw);
  },

  async generateExam(topic: string, grade: string, count = 10) {
    const prompt = `
      Tạo ${count} câu hỏi Toán lớp ${grade}, chủ đề "${topic}".
      ⚠️ KHÔNG DÙNG dấu xuống dòng trong nội dung. Dùng LaTeX bọc trong $...$. Nhân đôi dấu (\\) thành (\\\\).
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
