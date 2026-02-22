// services/geminiService.ts
import { GoogleGenAI } from "@google/genai";

/* =========================================================
   🔐 LẤY API KEY CHUẨN VITE (Đã Fix lỗi TypeScript Build)
========================================================= */
// Sử dụng cách ép kiểu an toàn cho TypeScript để Vercel không báo lỗi TS2339
const getApiKey = (): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
  } catch (e) {
    return "";
  }
};

const API_KEY = getApiKey();

if (!API_KEY) {
  console.error("❌ Thiếu VITE_GEMINI_API_KEY trong environment variables");
}

// Khởi tạo AI an toàn
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
    throw new Error("Chưa cấu hình API Key cho Gemini. Vui lòng kiểm tra biến môi trường VITE_GEMINI_API_KEY trên Vercel.");
  }

  const { temperature = 0.7, isJson = false } = options || {};

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt,
      config: { 
        temperature,
        // Ép model trả về JSON chuẩn xác (Chỉ hoạt động tốt trên các model mới)
        ...(isJson ? { responseMimeType: "application/json" } : {}),
      },
    });

    return response.text;
  } catch (error: any) {
    console.error("❌ Lỗi gọi API Gemini:", error);
    throw new Error(`Lỗi kết nối AI: ${error.message || "Không xác định"}`);
  }
};

/* =========================================================
   🧹 HELPER: DỌN DẸP JSON (Siêu Cấp Chống Lỗi)
========================================================= */
const parseSafeJSON = (rawText: string | undefined) => {
  if (!rawText) throw new Error("AI trả về chuỗi rỗng.");
  
  try {
    // 1. Dọn dẹp mạnh tay mọi loại Markdown rác AI thường thêm vào
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```')) {
      // Tìm vị trí xuống dòng đầu tiên (để bỏ qua ```json)
      const firstNewline = cleaned.indexOf('\n');
      if (firstNewline !== -1) {
          cleaned = cleaned.substring(firstNewline + 1);
      }
      // Xóa các backticks còn lại
      cleaned = cleaned.replace(/```/g, "").trim();
    }
    
    // Cố gắng tìm mảng trực tiếp nếu AI vô tình chèn chữ ở ngoài
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }

    // 2. Parse dữ liệu
    const parsed = JSON.parse(cleaned);

    // 3. Auto-Correct: Ép cấu trúc về Array nếu AI lỡ bọc trong Object
    let finalArray = [];
    if (Array.isArray(parsed)) {
        finalArray = parsed;
    } else if (parsed && typeof parsed === 'object') {
        // AI nhét vào Object -> moi mảng ra
        if (Array.isArray(parsed.questions)) finalArray = parsed.questions;
        else if (Array.isArray(parsed.data)) finalArray = parsed.data;
        else if (Array.isArray(parsed.exam)) finalArray = parsed.exam;
        else {
             // Nếu là object mà không có key quen thuộc, lấy array đầu tiên tìm thấy
             const possibleArray = Object.values(parsed).find(val => Array.isArray(val));
             if (possibleArray) finalArray = possibleArray as any[];
        }
    }

    if (finalArray.length === 0) {
         throw new Error("Dữ liệu parse ra trống hoặc không tìm thấy mảng câu hỏi.");
    }

    // 4. Chuẩn hóa Data: Đảm bảo correctAnswer luôn là số (để hàm map bên giao diện không lỗi)
    const sanitizedArray = finalArray.map((item: any) => ({
         question: item.question || "Lỗi đọc câu hỏi",
         options: Array.isArray(item.options) ? item.options : ["A", "B", "C", "D"],
         // Ép về kiểu Number hoặc mặc định là 0
         correctAnswer: typeof item.correctAnswer === 'number' ? item.correctAnswer : (parseInt(item.correctAnswer) || 0),
         explanation: item.explanation || ""
    }));

    return sanitizedArray;

  } catch (error: any) {
    console.error("❌ Lỗi parse JSON từ AI:", error);
    console.error("Dữ liệu thô gây lỗi:", rawText);
    throw new Error("Dữ liệu AI trả về bị sai cấu trúc hoặc không thể xử lý.");
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

    // Prompt siêu khắt khe, áp đặt cấu trúc
    const prompt = `
      Nhiệm vụ: Trích xuất các câu hỏi trắc nghiệm từ văn bản sau thành JSON Array.
      Yêu cầu nghiêm ngặt:
      - KHÔNG bọc trong markdown (không dùng \`\`\`json).
      - CHỈ trả về một mảng bắt đầu bằng [ và kết thúc bằng ].
      - Cấu trúc MỖI câu hỏi phải chính xác như sau:
      {
        "question": "Nội dung câu hỏi",
        "options": ["Đáp án 1", "Đáp án 2", "Đáp án 3", "Đáp án 4"],
        "correctAnswer": 0, // Vị trí index đáp án đúng (0-3)
        "explanation": "Giải thích chi tiết (để rỗng nếu không có)"
      }

      Văn bản cần xử lý:
      """
      ${text}
      """
    `;

    try {
      const raw = await generate(prompt, {
        temperature: 0.1, // Nhiệt độ thấp để AI "ngoan"
        isJson: true,
      });

      return parseSafeJSON(raw);
    } catch (error: any) {
      console.error("❌ Lỗi parseExamWithAI:", error);
      throw new Error(`Lỗi trích xuất đề thi: ${error.message}`);
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
    const prompt = `
      Nhiệm vụ: Tạo ${count} câu hỏi trắc nghiệm môn Toán, lớp ${grade}, chủ đề "${topic}".
      Yêu cầu nghiêm ngặt:
      - KHÔNG dùng markdown.
      - CHỈ trả về mảng JSON [...].
      - Cấu trúc bắt buộc:
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
    } catch (error: any) {
      console.error("❌ Lỗi generateExam:", error);
      throw new Error(`Không thể tạo đề thi: ${error.message}`);
    }
  },
};
