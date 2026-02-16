// components/AiAssistant.tsx
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
  Loader2,
  Paperclip,
  Clipboard,
  RotateCcw,
  Maximize2,
  Minimize2,
  Bot,
  Trash2,
} from "lucide-react";
import { askGemini } from "../services/geminiService";
import MathPreview from "./MathPreview";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Message {
  id: string;
  user_id: string;
  role: "user" | "ai";
  text: string;
  created_at: string;
}

interface Props {
  user: { id: string; fullName: string };
  context?: string;
}

const MotionDiv = motion.div;

const AiAssistant: React.FC<Props> = ({ user, context = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ================= LOAD HISTORY ================= */
  const loadChatHistory = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (!error && data) setMessages(data as Message[]);
  };

  useEffect(() => {
    if (isOpen) loadChatHistory();
  }, [isOpen]);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(scrollToBottom, [messages, loading]);

  /* ================= SEND ================= */
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const cleanInput = input.trim().slice(0, 6000);
    setInput("");
    setLoading(true);

    try {
      const { data: userMsg } = await supabase
        .from("messages")
        .insert({
          user_id: user.id,
          role: "user",
          text: cleanInput,
        })
        .select()
        .single();

      if (userMsg) setMessages((prev) => [...prev, userMsg as Message]);

      const aiResponse = await askGemini(cleanInput, context);

      const { data: aiMsg } = await supabase
        .from("messages")
        .insert({
          user_id: user.id,
          role: "ai",
          text: aiResponse,
        })
        .select()
        .single();

      if (aiMsg) setMessages((prev) => [...prev, aiMsg as Message]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          user_id: user.id,
          role: "ai",
          text: "⚠ Lumina AI đang quá tải. Thầy thử lại nhé.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE SINGLE ================= */
  const deleteMessage = async (id: string) => {
    await supabase.from("messages").delete().eq("id", id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  /* ================= CLEAR ALL ================= */
  const handleClearChat = async () => {
    if (!confirm("Xóa toàn bộ lịch sử?")) return;

    await supabase.from("messages").delete().eq("user_id", user.id);
    setMessages([]);
  };

  /* ================= PASTE ================= */
  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    setInput((prev) => prev + text);
  };

  /* ================= FILE IMPORT ================= */
  const handleFileUpload = async (file: File) => {
    setLoading(true);

    try {
      let text = "";

      if (file.type === "application/pdf") {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ");
        }
      } else {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        text = result.value;
      }

      setInput(`Phân tích đề sau:\n\n${text.slice(0, 5000)}`);
    } catch {
      alert("Không đọc được file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999]">
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-slate-900 text-white rounded-3xl shadow-2xl flex items-center justify-center"
          >
            <Sparkles size={28} className="text-indigo-400" />
          </motion.button>
        ) : (
          <MotionDiv
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            className={`bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-500 ${
              isExpanded ? "w-[80vw] h-[80vh]" : "w-[420px] h-[650px]"
            }`}
          >
            {/* HEADER */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <Bot size={18} />
                <span className="font-bold">Lumina AI</span>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setIsExpanded(!isExpanded)}>
                  {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button onClick={handleClearChat}>
                  <RotateCcw size={18} />
                </button>
                <button onClick={() => setIsOpen(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div className="relative max-w-[85%] p-4 rounded-2xl shadow bg-white border">
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="absolute top-2 right-2 opacity-40 hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>

                    <MathPreview content={msg.text} />
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 size={16} className="animate-spin" />
                  Đang xử lý...
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* INPUT */}
            <div className="p-4 border-t bg-white">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), handleSend())
                }
                className="w-full border rounded-xl p-3 resize-none"
                placeholder="Nhập nội dung..."
              />

              <div className="flex justify-between mt-3">
                <div className="flex gap-3">
                  <button onClick={() => fileInputRef.current?.click()}>
                    <Paperclip size={18} />
                  </button>
                  <button onClick={handlePaste}>
                    <Clipboard size={18} />
                  </button>
                </div>

                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl"
                >
                  <Send size={16} />
                </button>
              </div>

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
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiAssistant;
