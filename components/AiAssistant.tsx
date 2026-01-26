import React, { useEffect, useRef, useState } from "react";
import { askGemini } from "../services/geminiService";

/* =========================
   1. KIỂU DỮ LIỆU
========================= */

interface Message {
  id: number;
  role: "user" | "ai";
  content: string;
}

/* =========================
   2. COMPONENT CHÍNH
========================= */

const AiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "ai",
      content:
        "👋 Chào bạn! Tôi là trợ lý AI Toán học. Bạn có thể hỏi về giải bài, công thức, chứng minh, hoặc mẹo làm bài.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  /* =========================
     2.1 TỰ ĐỘNG CUỘN CUỐI CHAT
  ========================= */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* =========================
     2.2 GỬI CÂU HỎI CHO AI
  ========================= */

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // 🔹 Context Toán học rõ ràng – tránh trả lời lan man
      const prompt = `
Bạn là trợ lý AI Toán học cho học sinh và giáo viên Việt Nam.
- Trả lời NGẮN GỌN, RÕ RÀNG, đúng trọng tâm
- Ưu tiên trình bày từng bước
- Dùng ký hiệu Toán học chuẩn (LaTeX khi cần)
- Không nói lan man, không nội dung ngoài Toán

Câu hỏi:
${userMsg.content}
      `;

      const aiText = await askGemini(prompt);

      const aiMsg: Message = {
        id: Date.now() + 1,
        role: "ai",
        content: aiText,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "ai",
          content: "❌ Xin lỗi, AI đang bận. Bạn thử lại sau nhé.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     3. GIAO DIỆN
  ========================= */

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {/* ===== HEADER ===== */}
      <div
        style={{
          padding: 14,
          fontWeight: 800,
          background: "#0f172a",
          color: "white",
        }}
      >
        🤖 Trợ lý AI Toán học
      </div>

      {/* ===== NỘI DUNG CHAT ===== */}
      <div
        style={{
          flex: 1,
          padding: 16,
          overflowY: "auto",
          background: "#f8fafc",
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              marginBottom: 12,
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "75%",
                padding: 12,
                borderRadius: 10,
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
                background:
                  m.role === "user" ? "#2563eb" : "white",
                color: m.role === "user" ? "white" : "#0f172a",
                boxShadow:
                  m.role === "ai"
                    ? "0 2px 6px rgba(0,0,0,0.08)"
                    : "none",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <p style={{ fontStyle: "italic", color: "#64748b" }}>
            🤔 AI đang suy nghĩ...
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ===== INPUT ===== */}
      <div
        style={{
          display: "flex",
          padding: 12,
          borderTop: "1px solid #e5e7eb",
          gap: 8,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Nhập câu hỏi Toán học..."
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #cbd5f5",
            outline: "none",
          }}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            padding: "0 18px",
            borderRadius: 8,
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
