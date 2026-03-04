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
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", 
    });

    const generationConfig: any = {
      temperature: temperature,
      topP: 0.8,
      topK: 10,
    };

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
   🛡️ PARSE JSON (ĐÃ SỬA LỖI MẤT ĐÁP ÁN VÀ ÁNH XẠ CHUẨN)
========================================================= */
const parseSafeJSON = (rawText: string | undefined) => {
  if (!rawText) throw new Error("AI trả về chuỗi rỗng.");
  
  try {
    const parsed = JSON.parse(rawText.trim());

    let rawArray: any[] = [];
    if (Array.isArray(parsed)) rawArray = parsed;
    else if (parsed.questions && Array.isArray(parsed.questions)) rawArray = parsed.questions;
    else rawArray = Object.values(parsed).find(v => Array.isArray(v)) || [];

    return rawArray.map((item: any) => {
      // --- FIX ĐÁP ÁN: CHUYỂN MỌI ĐỊNH DẠNG VỀ A, B, C, D ---
      let correct = item.correctAnswer ?? item.correct_answer ?? item.correctOption ?? "A";
      let finalAns = String(correct).toUpperCase().trim();
      
      if (finalAns === "0") finalAns = "A";
      else if (finalAns === "1") finalAns = "B";
      else if (finalAns === "2") finalAns = "C";
      else if (finalAns === "3") finalAns = "D";
      // Đảm bảo chỉ rơi vào A, B, C, D
      if (!["A", "B", "C", "D"].includes(finalAns)) finalAns = "A";

      return {
        type: item.type || "multiple_choice",
        // FIX TÊN BIẾN: Đổi từ question sang content để khớp 100% với StudentQuiz.tsx
        content: item.content || item.question || "Nội dung trống",
        options: Array.isArray(item.options) ? item.options : [],
        correct_option: finalAns, // Trả về biến chuẩn nhất cho frontend
        explanation: item.explanation || ""
      };
    });

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
         [ { "type": "multiple_choice", "content": "...", "options": ["A. ...", "B. ..."], "correctAnswer": "A", "explanation": "..." } ]
      2. correctAnswer BẮT BUỘC phải là một chữ cái: "A", "B", "C" hoặc "D" (TUYỆT ĐỐI KHÔNG DÙNG SỐ 0, 1, 2, 3).
      3. MỌI công thức Toán phải bọc trong $...$ (nếu trong dòng) hoặc $$...$$ (nếu đứng riêng).
      4. LATEX: Giữ nguyên các ký tự gạch chéo ngược chuẩn của LaTeX (ví dụ: \\sqrt, \\frac, \\begin{cases}). Tuyệt đối KHÔNG cần nhân đôi dấu gạch chéo.
      
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
      - Trả về định dạng JSON Array theo schema: [ { "type": "multiple_choice", "content": "...", "options": ["..."], "correctAnswer": "A", "explanation": "..." } ]
      - correctAnswer BẮT BUỘC phải là chữ cái "A", "B", "C" hoặc "D".
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
