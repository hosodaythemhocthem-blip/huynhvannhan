import React, { useEffect, useRef, useState } from "react";
import { askGemini } from "../services/geminiService";

/* =========================
   KIỂU DỮ LIỆU
========================= */
type Role = "user" | "ai";

interface Message {
  id: number;
  role: Role;
  content: string;
}

/* =========================
   COMPONENT AI ASSISTANT
========================= */
const AiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "ai",
      content:
        "👋 Chào bạn! Tôi là trợ lý AI Toán học. Hãy nhập câu hỏi Toán (giải bài, công thức, chứng minh…).",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  /* =========================
     TỰ CUỘN CUỐI
  ========================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* =========================
     GỬI CÂU HỎI
  ========================= */
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const aiReply = await askGemini(userMessage.content);

      const aiMessage: Message = {
        id: Date.now() + 1,
        role: "ai",
        content: aiReply,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "ai",
          content: "❌ Có lỗi xảy ra. Bạn thử lại sau nhé.",
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
        display: "flex",
        flexDirection: "column",
        height: "100%",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        background: "#ffffff",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: 12,
          fontWeight: 800,
          background: "#0f172a",
          color: "white",
        }}
      >
        🤖 AI Toán học
      </div>

      {/* CHAT */}
      <div
        style={{
          flex: 1,
          padding: 14,
          overflowY: "auto",
          background: "#f8fafc",
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              marginBottom: 10,
              display: "flex",
              justifyContent:
                msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "75%",
                padding: 10,
                borderRadius: 8,
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
                background:
                  msg.role === "user" ? "#2563eb" : "#ffffff",
                color: msg.role === "user" ? "white" : "#0f172a",
                boxShadow:
                  msg.role === "ai"
                    ? "0 2px 6px rgba(0,0,0,0.08)"
                    : "none",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <p style={{ fontStyle: "italic", color: "#64748b" }}>
            🤔 AI đang xử lý...
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div
        style={{
          display: "flex",
          padding: 10,
          borderTop: "1px solid #e5e7eb",
          gap: 8,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Nhập câu hỏi Toán..."
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 6,
            border: "1px solid #cbd5e1",
          }}
        />

        <button
          onClick={sendMessage}
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
          Gửi
        </button>
      </div>
    </div>
  );
};

export default AiAssistant;
