import { GoogleGenAI } from "@google/genai";

/* =========================
   KHỞI TẠO AI
========================= */
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY không tồn tại trong biến môi trường.");
  }
  return new GoogleGenAI({ apiKey });
};

/* =========================
   TRÍCH XUẤT CÂU HỎI TỪ ẢNH
========================= */
export const extractQuestionsFromVisual = async (
  base64Image: string,
  mimeType: string
): Promise<any[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: "Phân tích đề thi Toán và trả về JSON array các câu hỏi chứa công thức LaTeX dạng $...$.",
            },
            { inlineData: { data: base64Image, mimeType } },
          ],
        },
      ],
      config: { responseMimeType: "application/json" },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Visual Extraction Error:", error);
    return [];
  }
};

/* =========================
   TRÍCH XUẤT CÂU HỎI TỪ TEXT
========================= */
export const extractQuestionsFromText = async (
  rawText: string
): Promise<any[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: `Chuyển nội dung sau sang định dạng JSON đề thi trắc nghiệm Toán học với LaTeX: ${rawText}`,
            },
          ],
        },
      ],
      config: { responseMimeType: "application/json" },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Text Extraction Error:", error);
    return [];
  }
};

/* =========================
   AI TRỢ GIẢNG TOÁN
========================= */
export const getAiTutorResponse = async (
  message: string,
  context: string
): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: `Bạn là trợ lý giảng dạy toán học thông minh.
Ngữ cảnh bài học: ${context || "Chung"}.
Giải đáp câu hỏi của học sinh: ${message}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction:
          "Sử dụng LaTeX cho công thức toán học. Trả lời ngắn gọn, sư phạm.",
        temperature: 0.7,
      },
    });

    return response.text || "Không thể tạo câu trả lời.";
  } catch (error) {
    console.error("AI Tutor Response Error:", error);
    return "Hệ thống AI hiện chưa sẵn sàng.";
  }
};

/* =========================
   WRAPPER – BẮT BUỘC
   (để AiAssistant.tsx không lỗi)
========================= */
export async function askGemini(prompt: string): Promise<string> {
  return await getAiTutorResponse(prompt, "");
}
