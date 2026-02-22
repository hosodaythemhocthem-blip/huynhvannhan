// services/geminiService.ts
import { GoogleGenAI } from "@google/genai";

/* =========================================================
   🔐 LẤY API KEY CHUẨN VITE (Đã Fix lỗi Vercel)
========================================================= */
// Dùng @ts-ignore để ép Vercel bỏ qua lỗi kiểm tra type của Vite
// @ts-ignore
const API_KEY = import.meta.env?.VITE_GEMINI_API_KEY || "";

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
        // Ép model trả về JSON chuẩn xác
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
      const firstNewline = cleaned.indexOf('\n');
      if (firstNewline !== -1) {
          cleaned = cleaned.substring(firstNewline + 1);
      }
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
        if (Array.isArray(parsed.questions)) finalArray = parsed.questions;
        else if (Array.isArray(parsed.data)) finalArray = parsed.data;
        else if (Array.isArray(parsed.exam)) finalArray = parsed.exam;
        else {
             const possibleArray = Object.values(parsed).find(val => Array.isArray(val));
             if (possibleArray) finalArray = possibleArray as any[];
        }
    }

    if (finalArray.length === 0) {
         throw new Error("Dữ liệu parse ra trống hoặc không tìm thấy mảng câu hỏi.");
    }

    // 4. Chuẩn hóa Data: Đảm bảo correctAnswer luôn là số
    const sanitizedArray = finalArray.map((item: any) => ({
         question: item.question || "Lỗi đọc câu hỏi",
         options: Array.isArray(item.options) ? item.options : ["A", "B", "C", "D"],
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

    const prompt = `
      Nhiệm vụ: Trích xuất các câu hỏi trắc nghiệm từ văn bản sau thành JSON Array.
      
      YÊU CẦU NGHIÊM NGẶT VỀ ĐỊNH DẠNG TOÁN HỌC:
      - TẤT CẢ các công thức toán học, phương trình, hệ phương trình, phân số, số mũ, căn bậc, hoặc ký hiệu toán học đặc biệt PHẢI được chuyển đổi sang định dạng chuẩn LaTeX.
      - PHẢI bọc các công thức LaTeX đó trong cặp dấu $ (Ví dụ: $2x^2 + 3y = 0$, $\\frac{1}{2}$).
      - TUYỆT ĐỐI KHÔNG giữ nguyên các ký tự bị lỗi font (ví dụ: ≡, ) mà phải dịch nó thành công thức LaTeX tương ứng dựa trên ngữ cảnh toán học.
      
      Yêu cầu về cấu trúc JSON:
      - KHÔNG bọc trong markdown (không dùng \`\`\`json).
      - CHỈ trả về một mảng bắt đầu bằng [ và kết thúc bằng ].
      - Cấu trúc MỖI câu hỏi phải chính xác như sau:
      {
        "question": "Nội dung câu hỏi chứa LaTeX nếu có, ví dụ: Giải phương trình $x^2 - 4 = 0$",
        "options": ["Đáp án 1 có thể chứa LaTeX", "Đáp án 2", "Đáp án 3", "Đáp án 4"],
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
        temperature: 0.1, 
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
      
      YÊU CẦU NGHIÊM NGẶT VỀ ĐỊNH DẠNG TOÁN HỌC:
      - TẤT CẢ các công thức toán học PHẢI được viết bằng LaTeX chuẩn và bọc trong cặp dấu $.
      - Ví dụ: Thay vì viết "x mũ 2 cộng y", phải viết là "$x^2 + y$". Thay vì "căn bậc 2 của 4", viết là "$\\sqrt{4}$".

      Yêu cầu về cấu trúc JSON:
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
