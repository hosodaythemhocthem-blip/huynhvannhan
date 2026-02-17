import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export const geminiService = {
  async askGemini(prompt: string): Promise<string> {
    if (!genAI) return "Chưa cấu hình Gemini API Key.";

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  },
};

export const askGemini = geminiService.askGemini;
