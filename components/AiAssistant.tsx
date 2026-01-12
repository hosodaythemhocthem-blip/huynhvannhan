import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "../types";
import { getAiTutorResponse } from "../services/geminiService";
import MathPreview from "./MathPreview";

interface AiAssistantProps {
  currentContext: string;
  triggerPrompt?: string;
}

const AiAssistant: React.FC<AiAssistantProps> = ({
  currentContext,
  triggerPrompt,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text:
        "Chào bạn! Tôi là trợ lý EduFlex. Bạn có thể hỏi tôi về bài học, bài tập, điểm số hoặc nội dung đang xem.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastAutoPromptRef = useRef<string | null>(null);

  /* ===============================
     AUTO SCROLL (SAFE FOR VERCEL)
  =============================== */
  useEffect(() => {
    if (!isOpen || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  /* ===============================
     HANDLE AUTO PROMPT TỪ BÊN NGOÀI
  =============================== */
  useEffect(() => {
    if (!triggerPrompt) return;
    if (triggerPrompt === lastAutoPromptRef.current) return;

    lastAutoPromptRef.current = triggerPrompt;
    setIsOpen(true);
    handleSendMessage(triggerPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerPrompt]);

  /* ===============================
     CORE SEND LOGIC (REUSE)
  =============================== */
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const safeContext =
        currentContext?.trim().length > 0
          ? currentContext
          : "Ngữ cảnh chung của hệ thống giáo dục (LMS).";

      const userMsg: ChatMessage = {
        role: "user",
        text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const aiResponse = await getAiTutorResponse(text, safeContext);
        const modelMsg: ChatMessage = {
          role: "model",
          text: aiResponse || "Xin lỗi, tôi chưa thể trả lời câu hỏi này.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, modelMsg]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: "⚠️ Có lỗi khi kết nối AI. Vui lòng thử lại.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentContext, isLoading]
  );

  /* ===============================
     SEND FROM INPUT
  =============================== */
  const handleSend = () => {
    handleSendMessage(input);
    setInput("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200]">
      {isOpen && (
        <div className="bg-white w-[350px] sm:w-[450px] h-[600px] shadow-2xl rounded-[32px] border border-slate-100 flex flex-col mb-4 animate-in slide-in-from-bottom-5 duration-300">
          {/* HEADER */}
          <div className="p-6 bg-slate-900 rounded-t-[32px] flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                🤖
              </div>
              <div className="text-white">
                <p className="font-black text-xs uppercase tracking-widest">
                  Trợ lý EduFlex AI
                </p>
                <p className="text-[10px] opacity-60 font-bold">
                  Hỗ trợ học tập 24/7
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* MESSAGES */}
          <div
            ref={scrollRef}
            className="flex-grow p-6 overflow-y-auto space-y-6 bg-slate-50/30"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[90%] p-4 rounded-3xl text-sm shadow-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-white text-slate-700 rounded-tl-none border"
                  }`}
                >
                  <MathPreview math={msg.text} />
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-3xl rounded-tl-none border shadow-sm flex gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                </div>
              </div>
            )}
          </div>

          {/* INPUT */}
          <div className="p-6 border-t flex gap-3 bg-white rounded-b-[32px]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Hỏi trợ lý AI..."
              className="flex-grow bg-slate-50 rounded-2xl px-6 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="p-3 bg-slate-900 text-white rounded-2xl disabled:opacity-50"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* FLOATING BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-slate-900 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all"
      >
        💬
      </button>
    </div>
  );
};

export default AiAssistant;
