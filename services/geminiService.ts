import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

/* =========================================================
   📦 KHO INTERFACE (Định nghĩa kiểu dữ liệu chuẩn)
========================================================= */
export interface GradeResult {
  score: number;
  feedback: string;
  suggestions: string;
}

export interface ExamQuestion {
  text: string;
  type: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
  points: number;
}

export interface ParsedExam {
  title: string;
  description: string;
  questions: ExamQuestion[];
}

/* =========================================================
   🔐 LẤY API KEY AN TOÀN (Hỗ trợ cả Vite & Next.js)
========================================================= */
const getApiKey = (): string => {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_GEMINI_API_KEY) {
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  }
  if (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_GEMINI_API_KEY) {
    return (import.meta as any).env.VITE_GEMINI_API_KEY;
  }
  return "";
};

/* =========================================================
   🧠 FACTORY & CACHE MODEL (Tối ưu RAM, tái sử dụng Model)
========================================================= */
// Dùng Map để lưu lại các model đã khởi tạo theo cấu hình
const modelCache = new Map<string, GenerativeModel>();

const getModel = (isJson: boolean = false, temperature: number = 0.7): GenerativeModel => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("❌ Chưa cấu hình GEMINI API KEY trong file .env");
  }

  // Tạo khóa cache (VD: "json-0.1" hoặc "text-0.7")
  const cacheKey = `${isJson ? "json" : "text"}-${temperature}`;
  
  // Nếu đã khởi tạo model này rồi thì lấy ra dùng luôn (Siêu nhanh)
  if (modelCache.has(cacheKey)) {
    return modelCache.get(cacheKey)!;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Cấu hình linh hoạt
  const config: any = { temperature };
  if (isJson) config.responseMimeType = "application/json";

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // Bản chuẩn ổn định nhất, không bị lỗi 404
    generationConfig: config,
  });

  // Lưu vào cache để dùng cho lần sau
  modelCache.set(cacheKey, model);
  return model;
};

/* =========================================================
   🧹 LÀM SẠCH VÀ ÉP KIỂU JSON CHỐNG LỖI
========================================================= */
const cleanAndParseJSON = <T>(text: string): T => {
  try {
    // Quét sạch mọi thẻ markdown (```json, ```html, ```) bao quanh
    const cleaned = text
      .replace(/```(?:json)?/gi, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error("❌ Lỗi parse JSON từ chuỗi AI trả về:\n", text);
    throw new Error("AI trả về dữ liệu không đúng định dạng JSON chuẩn.");
  }
};

/* =========================================================
   🔁 AUTO RETRY VỚI EXPONENTIAL BACKOFF (Chống lag/Chống spam)
========================================================= */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const withRetry = async <T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 1000 // Chờ 1s rồi mới thử lại
): Promise<T> => {
  try {
    return await fn();
  } catch (err: any) {
    if (retries <= 0) throw err;
    console.warn(`⚠️ Mạng lỗi hoặc AI quá tải. Đang thử lại... (Còn ${retries} lần)`);
    await delay(delayMs);
    // Lần thử lại tiếp theo sẽ đợi lâu hơn (2s, 4s...) để server Google kịp thở
    return await withRetry(fn, retries - 1, delayMs * 2); 
  }
};

/* =========================================================
   🚀 GEMINI MAIN SERVICE
========================================================= */
export const geminiService = {
  
  /* =============================
     1️⃣ Đọc hiểu & Parse đề thi
  ============================== */
  async parseExamWithAI(text: string): Promise<ParsedExam | null> {
    if (!text.trim()) return null;

    // Lấy model cấu hình JSON, temperature thấp (0.1) để AI cực kỳ chuẩn xác
    const model = getModel(true, 0.1);

    const prompt = `
Bạn là chuyên gia giáo dục. Chuyển đổi văn bản thô sau thành JSON chuẩn xác.

Yêu cầu Output JSON:
{
  "title": "Tên đề thi (Trích xuất từ văn bản, mặc định: Đề thi mới)",
  "description": "Mô tả ngắn gọn (nếu có)",
  "questions": [
    {
      "text": "Nội dung câu hỏi",
      "type": "multiple_choice",
      "options": ["Đáp án 1", "Đáp án 2", "Đáp án 3", "Đáp án 4"],
      "correctAnswer": "Nội dung đáp án đúng",
      "explanation": "Lời giải chi tiết (nếu có, nếu không ghi null)",
      "points": 1
    }
  ]
}

QUY TẮC NGHIÊM NGẶT:
1. Xóa tiền tố thừa ở câu hỏi (VD: "Câu 1:", "Bài 2:").
2. Xóa tiền tố thừa ở đáp án (VD: "A.", "B.", "C.").
3. Giữ nguyên công thức toán học LaTeX trong cặp $...$ hoặc $$...$$.
4. Chỉ lấy thông tin có trong văn bản, KHÔNG TỰ BỊA ĐẶT.
5. Chỉ trả về JSON thuần túy, không kèm lời chào.

Văn bản:
"""
${text}
"""`;

    const result = await withRetry(() => model.generateContent(prompt));
    return cleanAndParseJSON<ParsedExam>(result.response.text());
  },

  /* =============================
     2️⃣ Sinh đề thi mới ngẫu nhiên
  ============================== */
  async generateExam(topic: string, grade: string, questionCount = 10): Promise<ExamQuestion[]> {
    // Lấy model cấu hình JSON, temperature cao (0.7) để AI sáng tạo
    const model = getModel(true, 0.7);

    const prompt = `
Đóng vai giáo viên giỏi, tạo một đề thi trắc nghiệm môn Toán lớp ${grade} về chủ đề: "${topic}".
Số lượng: ${questionCount} câu. Yêu cầu độ khó tăng dần.

Output JSON là MẢNG câu hỏi:
[
  {
    "text": "Nội dung câu (dùng LaTeX trong $...$ cho công thức)",
    "type": "multiple_choice",
    "options": ["Tùy chọn 1", "Tùy chọn 2", "Tùy chọn 3", "Tùy chọn 4"],
    "correctAnswer": "Tùy chọn đúng (ghi lại toàn bộ text đáp án đúng)",
    "explanation": "Giải thích bước giải chi tiết",
    "points": 1
  }
]`;

    const result = await withRetry(() => model.generateContent(prompt));
    return cleanAndParseJSON<ExamQuestion[]>(result.response.text());
  },

  /* =============================
     3️⃣ Chấm điểm bài luận/tự luận
  ============================== */
  async gradeEssay(question: string, userAnswer: string): Promise<GradeResult> {
    const model = getModel(true, 0.2);

    const prompt = `
Bạn là giám khảo chấm thi.
Câu hỏi/Đề bài: "${question}"
Bài làm của học sinh: "${userAnswer}"

Hãy chấm điểm công tâm trên thang 10.
Output JSON:
{
  "score": 8.5,
  "feedback": "Nhận xét chi tiết ưu/khuyết điểm",
  "suggestions": "Gợi ý cách làm bài tốt hơn"
}`;

    try {
      const result = await withRetry(() => model.generateContent(prompt));
      return cleanAndParseJSON<GradeResult>(result.response.text());
    } catch (error: any) {
      console.error("Gemini Grade Error:", error);
      return {
        score: 0,
        feedback: "Hệ thống AI đang quá tải, không thể chấm bài lúc này.",
        suggestions: "Vui lòng tải lại trang hoặc thử lại sau ít phút."
      };
    }
  },

  /* =============================
     4️⃣ Chat tự do với Trợ lý
  ============================== */
  async chatWithAI(prompt: string): Promise<string> {
    // Chat thường thì không dùng JSON, temperature = 0.7 để giao tiếp tự nhiên
    const model = getModel(false, 0.7);

    try {
      const result = await withRetry(() => model.generateContent(prompt));
      return result.response.text();
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      return "Xin lỗi bạn, đường truyền đến máy chủ đang gặp sự cố. Bạn nhắn lại sau một lát nhé!";
    }
  }
};
