import React, { useState } from "react";
import { askGemini } from "../services/geminiService";

/* =========================
   KIỂU DỮ LIỆU
========================= */
interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

/* =========================
   COMPONENT
========================= */
const AiTutor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      content:
        "👋 Xin chào! Tôi là trợ lý AI Toán học. Bạn hãy nhập câu hỏi nhé.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const aiReply = await askGemini(input);
      const aiMsg: ChatMessage = {
        role: "ai",
        content: aiReply,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "❌ Xin lỗi, hệ thống AI đang gặp sự cố.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 800,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <h2 style={{ fontSize: 22, fontWeight: 900 }}>
        🤖 Trợ lý AI Toán học
      </h2>

      {/* CHAT BOX */}
      <div
        style={{
          flex: 1,
          marginTop: 16,
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: 12,
          overflowY: "auto",
          background: "#f8fafc",
        }}
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: 10,
              textAlign: m.role === "user" ? "right" : "left",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: 10,
                maxWidth: "80%",
                background:
                  m.role === "user"
                    ? "#2563eb"
                    : "#e5e7eb",
                color:
                  m.role === "user"
                    ? "white"
                    : "#111827",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <p style={{ color: "#64748b" }}>
            ⏳ AI đang suy nghĩ...
          </p>
        )}
      </div>

      {/* INPUT */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: 8,
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập câu hỏi Toán học..."
          rows={2}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #cbd5e1",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            padding: "0 16px",
            borderRadius: 8,
            border: "none",
            background: "#16a34a",
            color: "white",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Gửi
        </button>
      </div>
    </div>
  );
};

export default AiTutor;
