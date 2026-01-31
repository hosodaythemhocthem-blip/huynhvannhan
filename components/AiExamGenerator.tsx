import React, { useState } from "react";
import { Exam, Question, QuestionType } from "../types";
import { GoogleGenAI } from "@google/genai";
import { extractQuestionsFromVisual } from "../services/geminiService";
import {
  Upload,
  Sparkles,
  BrainCircuit,
  Loader2,
  Wand2,
  AlertCircle,
} from "lucide-react";

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
     SINH ĐỀ TỪ CHỦ ĐỀ (TEXT PROMPT)
  ========================================= */
  const handleGenerateFromTopic = async () => {
    if (!topic.trim()) {
      setError("Vui lòng nhập chủ đề Toán");
      return;
    }

    if (!process.env.API_KEY) {
      setError("Thiếu API_KEY cho Gemini (chưa cấu hình môi trường)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.API_KEY,
      });

      const prompt = `
Bạn là giáo viên Toán THPT Việt Nam chuyên nghiệp. 
Hãy soạn 1 đề thi Toán lớp ${grade} chuẩn cấu trúc Bộ GD 2025 về chủ đề: "${topic}".

YÊU CẦU ĐẦU RA:
- Chỉ trả về 1 JSON Object
- KHÔNG markdown
- KHÔNG giải thích

JSON FORMAT:
{
  "title": "Tên đề thi",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "section": 1,
      "text": "Nội dung câu hỏi (LaTeX $...$)",
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
        { "id": "a", "text": "Ý 1", "correctAnswer": true },
        { "id": "b", "text": "Ý 2", "correctAnswer": false }
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
`;

      const res = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        },
      });

      // ====== SANITIZE JSON ======
      const raw = res.text || "{}";
      const clean = raw
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      let parsed: Exam;

      try {
        parsed = JSON.parse(clean);
      } catch {
        throw new Error("AI trả về JSON không hợp lệ");
      }

      // ====== VALIDATE QUESTIONS ======
      const validTypes: QuestionType[] = [
        "multiple_choice",
        "true_false",
        "short_answer",
      ];

      const questions: Question[] = (parsed.questions || []).filter(
        (q: Question) => validTypes.includes(q.type)
      );

      if (!questions.length) {
        throw new Error("Không sinh được câu hỏi hợp lệ");
      }

      onGenerate({
        title: parsed.title || "Đề thi Toán (AI)",
        questions,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể sinh đề từ AI");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     UI
  ========================================= */
  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="text-indigo-600" size={20} />
        <h3 className="font-bold">Sinh đề thi bằng AI</h3>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="VD: Hàm số bậc 3, tích phân, xác suất..."
          className="flex-1 border rounded-xl px-4 py-2 text-sm"
        />
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value as any)}
          className="border rounded-xl px-3 text-sm"
        >
          <option value="10">Lớp 10</option>
          <option value="11">Lớp 11</option>
          <option value="12">Lớp 12</option>
        </select>
      </div>

      <button
        onClick={handleGenerateFromTopic}
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <Wand2 size={18} />
        )}
        Sinh đề thi
      </button>
    </div>
  );
};

export default AiExamGenerator;
