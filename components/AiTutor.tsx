import React, { useEffect, useRef, useState } from "react";
import { getAiTutorResponse } from "../services/geminiService";

/* =========================
   KIỂU DỮ LIỆU
========================= */
interface TutorMessage {
  id: number;
  role: "student" | "ai";
  content: string;
}

/* =========================
   COMPONENT AI TUTOR
========================= */
interface AiTutorProps {
  lessonTitle?: string;
  lessonContext?: string;
}

const AiTutor: React.FC<AiTutorProps> = ({
  lessonTitle = "Bài học Toán",
  lessonContext = "",
}) => {
  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: 0,
      role: "ai",
      content: `👋 Chào bạn! Tôi là AI trợ giảng cho "${lessonTitle}". 
Bạn có thể hỏi bất cứ điều gì liên quan đến bài học này.`,
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  /* =========================
     TỰ CUỘN CUỐI CHAT
  ========================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* =========================
     GỬI CÂU HỎI CHO AI
  ========================= */
  const askTutor = async () => {
    if (!input.trim() || loading) return;

    const studentMsg: TutorMessage = {
      id: Date.now(),
      role: "student",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, studentMsg]);
    setInput("");
    setLoading(true);

    try {
      const aiReply = await getAiTutorResponse(
        studentMsg.content,
        lessonContext || lessonTitle
      );

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          content: aiReply,
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "ai",
          content:
            "❌ AI đang gặp sự cố. Bạn vui lòng thử lại sau.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     GIAO DIỆN
  ========================= */
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        overflow: "hidden",
        background: "#ffffff",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: "#020617",
          color: "white",
          padding: 12,
          fontWeight: 800,
        }}
      >
        📘 AI Trợ giảng – {lessonTitle}
      </div>

      {/* CHAT CONTENT */}
      <div
        style={{
          height: 360,
          overflowY: "auto",
          padding: 12,
          background: "#f8fafc",
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              textAlign: m.role === "student" ? "right" : "left",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                display: "inline-block",
                maxWidth: "80%",
                padding: 10,
                borderRadius: 8,
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
                background:
                  m.role === "student"
                    ? "#2563eb"
                    : "#ffffff",
                color:
                  m.role === "student"
                    ? "white"
                    : "#0f172a",
                boxShadow:
                  m.role === "ai"
                    ? "0 2px 6px rgba(0,0,0,0.08)"
                    : "none",
              }}
            >
              {m.content}
            </span>
          </div>
        ))}

        {loading && (
          <p style={{ fontStyle: "italic", color: "#64748b" }}>
            🤔 AI đang phân tích bài học...
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: 10,
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && askTutor()}
          placeholder="Hỏi AI về bài học này..."
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 6,
            border: "1px solid #cbd5e1",
          }}
        />
        <button
          onClick={askTutor}
          disabled={loading}
          style={{
            padding: "0 16px",
            borderRadius: 6,
            border: "none",
            background: "#2563eb",
            color: "white",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Hỏi
        </button>
      </div>
    </div>
  );
};

export default AiTutor;
