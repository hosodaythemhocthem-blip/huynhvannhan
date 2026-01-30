import { GoogleGenAI, Type } from "@google/genai";

/* =====================================================
   ENV – VITE / VERCEL
===================================================== */
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

if (!API_KEY) {
  console.warn("⚠️ VITE_GEMINI_API_KEY chưa được cấu hình");
}

/* =====================================================
   AI SINGLETON
===================================================== */
const ai = new GoogleGenAI({
  apiKey: API_KEY ?? "",
});

/* =====================================================
   UTILS
===================================================== */
const safeJSON = <T>(text?: string, fallback: T): T => {
  try {
    return JSON.parse(text ?? "");
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
Bạn là AI trích xuất đề thi Toán.
Yêu cầu:
- Chỉ trả về JSON array
- Mỗi câu có nội dung LaTeX ($...$)
- Không giải thích thêm
              `,
            },
            {
              inlineData: {
                data: base64Image,
                mimeType,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    return safeJSON(response.text, []);
  } catch (err) {
    console.error("❌ AI Visual Extraction Error:", err);
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
Chuyển nội dung sau thành đề thi Toán.
Yêu cầu:
- JSON array
- Có LaTeX
- Không thêm lời giải

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
  } catch (err) {
    console.error("❌ AI Text Extraction Error:", err);
    return [];
  }
};

/* =====================================================
   AI TRỢ GIẢNG (TUTOR)
===================================================== */
export const getAiTutorResponse = async (
  message: string,
  context?: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: `
Bạn là trợ giảng Toán học THCS/THPT.
Ngữ cảnh: ${context || "Chung"}
Câu hỏi học sinh: ${message}
              `,
            },
          ],
        },
      ],
      config: {
        systemInstruction:
          "Giải thích sư phạm, rõ ràng, ngắn gọn. Công thức dùng LaTeX.",
        temperature: 0.6,
      },
    });

    return response.text || "Mình chưa trả lời được câu này.";
  } catch (err) {
    console.error("❌ AI Tutor Error:", err);
    return "Hệ thống AI đang bận, vui lòng thử lại sau.";
  }
};

/* =====================================================
   BACKWARD COMPAT
===================================================== */
export const askGemini = async (prompt: string): Promise<string> => {
  return getAiTutorResponse(prompt);
};

/* =====================================================
   SINH ĐỀ CƯƠNG KHÓA HỌC
===================================================== */
export const generateCourseSyllabus = async (topic: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
Bạn là chuyên gia xây dựng chương trình Toán học.
Tạo đề cương cho khóa học: "${topic}"
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
    console.error("❌ Syllabus Error:", err);
    return {};
  }
};

/* =====================================================
   SINH NỘI DUNG BÀI GIẢNG
===================================================== */
export const generateLessonContent = async (
  courseTitle: string,
  lessonTitle: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
Viết bài giảng Toán học.
- Khóa: ${courseTitle}
- Bài: ${lessonTitle}

Yêu cầu:
- Markdown
- Công thức dùng LaTeX
- Phù hợp LMS
      `,
    });

    return response.text || "";
  } catch {
    return "";
  }
};

/* =====================================================
   SINH QUIZ TRẮC NGHIỆM
===================================================== */
export const generateQuiz = async (lessonContent: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
Tạo 5 câu hỏi trắc nghiệm Toán từ nội dung sau.
Chỉ trả về JSON array.

${lessonContent}
      `,
      config: {
        responseMimeType: "application/json",
      },
    });

    return safeJSON(response.text, []).map((q: any) => ({
      ...q,
      id: uid(),
      type: "mcq",
    }));
  } catch {
    return [];
  }
};
