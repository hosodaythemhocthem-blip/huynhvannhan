import { GoogleGenAI } from "@google/genai";

/* =========================================================
   🔐 LẤY API KEY CHUẨN VITE
========================================================= */
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
   🧹 HELPER: DỌN DẸP JSON (BẢN NÂNG CẤP CHỐNG SẬP)
========================================================= */
const parseSafeJSON = (rawText: string | undefined) => {
  if (!rawText) throw new Error("AI trả về chuỗi rỗng.");
  
  try {
    // 1. Dọn dẹp sạch sẽ markdown rác (```json ... ```)
    let cleaned = rawText.trim();
    
    // Dùng Regex xóa các block markdown ở đầu và cuối chuỗi
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');

    // Cố gắng tìm mảng array trực tiếp bằng indexOf/lastIndexOf
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }

    // 2. Parse dữ liệu sang Object
    const parsed = JSON.parse(cleaned);

    // 3. Ép cấu trúc về Array nếu AI lỡ bọc trong Object linh tinh
    let finalArray: any[] = [];
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

    // 4. Chuẩn hóa Data cho "AZOTA MODE" (Hỗ trợ nhiều dạng câu hỏi)
    const sanitizedArray = finalArray.map((item: any) => {
        // Nhận diện kiểu câu hỏi, mặc định là trắc nghiệm
        const type = item.type || "multiple_choice"; 
        
        let sanitizedItem = {
            type: type,
            question: item.question || "Lỗi đọc nội dung câu hỏi",
            options: Array.isArray(item.options) ? item.options : [],
            correctAnswer: item.correctAnswer, 
            explanation: item.explanation || ""
        };

        // Nếu là trắc nghiệm hoặc đúng/sai, ép correctAnswer về định dạng số (index)
        if (type === "multiple_choice" || type === "true_false") {
            sanitizedItem.correctAnswer = typeof item.correctAnswer === 'number' 
                ? item.correctAnswer 
                : (parseInt(item.correctAnswer) || 0);
        }
        
        // Đảm bảo đủ 4 đáp án cho dạng trắc nghiệm nếu AI trả thiếu
        if (type === "multiple_choice" && sanitizedItem.options.length === 0) {
             sanitizedItem.options = ["A", "B", "C", "D"];
        }

        return sanitizedItem;
    });

    return sanitizedArray;

  } catch (error: any) {
    console.error("❌ Lỗi parse JSON từ AI:", error);
    console.error("Dữ liệu thô gây lỗi:\n", rawText);
    throw new Error("Dữ liệu AI trả về bị sai cấu trúc hoặc không thể xử lý.");
  }
};

/* =========================================================
   🚀 SERVICE CHÍNH
========================================================= */
export const geminiService = {
  /* ------------------------------------------------------
     1️⃣ Phân tích đề thi (Azota Style: Trắc nghiệm, Đúng/Sai, Điền khuyết)
  ------------------------------------------------------ */
  async parseExamWithAI(text: string) {
    if (!text.trim()) return null;

    const prompt = `
      Nhiệm vụ: Đóng vai một chuyên gia giáo dục. Hãy trích xuất các câu hỏi từ văn bản đề thi dưới đây thành một mảng JSON Array duy nhất.
      
      PHÂN LOẠI CÂU HỎI (QUAN TRỌNG):
      Bạn phải tự nhận diện câu hỏi thuộc 1 trong 3 loại sau và gán vào trường "type":
      1. "multiple_choice": Câu hỏi trắc nghiệm thông thường (có A, B, C, D).
      2. "true_false": Câu hỏi trắc nghiệm Đúng/Sai (Chỉ có 2 đáp án: Đúng, Sai).
      3. "short_answer": Câu hỏi tự luận ngắn / Điền khuyết (Không có các đáp án lựa chọn).
      
      YÊU CẦU NGHIÊM NGẶT VỀ ĐỊNH DẠNG TOÁN HỌC:
      - TẤT CẢ các công thức toán học, phương trình, hệ phương trình, phân số, số mũ, căn bậc, hoặc ký hiệu toán học đặc biệt PHẢI được chuyển đổi sang định dạng chuẩn LaTeX.
      - PHẢI bọc các công thức LaTeX đó trong cặp dấu $ (Ví dụ: $2x^2 + 3y = 0$, $\\frac{1}{2}$).
      - TUYỆT ĐỐI KHÔNG giữ nguyên các ký tự bị lỗi font mà phải dịch nó thành công thức LaTeX tương ứng.
      
      Yêu cầu về cấu trúc JSON (BẮT BUỘC):
      - KHÔNG bọc trong thẻ code markdown (không dùng \`\`\`json).
      - CHỈ trả về mảng bắt đầu bằng [ và kết thúc bằng ].
      - Cấu trúc MỖI câu hỏi phải chính xác như sau:
      {
        "type": "multiple_choice" hoặc "true_false" hoặc "short_answer",
        "question": "Nội dung câu hỏi chứa LaTeX nếu có, ví dụ: Giải phương trình $x^2 - 4 = 0$",
        "options": ["Đáp án 1", "Đáp án 2"...], // Nếu type là short_answer, hãy để mảng rỗng []
        "correctAnswer": 0, // Vị trí index đáp án đúng (dành cho multiple_choice/true_false). NẾU là short_answer, hãy để chuỗi chứa đáp án đúng (ví dụ: "x = 2"). Nếu không rõ đáp án, để rỗng.
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
     3️⃣ Tạo đề thi tự động
  ------------------------------------------------------ */
  async generateExam(topic: string, grade: string, count = 10) {
    const prompt = `
      Nhiệm vụ: Tạo ${count} câu hỏi môn Toán, lớp ${grade}, chủ đề "${topic}".
      Hỗn hợp các loại câu hỏi: Ưu tiên khoảng 70% trắc nghiệm (multiple_choice), 20% đúng/sai (true_false), 10% điền khuyết (short_answer).
      
      YÊU CẦU NGHIÊM NGẶT VỀ ĐỊNH DẠNG TOÁN HỌC:
      - TẤT CẢ công thức toán học PHẢI viết bằng LaTeX chuẩn và bọc trong cặp dấu $.
      - Ví dụ: Thay vì viết "x mũ 2 cộng y", phải viết là "$x^2 + y$".

      Yêu cầu về cấu trúc JSON:
      - KHÔNG dùng markdown. CHỈ trả về mảng JSON [...].
      - Cấu trúc bắt buộc cho mỗi Object trong mảng:
      {
        "type": "multiple_choice", // hoặc "true_false", "short_answer"
        "question": "...",
        "options": ["...", "...", "...", "..."], // Rỗng [] nếu là short_answer
        "correctAnswer": 0, // Số nguyên nếu là trắc nghiệm/đúng sai. Chuỗi chữ nếu là short_answer.
        "explanation": "..."
      }
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
