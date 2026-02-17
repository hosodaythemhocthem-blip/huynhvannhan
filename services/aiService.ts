// services/aiService.ts

import { GoogleGenerativeAI } from "@google/generative-ai"

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ""

if (!API_KEY) {
  console.warn("⚠ Missing VITE_GEMINI_API_KEY")
}

const genAI = new GoogleGenerativeAI(API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-pro" })

export const aiService = {
  /* ======================================================
     CHAT AI
  ====================================================== */
  async askGemini(prompt: string): Promise<string> {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error("askGemini error:", error)
      return "AI hiện không phản hồi."
    }
  },

  /* ======================================================
     PHÂN TÍCH ĐỀ THI
  ====================================================== */
  async analyzeExamText(text: string): Promise<string> {
    try {
      const result = await model.generateContent(
        `Phân tích nội dung đề thi sau:\n${text}`
      )
      return result.response.text()
    } catch (error) {
      console.error("analyzeExamText error:", error)
      return "Không thể phân tích đề thi."
    }
  },

  /* ======================================================
     TẠO ĐỀ THI
  ====================================================== */
  async generateExam(topic: string, grade: string): Promise<string> {
    try {
      const result = await model.generateContent(
        `Tạo đề thi môn ${topic} cho lớp ${grade}`
      )
      return result.response.text()
    } catch (error) {
      console.error("generateExam error:", error)
      return "Không thể tạo đề thi."
    }
  },

  /* ======================================================
     CHẤM TỰ LUẬN
  ====================================================== */
  async gradeEssay(
    question: string,
    answer: string
  ): Promise<string> {
    try {
      const result = await model.generateContent(
        `Chấm điểm bài tự luận.\nCâu hỏi: ${question}\nBài làm: ${answer}`
      )
      return result.response.text()
    } catch (error) {
      console.error("gradeEssay error:", error)
      return "Không thể chấm bài."
    }
  },

  /* ======================================================
     PARSE ĐỀ THI SANG JSON
  ====================================================== */
  async parseExamWithAI(text: string): Promise<string> {
    try {
      const result = await model.generateContent(
        `Chuyển đề thi sau thành JSON hợp lệ:\n${text}`
      )
      return result.response.text()
    } catch (error) {
      console.error("parseExamWithAI error:", error)
      return "Không thể chuyển đề thi."
    }
  }
}
