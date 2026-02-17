import React, { useState } from "react";
import { geminiService } from "../services/geminiService";

const AiExamGenerator: React.FC = () => {
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("9");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any[]>([]);

  const generate = async () => {
    setLoading(true);
    const data = await geminiService.generateExam(topic, grade);
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow space-y-4">
      <h2 className="font-bold text-lg">🤖 AI Sinh Đề</h2>

      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Chủ đề..."
        className="border p-2 w-full rounded"
      />

      <button
        onClick={generate}
        className="bg-indigo-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Đang tạo..." : "Sinh đề"}
      </button>

      {result.map((q, i) => (
        <div key={i} className="border p-3 rounded bg-gray-50">
          <p>{q.question}</p>
        </div>
      ))}
    </div>
  );
};

export default AiExamGenerator;
