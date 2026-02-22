import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

/* =========================================================
    📦 KHO INTERFACE
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
    🔐 LẤY API KEY AN TOÀN
========================================================= */
const getApiKey = (): string => {
  // Ưu tiên lấy từ Next.js Environment
  const nextKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (nextKey) return nextKey;

  // Lấy từ Vite Environment (nếu dùng Vite)
  const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (viteKey) return viteKey;

  return "";
};

/* =========================================================
    🧠 FACTORY & CACHE MODEL
========================================================= */
const modelCache = new Map<string, GenerativeModel>();

const getModel = (isJson: boolean = false, temperature: number = 0.7): GenerativeModel => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("❌ GEMINI_API_KEY không tồn tại trong file .env");
  }

  const cacheKey = `${isJson ? "json" : "text"}-${temperature}`;
  
  if (modelCache.has(cacheKey)) {
    return modelCache.get(cacheKey)!;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // CẤU HÌNH QUAN TRỌNG: Đảm bảo model ID chuẩn xác để tránh 404
  const modelName = "gemini-1.5-flash"; 

  const model = genAI.getGenerativeModel({
    model: modelName,
  }, {
    // Ép kiểu generationConfig để tránh lỗi truyền trực tiếp vào getGenerativeModel ở một số phiên bản SDK
    apiVersion: "v1beta" 
  });

  // Gán cấu hình trực tiếp vào instance model
  (model as any).generationConfig = {
    temperature,
    ...(isJson ? { responseMimeType: "application/json" } : {}),
  };

  modelCache.set(cacheKey, model);
  return model;
};

/* =========================================================
    🧹 LÀM SẠCH JSON
========================================================= */
const cleanAndParseJSON = <T>(text: string): T => {
  try {
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error("❌ Lỗi parse JSON:", text);
    throw new Error("Dữ liệu AI trả về không đúng định dạng JSON.");
  }
};

/* =========================================================
    🔁 AUTO RETRY
========================================================= */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const withRetry = async <T>(fn: () => Promise<T>, retries = 2, delayMs = 1500): Promise<T> => {
  try {
    return await fn();
  } catch (err: any) {
    if (retries <= 0) throw err;
    console.warn(`⚠️ Đang thử lại... (Còn ${retries} lần)`);
    await delay(delayMs);
    return await withRetry(fn, retries - 1, delayMs * 2); 
  }
};

/* =========================================================
    🚀 GEMINI MAIN SERVICE
========================================================= */
export const geminiService = {
  
  // 1. Đọc và phân tích đề thi từ văn bản
  async parseExamWithAI(text: string): Promise<ParsedExam | null> {
    if (!text.trim()) return null;
    const model = getModel(true, 0.1);

    const prompt = `Bạn là chuyên gia giáo dục. Trích xuất nội dung sau thành JSON:
    {
      "title": "Tên đề",
      "description": "Mô tả",
      "questions": [
        {
          "text": "Câu hỏi",
          "type": "multiple_choice",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "Nội dung đáp án đúng",
          "explanation": "Giải thích",
          "points": 1
        }
      ]
    }
    Văn bản cần xử lý: \n${text}`;

    const result = await withRetry(() => model.generateContent(prompt));
    return cleanAndParseJSON<ParsedExam>(result.response.text());
  },

  // 2. Tạo đề thi mới theo chủ đề
  async generateExam(topic: string, grade: string, count = 10): Promise<ExamQuestion[]> {
    const model = getModel(true, 0.8);
    const prompt = `Tạo mảng JSON gồm ${count} câu hỏi trắc nghiệm Toán lớp ${grade} về "${topic}". 
    Mỗi câu có: text, type, options (mảng 4 câu), correctAnswer (text), explanation, points.`;

    const result = await withRetry(() => model.generateContent(prompt));
    return cleanAndParseJSON<ExamQuestion[]>(result.response.text());
  },

  // 3. Chấm điểm bài làm
  async gradeEssay(question: string, userAnswer: string): Promise<GradeResult> {
    const model = getModel(true, 0.3);
    const prompt = `Chấm điểm bài làm sau trên thang 10. Trả về JSON: {score, feedback, suggestions}.
    Đề bài: ${question}
    Bài làm: ${userAnswer}`;

    try {
      const result = await withRetry(() => model.generateContent(prompt));
      return cleanAndParseJSON<GradeResult>(result.response.text());
    } catch (error) {
      return { score: 0, feedback: "Lỗi kết nối AI.", suggestions: "Thử lại sau." };
    }
  },

  // 4. Chat tự do
  async chatWithAI(prompt: string): Promise<string> {
    const model = getModel(false, 0.7);
    try {
      const result = await withRetry(() => model.generateContent(prompt));
      return result.response.text();
    } catch (error) {
      return "AI đang bận, bạn thử lại sau nhé!";
    }
  }
};
