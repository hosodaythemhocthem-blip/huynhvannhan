import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Send,
  X,
  Sparkles,
  MessageCircle,
  Loader2,
  Paperclip,
  Trash2,
  Clipboard,
  RotateCcw,
} from "lucide-react";
import { askGemini } from "../services/geminiService";
import MathPreview from "./MathPreview";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { saveChatMessage, fetchChatHistory, clearChatHistory, deleteChatMessage } from "../services/chatService";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Message {
  id?: string;
  role: "user" | "ai";
  text: string;
  created_at?: string;
}

interface Props {
  user: { id: string; displayName: string };
  context?: string;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const CHUNK_LIMIT = 7000;

const AiAssistant: React.FC<Props> = ({ user, context = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== LOAD HISTORY =====
  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      const history = await fetchChatHistory(user.id);
      setMessages(
        history.length
          ? history
          : [
              {
                role: "ai",
                text: `Chào **${user.displayName}** 👋 Tôi là Lumina AI. Hãy gửi đề toán để tôi giải chi tiết bằng LaTeX.`,
              },
            ]
      );
    };
    load();
  }, [isOpen, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ===== DELETE ONE =====
  const handleDeleteMessage = useCallback(async (id?: string) => {
    if (!id) return;
    if (!confirm("Xóa tin nhắn này?")) return;
    await deleteChatMessage(id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // ===== CLEAR ALL =====
  const handleClear = async () => {
    if (!confirm("Xóa toàn bộ hội thoại?")) return;
    await clearChatHistory(user.id);
    setMessages([]);
  };

  // ===== PASTE =====
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput((prev) => prev + "\n" + text);
    } catch {
      alert("Dùng Ctrl + V để dán nội dung.");
    }
  };

  // ===== FILE PARSER =====
  const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File quá lớn (max 15MB)");
    }

    if (file.type === "application/pdf") {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((i: any) => i.str).join(" ") + "\n";
      }
      return text;
    }

    if (
      file.type.includes("wordprocessingml") ||
      file.type.includes("msword")
    ) {
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value;
    }

    throw new Error("Chỉ hỗ trợ PDF hoặc Word");
  };

  // ===== SEND MESSAGE =====
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setLoading(true);

    const userMsg = await saveChatMessage(user.id, "user", userText);
    if (userMsg) setMessages((prev) => [...prev, userMsg]);

    try {
      const prompt =
        context !== ""
          ? `[BÀI HỌC: ${context}]\n\n${userText}`
          : userText;

      const reply = await askGemini(prompt);

      const aiMsg = await saveChatMessage(
        user.id,
        "ai",
        reply || "⚠️ AI đang bận."
      );
      if (aiMsg) setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  // ===== FILE UPLOAD =====
  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      const text = await extractTextFromFile(file);

      const prompt = `Phân tích đề toán sau và giải chi tiết bằng LaTeX:\n\n${text.substring(
        0,
        CHUNK_LIMIT
      )}`;

      const reply = await askGemini(prompt);

      const userMsg = await saveChatMessage(
        user.id,
        "user",
        `📎 Đã tải file: ${file.name}`
      );
      const aiMsg = await saveChatMessage(
        user.id,
        "ai",
        reply || "Không đọc được nội dung."
      );

      setMessages((prev) => [...prev, userMsg!, aiMsg!]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-20 h-20 rounded-full bg-indigo-600 text-white shadow-xl flex items-center justify-center"
        >
          <MessageCircle size={32} />
        </button>
      ) : (
        <div className="w-[420px] h-[680px] bg-white rounded-3xl shadow-2xl flex flex-col">
          <header className="p-5 bg-slate-900 text-white flex justify-between">
            <span className="font-bold">Lumina AI</span>
            <div className="flex gap-2">
              <button onClick={handleClear}>
                <RotateCcw size={18} />
              </button>
              <button onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, i) => (
              <div key={msg.id || i} className="relative group">
                <div
                  className={`p-4 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white ml-auto"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.role === "ai" ? (
                    <MathPreview content={msg.text} />
                  ) : (
                    msg.text
                  )}
                </div>
                {msg.id && (
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}

            {loading && (
              <Loader2 className="animate-spin text-indigo-600" />
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2"
            >
              <Paperclip size={18} />
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())
              }
              className="flex-1 border rounded-lg p-2 text-sm"
              placeholder="Nhập câu hỏi..."
            />

            <button onClick={handlePaste}>
              <Clipboard size={18} />
            </button>

            <button onClick={handleSend}>
              <Send size={18} />
            </button>

            <input
              type="file"
              hidden
              ref={fileInputRef}
              accept=".pdf,.doc,.docx"
              onChange={(e) =>
                e.target.files && handleFileUpload(e.target.files[0])
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
