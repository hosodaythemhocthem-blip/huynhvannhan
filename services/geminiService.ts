import { GoogleGenAI, Type } from "@google/genai";

/* =====================================================
   API KEY (chuẩn Vite / Vercel)
===================================================== */
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("⚠️ VITE_GEMINI_API_KEY chưa được cấu hình");
}

/* =====================================================
   KHỞI TẠO AI (SINGLETON)
===================================================== */
const ai = new GoogleGenAI({
  apiKey: API_KEY || "",
});

/* =====================================================
   HELPER
===================================================== */
const safeJSON = <T>(text?: string, fallback: T): T => {
  try {
    return JSON.parse(text || "");
  } catch {
    return fallback;
  }
};

const uid = () => crypto.randomUUID();

/* =====================================================
   TRÍCH XUẤT CÂU HỎI TỪ ẢNH
===================================================== */
export const extractQuestionsFromVisual = async (
  base64Image: string,
  mimeType: string
): Promise<any[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: `
Phân tích đề thi Toán từ hình ảnh.
Yêu cầu:
- Trả về JSON array
- Mỗi câu có LaTeX dạng $...$
              `,
            },
            { inlineData: { data: base64Image, mimeType } },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    return safeJSON(response.text, []);
  } catch (error) {
    console.error("AI Visual Extraction Error:", error);
    return [];
  }
};

/* =====================================================
   TRÍCH XUẤT CÂU HỎI TỪ TEXT
===================================================== */
export const extractQuestionsFromText = async (
  rawText: string
): Promise<any[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: `
Chuyển nội dung sau thành đề thi Toán trắc nghiệm.
- JSON array
- Có LaTeX

${rawText}
              `,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    return safeJSON(response.text, []);
  } catch (error) {
    console.error("AI Text Extraction Error:", error);
    return [];
  }
};

/* =====================================================
   AI TRỢ GIẢNG
===================================================== */
export const getAiTutorResponse = async (
  message: string,
  context: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: `
Bạn là trợ lý giảng dạy Toán học.
Ngữ cảnh: ${context || "Chung"}
Câu hỏi học sinh: ${message}
              `,
            },
          ],
        },
      ],
      config: {
        systemInstruction:
          "Giải thích sư phạm, dùng LaTeX cho công thức, ngắn gọn.",
        temperature: 0.7,
      },
    });

    return response.text || "Không thể tạo câu trả lời.";
  } catch (error) {
    console.error("AI Tutor Error:", error);
    return "Hệ thống AI tạm thời không khả dụng.";
  }
};

/* =====================================================
   WRAPPER GIỮ COMPAT
===================================================== */
export async function askGemini(prompt: string): Promise<string> {
  return await getAiTutorResponse(prompt, "");
}

/* =====================================================
   COURSE SYLLABUS
===================================================== */
export const generateCourseSyllabus = async (topic: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
Bạn là chuyên gia xây dựng chương trình Toán học.
Tạo đề cương cho khóa: "${topic}"
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            lessons: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    return safeJSON(response.text, {});
  } catch (err) {
    console.error("Syllabus error:", err);
    return {};
  }
};

/* =====================================================
   SINH BÀI GIẢNG
===================================================== */
export const generateLessonContent = async (
  courseTitle: string,
  lessonTitle: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
Viết bài giảng Toán:
- Khóa: ${courseTitle}
- Bài: ${lessonTitle}

Dùng Markdown + LaTeX.
      `,
    });

    return response.text || "";
  } catch {
    return "";
  }
};

/* =====================================================
   SINH QUIZ
===================================================== */
export const generateQuiz = async (lessonContent: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
Tạo 5 câu trắc nghiệm Toán từ nội dung sau:
${lessonContent}
      `,
      config: {
        responseMimeType: "application/json",
      },
    });

    return safeJSON(response.text, []).map((q: any) => ({
      ...q,
      id: uid(),
      type: "MULTIPLE_CHOICE",
    }));
  } catch {
    return [];
  }
};
