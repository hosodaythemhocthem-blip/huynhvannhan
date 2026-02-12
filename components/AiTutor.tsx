import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Eraser,
  Upload,
  Trash2,
  Download,
} from "lucide-react";
import { askGemini } from "../services/geminiService";
import MathPreview from "./MathPreview";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import { saveAs } from "file-saver";
import { v4 as uuidv4 } from "uuid";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  createdAt: number;
}

const STORAGE_KEY = "lumina_ai_chat";

const AiTutor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: uuidv4(),
            role: "ai",
            content:
              "👋 Xin chào! Tôi là trợ lý AI Toán học (Lumina Tutor).\nBạn có thắc mắc gì về bài học hay cần giải đề không?",
            createdAt: Date.now(),
          },
        ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ==============================
     AUTO SCROLL + SAVE LOCAL
  ============================== */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  /* ==============================
     SEND MESSAGE
  ============================== */

  const handleSend = async (customText?: string) => {
    const text = customText || input.trim();
    if (!text || loading) return;

    setInput("");

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const aiReply = await askGemini(text);

      const aiMessage: ChatMessage = {
        id: uuidv4(),
        role: "ai",
        content: aiReply,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "ai",
          content: "❌ AI đang quá tải. Vui lòng thử lại.",
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ==============================
     DELETE MESSAGE
  ============================== */

  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  /* ==============================
     CLEAR CHAT
  ============================== */

  const handleClearChat = () => {
    if (confirm("Bạn muốn xóa toàn bộ đoạn chat này?")) {
      localStorage.removeItem(STORAGE_KEY);
      setMessages([]);
    }
  };

  /* ==============================
     EXPORT CHAT
  ============================== */

  const exportChat = () => {
    const text = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "lumina-chat.txt");
  };

  /* ==============================
     FILE UPLOAD (PDF + DOCX)
  ============================== */

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let extractedText = "";

    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = async () => {
        const typedArray = new Uint8Array(reader.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          extractedText += content.items.map((item: any) => item.str).join(" ");
        }

        handleSend(extractedText);
      };
      reader.readAsArrayBuffer(file);
    } else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const reader = new FileReader();
      reader.onload = async () => {
        const result = await mammoth.extractRawText({
          arrayBuffer: reader.result as ArrayBuffer,
        });
        extractedText = result.value;
        handleSend(extractedText);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Chỉ hỗ trợ file PDF hoặc DOCX.");
    }
  };

  /* ==============================
     RENDER
  ============================== */

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-white rounded-[32px] border shadow-xl overflow-hidden">

      {/* HEADER */}
      <div className="bg-slate-50 border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="font-black text-lg">Trợ lý AI Toán học</h2>
            <p className="text-xs text-slate-400">Powered by Gemini</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={exportChat} className="p-2 hover:bg-slate-200 rounded-lg">
            <Download size={18} />
          </button>
          <button onClick={handleClearChat} className="p-2 hover:bg-rose-100 rounded-lg">
            <Eraser size={18} />
          </button>
        </div>
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((m) => {
          const isUser = m.role === "user";

          return (
            <div key={m.id} className={`flex gap-4 ${isUser ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isUser ? "bg-indigo-100" : "bg-emerald-100"
              }`}>
                {isUser ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div className="relative group max-w-[80%]">
                <div className={`px-5 py-3 rounded-2xl text-sm shadow ${
                  isUser
                    ? "bg-indigo-600 text-white"
                    : "bg-white border text-slate-700"
                }`}>
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <MathPreview math={m.content} />
                  )}
                </div>

                <button
                  onClick={() => deleteMessage(m.id)}
                  className="absolute -top-2 -right-2 hidden group-hover:block bg-white border p-1 rounded-full shadow"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {loading && <div className="text-slate-400 text-sm">AI đang trả lời...</div>}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="p-4 bg-white border-t">
        <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl">
          <textarea
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập bài toán hoặc tải đề..."
            className="flex-1 bg-transparent outline-none px-3 py-2 resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-white rounded-lg border"
          >
            <Upload size={18} />
          </button>

          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-2 bg-indigo-600 text-white rounded-lg"
          >
            <Send size={18} />
          </button>

          <input
            type="file"
            hidden
            ref={fileInputRef}
            accept=".pdf,.docx"
            onChange={handleFileUpload}
          />
        </div>
      </div>
    </div>
  );
};

export default AiTutor;
