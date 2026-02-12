// components/AiAssistant.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  X,
  Sparkles,
  MessageCircle,
  Loader2,
  Paperclip,
  Trash2,
  RotateCcw
} from "lucide-react";
import { askGemini } from "../services/geminiService";
import MathPreview from "./MathPreview";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { supabase } from "../supabase";
import {
  saveMessage,
  fetchMessages,
  clearMessages,
  deleteMessage,
  initConversation,
  getConversationId
} from "../services/chatService";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Message {
  id?: string;
  role: "user" | "ai";
  text: string;
}

interface Props {
  context?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const CHUNK_SIZE = 6000;

const AiAssistant: React.FC<Props> = ({ context = "" }) => {

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendingRef = useRef(false);

  /* INIT */
  useEffect(() => {
    const load = async () => {
      await initConversation();
      const data = await fetchMessages(50);

      if (data.length) {
        setMessages(data);
      } else {
        setMessages([
          {
            role: "ai",
            text: "Xin chào! Tôi là **Lumina AI** ✨\nTôi có thể giúp gì cho bạn?"
          }
        ]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* DELETE */
  const handleDeleteMessage = async (id?: string) => {
    if (!id) return;
    await deleteMessage(id);
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  /* CLEAR */
  const handleClear = async () => {
    await clearMessages();
    setMessages([]);
  };

  /* FILE TEXT */
  const extractText = async (file: File): Promise<string> => {

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File quá lớn (tối đa 10MB)");
    }

    let text = "";

    if (file.type === "application/pdf") {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

      const pages = await Promise.all(
        Array.from({ length: pdf.numPages }, (_, i) => pdf.getPage(i + 1))
      );

      const pageTexts = await Promise.all(
        pages.map(async page => {
          const content = await page.getTextContent();
          return content.items.map((item: any) => item.str).join(" ");
        })
      );

      text = pageTexts.join("\n");
    }

    else if (file.type.includes("wordprocessingml")) {
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      text = result.value;
    }

    else {
      throw new Error("Chỉ hỗ trợ PDF hoặc DOCX");
    }

    return text;
  };

  const splitChunks = (text: string) => {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      chunks.push(text.slice(i, i + CHUNK_SIZE));
    }
    return chunks;
  };

  /* UPLOAD FILE TO STORAGE */
  const uploadToStorage = async (file: File) => {

    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error("Chưa đăng nhập");

    const path = `ai_uploads/${user.data.user.id}/${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from("exam-files")
      .upload(path, file);

    if (error) throw error;

    return path;
  };

  /* HANDLE FILE */
  const handleFileUpload = async (file: File) => {

    setUploading(true);
    setFileName(file.name);

    try {

      const storagePath = await uploadToStorage(file);
      const fullText = await extractText(file);
      const chunks = splitChunks(fullText);

      const replies = await Promise.all(
        chunks.map(chunk =>
          askGemini(`Phân tích và giải chi tiết đề sau:\n\n${chunk}`)
        )
      );

      const finalAnswer = replies.join("\n");

      const newMessages: Message[] = [
        { role: "user", text: `📎 ${file.name}` },
        { role: "ai", text: finalAnswer || "AI không trả lời." }
      ];

      setMessages(prev => [...prev, ...newMessages]);

      await Promise.all(
        newMessages.map(m => saveMessage(m.role, m.text))
      );

    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  /* SEND */
  const handleSend = async () => {

    if (!input.trim() || loading || sendingRef.current) return;

    sendingRef.current = true;

    const userMsg = input.trim();
    setInput("");

    const userMessage: Message = { role: "user", text: userMsg };
    setMessages(prev => [...prev, userMessage]);
    await saveMessage("user", userMsg);

    setLoading(true);

    try {

      const finalPrompt = context
        ? `Ngữ cảnh: ${context}\n\nCâu hỏi: ${userMsg}`
        : userMsg;

      const reply = await askGemini(finalPrompt);

      const aiMessage: Message = {
        role: "ai",
        text: reply || "⚠️ AI không trả lời."
      };

      setMessages(prev => [...prev, aiMessage]);
      await saveMessage("ai", aiMessage.text);

    } catch {
      alert("AI lỗi. Thử lại.");
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  };

  const handleRetry = async () => {
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (!lastUser) return;
    setInput(lastUser.text);
    await handleSend();
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">

      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-indigo-600 text-white rounded-3xl shadow-xl hover:scale-110 transition"
        >
          <MessageCircle size={28} />
        </button>
      ) : (
        <div className="w-[380px] h-[620px] bg-white rounded-3xl shadow-2xl flex flex-col">

          <header className="p-5 bg-slate-900 text-white flex justify-between items-center rounded-t-3xl">
            <div className="flex items-center gap-3">
              <Sparkles size={20} />
              <h4 className="font-bold text-sm">Lumina AI Tutor</h4>
            </div>

            <div className="flex gap-3">
              <button onClick={handleRetry}><RotateCcw size={18} /></button>
              <button onClick={handleClear}><Trash2 size={18} /></button>
              <button onClick={() => setIsOpen(false)}><X size={18} /></button>
            </div>
          </header>

          <div className="flex-1 p-5 overflow-y-auto bg-slate-50 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id || Math.random()}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`p-4 rounded-2xl text-sm shadow-sm relative group
                  ${msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-white border"}`}>

                  {msg.role === "ai"
                    ? <MathPreview math={msg.text} />
                    : <p className="whitespace-pre-wrap">{msg.text}</p>}

                  {msg.id && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {(loading || uploading) &&
              <Loader2 className="animate-spin text-indigo-600" />
            }

            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t flex gap-2">

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 bg-slate-200 rounded-xl hover:bg-slate-300 transition"
            >
              <Paperclip size={16} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              hidden
              onChange={(e) =>
                e.target.files?.[0] &&
                handleFileUpload(e.target.files[0])
              }
            />

            <input
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Nhập câu hỏi..."
              className="flex-1 border rounded-xl px-4 focus:ring-2 focus:ring-indigo-400"
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-10 h-10 bg-indigo-600 text-white rounded-xl hover:scale-105 transition"
            >
              <Send size={16} />
            </button>
          </div>

          {fileName && (
            <p className="text-[10px] p-2 text-slate-400">
              📎 {fileName}
            </p>
          )}

        </div>
      )}
    </div>
  );
};

export default AiAssistant;
