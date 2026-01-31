import { GoogleGenAI, Type } from "@google/genai";

/* =====================================================
   ENV – VITE / VERCEL
===================================================== */
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as
  | string
  | undefined;

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
    if (!text) return fallback;
    return JSON.parse(text);
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
          role: "user",
          parts: [
            {
              text: `
Bạn là AI trích xuất đề thi Toán học.
Yêu cầu nghiêm ngặt:
- Chỉ trả về JSON array hợp lệ
- Không markdown, không giải thích
- Mỗi câu hỏi có nội dung LaTeX ($...$)
- Không thêm lời giải
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
        temperature: 0.2,
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
    if (!rawText.trim()) return [];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
Chuyển nội dung sau thành đề thi Toán học.

Yêu cầu:
- Trả về JSON array duy nhất
- Không markdown
- Có LaTeX cho công thức
- Không kèm lời giải

NỘI DUNG:
${rawText}
              `,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
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
    if (!message.trim()) return "";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
Bạn là trợ giảng Toán học THCS & THPT.

Ngữ cảnh: ${context || "Chung"}
Câu hỏi học sinh:
${message}
              `,
            },
          ],
        },
      ],
      config: {
        systemInstruction:
          "Giải thích sư phạm, ngắn gọn, dễ hiểu. Công thức dùng LaTeX.",
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
export const askGemini = async (
  prompt: string
): Promise<string> => {
  return getAiTutorResponse(prompt);
};

/* =====================================================
   SINH ĐỀ CƯƠNG KHÓA HỌC
===================================================== */
export const generateCourseSyllabus = async (
  topic: string
) => {
  try {
    if (!topic.trim()) return {};

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
Bạn là chuyên gia xây dựng chương trình Toán học.
Tạo đề cương cho khóa học: "${topic}"
              `,
            },
          ],
        },
      ],
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
                required: ["title"],
              },
            },
          },
          required: ["title", "lessons"],
        },
        temperature: 0.4,
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
    if (!courseTitle || !lessonTitle) return "";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
Viết bài giảng Toán học.

Khóa: ${courseTitle}
Bài: ${lessonTitle}

Yêu cầu:
- Markdown
- Công thức LaTeX
- Phù hợp LMS
              `,
            },
          ],
        },
      ],
      config: {
        temperature: 0.5,
      },
    });

    return response.text || "";
  } catch (err) {
    console.error("❌ Lesson Content Error:", err);
    return "";
  }
};

/* =====================================================
   SINH QUIZ TRẮC NGHIỆM
===================================================== */
export const generateQuiz = async (
  lessonContent: string
) => {
  try {
    if (!lessonContent.trim()) return [];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
Tạo 5 câu hỏi trắc nghiệm Toán học từ nội dung sau.
Yêu cầu:
- Chỉ trả về JSON array
- Không markdown, không giải thích

NỘI DUNG:
${lessonContent}
              `,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    return safeJSON(response.text, []).map((q: any) => ({
      ...q,
      id: uid(),
      type: "mcq",
    }));
  } catch (err) {
    console.error("❌ Quiz Generation Error:", err);
    return [];
  }
};
