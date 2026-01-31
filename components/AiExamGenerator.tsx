import React, { useState } from "react";
import { Exam, Question, QuestionType } from "../types";
import { GoogleGenAI } from "@google/genai";
import { extractQuestionsFromVisual } from "../services/geminiService";
import { Upload, Sparkles, BrainCircuit, Loader2, Wand2, AlertCircle } from "lucide-react";

interface Props {
  onGenerate: (exam: Exam) => void;
}

const AiExamGenerator: React.FC<Props> = ({ onGenerate }) => {
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState<"10" | "11" | "12">("12");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"topic" | "file">("topic");

  /* =========================================
     XỬ LÝ SINH ĐỀ TỪ CHỦ ĐỀ (TEXT PROMPT)
  ========================================= */
  const handleGenerateFromTopic = async () => {
    if (!topic.trim()) {
      setError("Vui lòng nhập chủ đề Toán");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // Khởi tạo AI Client
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        Bạn là giáo viên Toán THPT Việt Nam chuyên nghiệp. 
        Hãy soạn 1 đề thi Toán lớp ${grade} chuẩn cấu trúc Bộ GD 2025 về chủ đề: "${topic}".
        
        YÊU CẦU ĐẦU RA (JSON FORMAT):
        Trả về 1 JSON Object duy nhất (không bọc trong markdown code block) với cấu trúc sau:
        {
          "title": "Tên đề thi",
          "questions": [
            {
              "id": "q1",
              "type": "multiple_choice",
              "section": 1,
              "text": "Nội dung câu hỏi (dùng LaTeX $...$)",
              "options": ["A", "B", "C", "D"],
              "correctAnswer": 0,
              "points": 0.25
            },
            {
               "id": "q2",
               "type": "true_false",
               "section": 2,
               "text": "Câu hỏi đúng sai",
               "subQuestions": [
                 {"id": "a", "text": "Ý 1", "correctAnswer": true},
                 {"id": "b", "text": "Ý 2", "correctAnswer": false}
               ],
               "points": 1.0
            },
            {
               "id": "q3",
               "type": "short_answer",
               "section": 3,
               "text": "Câu hỏi trả lời ngắn",
               "correctAnswer": "Kết quả",
               "points": 0.5
            }
          ]
        }
        
        Lưu ý:
        - Phần I: Trắc nghiệm (4 phương án).
        - Phần II: Đúng/Sai (4 ý nhỏ).
        - Phần III: Trả lời ngắn.
        - Toán học hiển thị bằng LaTeX đặt trong dấu $.
      `;

      const res = await ai.models.generateContent({
        model: "gemini-1.5-flash", // Sử dụng model ổn định hoặc gemini-1.5-pro
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const jsonStr = res.text || "{}";
      // Clean JSON string đề phòng AI trả về markdown
      const cleanJson = jsonStr.replace(/
