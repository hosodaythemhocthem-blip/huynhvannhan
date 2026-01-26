import React, { useState } from "react";
import { Exam, Question, QuestionType } from "@/types";
import { GoogleGenAI } from "@google/genai";

/**
 * AI Exam Generator
 * - Sinh đề Toán THPT chuẩn cấu trúc LMS hiện tại
 * - Không phá hệ thống cũ
 * - Copy dán 1 lần là chạy
 */

interface Props {
  onGenerate: (exam: Exam) => void;
}

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_API_KEY || "",
});

const AiExamGenerator: React.FC<Props> = ({ onGenerate }) => {
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState<"10" | "11" | "12">("12");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Vui lòng nhập chủ đề Toán");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const prompt = `
Bạn là giáo viên Toán THPT Việt Nam.

Hãy sinh 1 đề thi Toán lớp ${grade} theo ĐÚNG CHUẨN BỘ GD.

YÊU CẦU BẮT BUỘC:
- Trả về JSON thuần, KHÔNG markdown
- Công thức Toán dùng LaTeX với $...$
- Mỗi câu có id duy nhất
- Phân đủ 3 phần:
  Phần I: Trắc nghiệm 4 đáp án
  Phần II: Đúng / Sai
  Phần III: Trả lời ngắn

CẤU TRÚC JSON:

{
  "title": "string",
  "questions": [
    {
      "id": "string",
      "type": "mcq" | "tf" | "short",
      "section": 1 | 2 | 3,
      "text": "string",
      "options": ["string"],
      "correctAnswer": number | string | boolean[],
      "points": number
    }
  ]
}

CHỦ ĐỀ: ${topic}
`;

      const res = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
      });

      const rawText = res.response.text();
      const data = JSON.parse(rawText);

      const questions: Question[] = (data.questions || []).map(
        (q: any, index: number) => ({
          id: q.id || `Q${index + 1}`,
          type: q.type as QuestionType,
          section: q.section,
          text: q.text,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          points: q.points ?? 1,
        })
      );

      const exam: Exam = {
        id: `AI_${Date.now()}`,
        title: data.title || `Đề AI – ${topic}`,
        createdAt: new Date().toLocaleDateString("vi-VN"),
        questionCount: questions.length,
        isLocked: false,
        assignedClass: "",
        assignedClassId: "",
        assignedClassIds: [],
        duration: 90,
        maxScore: 10,
        questions,
        scoringConfig: {
          part1Points: 0.25,
          part2Points: 1,
          part3Points: 0.5,
        },
      };

      onGenerate(exam);
    } catch (e) {
      console.error(e);
      setError("AI trả về dữ liệu lỗi hoặc không đúng JSON");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
      <h3 className="font-black text-lg flex items-center gap-2">
        🤖 AI sinh đề thi Toán
      </h3>

      <input
        className="w-full border rounded-xl p-3 text-sm"
        placeholder="VD: Hàm số mũ – Logarit"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />

      <select
        className="w-full border rounded-xl p-3 text-sm"
        value={grade}
        onChange={(e) => setGrade(e.target.value as any)}
      >
        <option value="10">Lớp 10</option>
        <option value="11">Lớp 11</option>
        <option value="12">Lớp 12</option>
      </select>

      {error && (
        <p className="text-red-600 text-sm font-semibold">{error}</p>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-black hover:bg-blue-700 transition disabled:opacity-60"
      >
        {loading ? "🤖 AI đang sinh đề..." : "⚡ Sinh đề bằng AI"}
      </button>
    </div>
  );
};

export default AiExamGenerator;
