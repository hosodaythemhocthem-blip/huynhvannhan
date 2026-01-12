import React, { useState, useRef, useEffect, useCallback } from "react";
import { getAiTutorResponse } from "../services/geminiService";
import { ChatMessage } from "../types";

interface AiTutorProps {
  context?: string;
}

const AiTutor: React.FC<AiTutorProps> = ({ context }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);

  /* =========================
     AUTO SCROLL (VERCEL SAFE)
  ========================= */
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  /* =========================
     CORE SEND LOGIC (REUSE)
  ========================= */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isSendingRef.current) return;

      isSendingRef.current = true;
      setIsLoading(true);

      const safeContext =
        context && context.trim().length > 0
          ? context
          : "Ngữ cảnh chung của hệ thống giáo dục (LMS).";

      const userMessage: ChatMessage = {
        role: "user",
        text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        const responseText = await getAiTutorResponse(text, safeContext);

        const modelMessage: ChatMessage = {
          role: "model",
          text:
            responseText ||
            "Xin lỗi, tôi chưa thể đưa ra câu trả lời phù hợp.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, modelMessage]);
      } catch (error) {
        console.error("AI Error:", error);

        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text:
              "⚠️ Tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
        isSendingRef.current = false;
      }
    },
    [context]
  );

  /* =========================
     SEND FROM INPUT
  ========================= */
  const handleSend = () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    sendMessage(text);
  };

  /* =========================
     RESET CHAT
  ========================= */
  const handleReset = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* HEADER */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs">
            <i className="fa-solid fa-robot"></i>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-tight">
              Gia sư NexusAI
            </p>
            <p className="text-[10px] text-emerald-600 font-medium">
              Sẵn sàng hỗ trợ
            </p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          title="Xóa lịch sử trò chuyện"
        >
          <i className="fa-solid fa-rotate-right text-xs"></i>
        </button>
      </div>

      {/* MESSAGES */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50"
      >
        {messages.length === 0 && (
          <div className="text-center py-10 px-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <i className="fa-solid fa-comment-dots text-indigo-400 text-2xl"></i>
            </div>
            <p className="text-slate-800 font-semibold text-sm">
              Chào bạn! Tôi là NexusAI.
            </p>
            <p className="text-slate-500 text-xs mt-2 leading-relaxed">
              Bạn có thể hỏi tôi về nội dung bài học, tóm tắt bài hoặc
              giải các bài tập khó.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {["Giải thích khái niệm", "Tóm tắt bài này", "Tạo bài kiểm tra"].map(
                (hint) => (
                  <button
                    key={hint}
                    onClick={() => setInput(hint)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[11px] text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all"
                  >
                    {hint}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none"
                  : "bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
      </div>

      {/* INPUT */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập câu hỏi của bạn..."
            className="flex-1 px-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiTutor;
