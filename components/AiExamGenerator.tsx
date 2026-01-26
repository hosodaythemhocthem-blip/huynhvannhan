import React, { useState } from "react";
import { Exam, Question } from "@/types";
import { GoogleGenAI } from "@google/genai";

interface Props {
  onGenerate: (exam: Exam) => void;
}

const ai = new GoogleGenAI({
  apiKey: import.meta.env.API_KEY || "",
});

const AiExamGenerator: React.FC<Props> = ({ onGenerate }) => {
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("12");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!topic) {
      setError("Vui lòng nhập chủ đề Toán");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const prompt = `
Bạn là giáo viên Toán THPT Việt Nam.
Hãy sinh 1 đề thi Toán lớp ${grade}.

YÊU CẦU:
- Trả về JSON thuần (không markdown)
- Công thức dùng LaTeX với $...$
- ĐÚNG cấu trúc bên dưới

{
  "title": string,
  "questions": [
    {
      "id": string,
      "type": "mcq" | "tf" | "short",
      "section": 1 | 2 | 3,
      "text": string,
      "options": string[],
      "correctAnswer": number | string | boolean[]
    }
  ]
}

CHỦ ĐỀ: ${topic}
`;

      const res = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
      });

      const raw = res.text || "{}";
      const data = JSON.parse(raw);

      const exam: Exam = {
        id: `AI_${Date.now()}`,
        title: data.title || "Đề thi AI sinh",
        createdAt: new Date().toLocaleDateString("vi-VN"),
        questionCount: data.questions?.length || 0,
        isLocked: false,
        assignedClass: "",
        assignedClassId: "",
        duration: 90,
        maxScore: 10,
        questions: data.questions as Question[],
      };

      onGenerate(exam);
    } catch (err) {
      console.error(err);
      setError("AI trả về dữ liệu lỗi hoặc không đúng JSON");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl p-4 space-y-4">
      <h3 className="font-black text-lg">🤖 AI sinh đề thi Toán</h3>

      <input
        className="w-full border p-2 rounded"
        placeholder="VD: Hàm số mũ – logarit"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />

      <select
        className="w-full border p-2 rounded"
        value={grade}
        onChange={(e) => setGrade(e.target.value)}
      >
        <option value="10">Lớp 10</option>
        <option value="11">Lớp 11</option>
        <option value="12">Lớp 12</option>
      </select>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded font-bold"
      >
        {loading ? "Đang sinh đề..." : "Sinh đề bằng AI"}
      </button>
    </div>
  );
};

export default AiExamGenerator;
