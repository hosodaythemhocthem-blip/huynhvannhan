import { GoogleGenerativeAI } from "@google/generative-ai";

/* =========================================================
    🔐 CẤU HÌNH API KEY 
========================================================= */
const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/* =========================================================
    🧠 GỌI MODEL THẾ HỆ MỚI 
========================================================= */
const generate = async (prompt: string, temperature = 0.1, isJsonMode = false) => {
  if (!genAI) throw new Error("Chưa cấu hình API Key cho Gemini.");

  try {
    // SỬ DỤNG MODEL CHUẨN: gemini-1.5-flash (Tuyệt đối không dùng 2.5 vì sẽ báo 404)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", 
    });

    const generationConfig: any = {
      temperature: temperature,
      topP: 0.8,
      topK: 10,
    };

    // BẬT CHẾ ĐỘ ÉP KHUÔN JSON TỪ LÕI API CỦA GOOGLE
    if (isJsonMode) {
      generationConfig.responseMimeType = "application/json";
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: generationConfig
    });
    
    return result.response.text();
  } catch (error: any) {
    console.error("❌ Lỗi gọi API Gemini:", error);
    throw new Error(`Lỗi kết nối AI: ${error.message}`);
  }
};

/* =========================================================
    🛡️ PARSE JSON (ĐÃ CLEAN ĐỂ KHÔNG LÀM HỎNG CÔNG THỨC TOÁN)
========================================================= */
const parseSafeJSON = (rawText: string | undefined) => {
  if (!rawText) throw new Error("AI trả về chuỗi rỗng.");
  
  try {
    // Đã bỏ dòng regex tự động nhân đôi dấu gạch chéo vì JSON Mode đã xử lý an toàn
    // Giữ nguyên bản gốc để bảo toàn công thức LaTeX (\frac, \sqrt...)
    const parsed = JSON.parse(rawText.trim());

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
    throw new Error("Không thể đọc được dữ liệu do AI trả về. Thầy/Cô vui lòng ấn tạo lại nhé.");
  }
};

/* =========================================================
    🚀 EXPORT SERVICE
========================================================= */
export const geminiService = {
  async parseExamWithAI(text: string) {
    if (!text.trim()) return null;

    const prompt = `
      Nhiệm vụ: Trích xuất câu hỏi từ đề thi dưới đây và trả về định dạng JSON Array.
      
      ⚠️ QUY TẮC:
      1. TRẢ VỀ ĐÚNG ĐỊNH DẠNG MẢNG JSON SCHEMA SAU:
         [ { "type": "multiple_choice", "question": "...", "options": ["A. ...", "B. ..."], "correctAnswer": 0, "explanation": "..." } ]
      2. MỌI công thức Toán phải bọc trong $...$ (nếu trong dòng) hoặc $$...$$ (nếu đứng riêng).
      3. LATEX: Giữ nguyên các ký tự gạch chéo ngược chuẩn của LaTeX (ví dụ: \\sqrt, \\frac, \\begin{cases}). Tuyệt đối KHÔNG cần nhân đôi dấu gạch chéo.
      
      VĂN BẢN ĐỀ THI:
      ${text}
    `;

    const raw = await generate(prompt, 0.1, true);
    return parseSafeJSON(raw);
  },

  async generateExam(topic: string, grade: string, count = 10) {
    const prompt = `
      Tạo ${count} câu hỏi Toán lớp ${grade}, chủ đề "${topic}".
      
      ⚠️ QUY TẮC BẮT BUỘC: 
      - Trả về định dạng JSON Array theo schema: [ { "type": "multiple_choice", "question": "...", "options": ["..."], "correctAnswer": 0, "explanation": "..." } ]
      - MỌI công thức Toán phải bọc trong $...$ hoặc $$...$$.
      - Cú pháp LaTeX phải chuẩn (ví dụ: \\sqrt, \\frac).
    `;

    const raw = await generate(prompt, 0.7, true);
    return parseSafeJSON(raw);
  },

  async chatWithAI(prompt: string): Promise<string> {
    const result = await generate(prompt, 0.7);
    return result || "AI không phản hồi.";
  }
};
