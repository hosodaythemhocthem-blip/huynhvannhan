import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Eraser } from "lucide-react";
import { askGemini } from "../services/geminiService";
import MathPreview from "./MathPreview";

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
        "👋 Xin chào! Tôi là trợ lý AI Toán học (Lumina Tutor).\nBạn có thắc mắc gì về bài học hay cần giải đề không?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Ref để tự động cuộn xuống cuối
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    // Thêm tin nhắn User
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userText },
    ]);

    setLoading(true);

    try {
      const aiReply = await askGemini(userText);

      setMessages((prev) => [
        ...prev,
        { role: "ai", content: aiReply },
      ]);
    } catch (err: unknown) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "❌ Xin lỗi, hệ thống AI đang quá tải hoặc gặp sự cố. Vui lòng thử lại sau.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm("Bạn muốn xóa toàn bộ đoạn chat này?")) {
      setMessages([
        {
          role: "ai",
          content: "🧹 Đã làm mới cuộc trò chuyện. Bạn cần giúp gì tiếp theo?",
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
      {/* HEADER */}
      <div className="bg-slate-50/80 backdrop-blur border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="font-black text-lg text-slate-800">
              Trợ lý AI Toán học
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Powered by Google Gemini
            </p>
          </div>
        </div>
        <button
          onClick={handleClearChat}
          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
          title="Xóa đoạn chat"
        >
          <Eraser size={18} />
        </button>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 scroll-smooth">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div
              key={`${m.role}-${idx}`}
              className={`flex gap-4 ${
                isUser ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isUser
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-emerald-100 text-emerald-600"
                }`}
              >
                {isUser ? <User size={16} /> : <Bot size={16} />}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[80%] px-5 py-3.5 rounded-2xl text-sm shadow-sm leading-relaxed ${
                  isUser
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-white border border-slate-200 text-slate-700 rounded-tl-none"
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap font-medium">
                    {m.content}
                  </p>
                ) : (
                  <MathPreview math={m.content} />
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-slate-200 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
              <span
                className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-white border-t">
        <div className="relative flex items-end gap-2 bg-slate-100 p-2 rounded-2xl focus-within:border-indigo-200 focus-within:bg-white transition-all">
          <textarea
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập bài toán hoặc câu hỏi..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none px-3 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 resize-none max-h-32 min-h-[44px]"
            onInput={(e) => {
              e.currentTarget.style.height = "auto";
              e.currentTarget.style.height =
                e.currentTarget.scrollHeight + "px";
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
            disabled={loading || !input.trim()}
            className="mb-1 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-200"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">
          AI có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.
        </p>
      </div>
    </div>
  );
};

export default AiTutor;
