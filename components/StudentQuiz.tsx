// components/StudentQuiz.tsx

import React, { useMemo, useState, memo } from "react";
import { Exam, Question } from "../types";

interface StudentQuizProps {
  exam: Exam;
  questions: Question[];
  onSubmit: (answers: Record<string, string>) => void;
}

const StudentQuiz: React.FC<StudentQuizProps> = ({
  exam,
  questions,
  onSubmit,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const examQuestions = useMemo(() => {
    return questions
      .filter((q) => q.exam_id === exam.id)
      .sort((a, b) => a.order - b.order);
  }, [questions, exam.id]);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">{exam.title}</h2>

      {examQuestions.map((question) => (
        <div key={question.id} className="border p-4 rounded space-y-3">
          <p className="font-medium">
            {question.order}. {question.content}
          </p>

          {question.type === "multiple_choice" &&
            question.options?.map((opt) => (
              <label key={opt} className="block">
                <input
                  type="radio"
                  name={question.id}
                  value={opt}
                  checked={answers[question.id] === opt}
                  onChange={() => handleAnswer(question.id, opt)}
                />
                <span className="ml-2">{opt}</span>
              </label>
            ))}

          {question.type === "true_false" &&
            ["true", "false"].map((val) => (
              <label key={val} className="block">
                <input
                  type="radio"
                  name={question.id}
                  value={val}
                  checked={answers[question.id] === val}
                  onChange={() => handleAnswer(question.id, val)}
                />
                <span className="ml-2">{val}</span>
              </label>
            ))}

          {question.type === "essay" && (
            <textarea
              className="w-full border rounded p-2"
              rows={4}
              value={answers[question.id] || ""}
              onChange={(e) =>
                handleAnswer(question.id, e.target.value)
              }
            />
          )}
        </div>
      ))}

      <button
        onClick={() => onSubmit(answers)}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Nộp bài
      </button>
    </div>
  );
};

export default memo(StudentQuiz);
