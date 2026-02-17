import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export const geminiService = {
  async analyzeExamText(text: string) {
    const prompt = `
    Phân tích nội dung đề thi sau và trả về JSON dạng:
    [
      {
        "question": "...",
        "type": "mcq | essay",
        "options": [],
        "answer": ""
      }
    ]
    Nội dung:
    ${text}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  },

  async generateExam(topic: string, grade: string) {
    const prompt = `
    Tạo đề thi Toán lớp ${grade} chủ đề ${topic}.
    Trả về JSON.
    `;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  },

  async gradeEssay(question: string, answer: string) {
    const prompt = `
    Chấm bài tự luận.
    Câu hỏi: ${question}
    Bài làm: ${answer}
    Trả về:
    {
      "score": number,
      "feedback": "..."
    }
    `;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  },
};
