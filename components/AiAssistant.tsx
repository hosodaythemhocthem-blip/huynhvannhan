
import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  X,
  Sparkles,
  MessageCircle,
  Loader2,
  Paperclip,
  Trash2,
  Clipboard,
  FileText,
  RotateCcw,
} from "lucide-react";
import { askGemini } from "../services/geminiService";
import MathPreview from "./MathPreview";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { supabase } from "../supabase";
import {
  saveChatMessage,
  fetchChatHistory,
  clearChatHistory,
  deleteChatMessage,
  initConversation,
} from "../services/chatService";

// Cấu hình worker cho PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const CHUNK_SIZE = 8000;

const AiAssistant: React.FC<Props> = ({ user, context = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false);

  // Load lịch sử từ Supabase khi mở chat
  useEffect(() => {
    if (isOpen && user.id) {
      const load = async () => {
        await initConversation();
        const history = await fetchChatHistory(user.id);
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          setMessages([
            {
              role: "ai",
              text: `Chào **${user.displayName}**! Tôi là **Lumina AI** ✨. Thầy Nhẫn đã trang bị cho tôi kiến thức sâu rộng để hỗ trợ bạn. Hãy gửi đề bài hoặc file cho tôi nhé!`,
              created_at: new Date().toISOString(),
            },
          ]);
        }
      };
      load();
    }
  }, [isOpen, user.id, user.displayName]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, uploading]);

  const handleDeleteMessage = async (id?: string) => {
    if (!id) return;
    if (confirm("Xóa tin nhắn này vĩnh viễn khỏi lịch sử?")) {
      await deleteChatMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleClear = async () => {
    if (confirm("Xóa toàn bộ hội thoại? Thầy Nhẫn khuyên bạn nên lưu lại các lời giải quan trọng.")) {
      await clearChatHistory(user.id);
      setMessages([]);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(prev => prev + (prev ? "\n" : "") + text);
    } catch (err) {
      alert("Hãy dùng phím Ctrl + V");
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.type === "application/pdf") {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ") + "\n";
      }
      return text;
    }
    if (file.type.includes("wordprocessingml") || file.type.includes("msword")) {
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value;
    }
    return "";
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      alert("File tối đa 15MB");
      return;
    }

    try {
      setUploading(true);
      setFileName(file.name);

      const fullText = await extractTextFromFile(file);
      const userMsg = await saveChatMessage(user.id, "user", `📎 Đã tải lên file: **${file.name}**`);
      if (userMsg) setMessages(prev => [...prev, userMsg]);

      setLoading(true);
      const prompt = `Phân tích tài liệu toán học sau và tóm tắt các yêu cầu chính, sau đó giải chi tiết các bài tập (sử dụng LaTeX $...$): \n\n${fullText.substring(0, CHUNK_SIZE)}`;
      const reply = await askGemini(prompt);
      
      const aiMsg = await saveChatMessage(user.id, "ai", reply || "AI không thể đọc nội dung file này.");
      if (aiMsg) setMessages(prev => [...prev, aiMsg]);

    } catch (err: any) {
      alert("Lỗi xử lý tài liệu: " + err.message);
    } finally {
      setUploading(false);
      setLoading(false);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || sendingRef.current) return;

    sendingRef.current = true;
    setInput("");

    const userMsg = await saveChatMessage(user.id, "user", text);
    if (userMsg) setMessages(prev => [...prev, userMsg]);

    setLoading(true);
    try {
      const finalPrompt = context ? `[NGỮ CẢNH BÀI HỌC: ${context}]\n\nCâu hỏi học sinh: ${text}` : text;
      const reply = await askGemini(finalPrompt);
      const aiMsg = await saveChatMessage(user.id, "ai", reply || "⚠️ Hệ thống đang bận, vui lòng thử lại sau giây lát.");
      if (aiMsg) setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center relative"
        >
          <div className="absolute inset-0 bg-indigo-600 rounded-[2.5rem] animate-ping opacity-10"></div>
          <MessageCircle size={32} />
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full border-4 border-white flex items-center justify-center text-[10px] font-black">AI</span>
        </button>
      ) : (
        <div className="w-[440px] h-[700px] bg-white border border-slate-200 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 duration-500 glass-card">
          <header className="p-8 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles size={24} className="animate-pulse" />
              </div>
              <div>
                <h4 className="font-black text-base tracking-tight">Lumina AI Tutor</h4>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Trợ lý Thầy Nhẫn Pro</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleClear} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-rose-400 transition-all">
                <RotateCcw size={18} />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30 space-y-6">
            {messages.map((msg, index) => (
              <div key={msg.id || index} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`group relative p-5 rounded-[2.2rem] text-sm font-medium shadow-sm max-w-[90%] leading-relaxed
                  ${msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"}`}>
                  {msg.role === "ai" ? <MathPreview content={msg.text} /> : <p className="whitespace-pre-wrap">{msg.text}</p>}
                  <button 
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="absolute -bottom-2 -right-2 p-1.5 bg-white rounded-lg shadow-md text-slate-300 opacity-0 group-hover:opacity-100 transition-all hover:text-rose-500"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 p-4 rounded-[1.5rem] shadow-sm flex items-center gap-2">
                  <Loader2 className="animate-spin text-indigo-600" size={14} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lumina đang xử lý...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-6 bg-white border-t border-slate-100">
            <div className="flex gap-2 items-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100"
                disabled={loading || uploading}
              >
                <Paperclip size={18} />
              </button>
              <div className="flex-1 relative">
                <textarea
                  rows={1}
                  value={input}
                  disabled={loading || uploading}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Hỏi Lumina về bài toán này..."
                  className="w-full py-3 pl-4 pr-10 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-300 resize-none"
                />
                <button onClick={handlePaste} className="absolute right-2 top-2.5 p-1 text-slate-300 hover:text-indigo-500 transition-colors">
                  <Clipboard size={16} />
                </button>
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading || uploading}
                className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                <Send size={18} />
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" hidden onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
