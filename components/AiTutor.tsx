import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { askGemini } from "../services/geminiService";
import MathPreview from "./MathPreview";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
}

const AiTutor: React.FC<{ user: { id: string; fullName: string } }> = ({
  user,
}) => {
  const STORAGE_KEY = `ai_chat_${user.id}`;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: `Chào ${user.fullName}, tôi là Lumina AI.`,
        },
      ]);
    }
  }, [STORAGE_KEY, user.fullName]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, STORAGE_KEY]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const reply = await askGemini(input);

    const aiMsg: Message = {
      id: crypto.randomUUID(),
      role: "ai",
      text: reply,
    };

    setMessages((prev) => [...prev, aiMsg]);
    setLoading(false);
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-3xl shadow-xl">
      <div className="p-6 bg-slate-900 text-white flex justify-between">
        <div className="flex items-center gap-2">
          <Sparkles />
          <h2 className="font-bold">Lumina AI Tutor</h2>
        </div>
        <button onClick={clearChat}>
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-white"
              }`}
            >
              {msg.role === "ai" ? (
                <MathPreview content={msg.text} />
              ) : (
                msg.text
              )}
              <button
                onClick={() => deleteMessage(msg.id)}
                className="ml-2 text-xs text-red-400"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
        {loading && <Loader2 className="animate-spin text-indigo-600" />}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-3 bg-slate-100 rounded-xl resize-none"
          placeholder="Nhập câu hỏi..."
        />
        <button
          onClick={handleSend}
          className="p-3 bg-indigo-600 text-white rounded-xl"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default AiTutor;
