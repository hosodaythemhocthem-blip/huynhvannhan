import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Send, X, Sparkles, MessageCircle, Loader2, Paperclip, 
  Trash2, Clipboard, RotateCcw, Maximize2, Minimize2 
} from "lucide-react";
import { askGemini } from "../services/geminiService";
import MathPreview from "./MathPreview"; // Đảm bảo file này tồn tại để hiện công thức đẹp
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { saveChatMessage, fetchChatHistory, clearChatHistory, deleteChatMessage } from "../services/chatService";
import { motion, AnimatePresence } from "framer-motion";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Message {
  id?: string;
  role: "user" | "ai";
  text: string;
  created_at?: string;
}

interface Props {
  user: { id: string; fullName: string }; // Đổi displayName thành fullName cho khớp types.ts
  context?: string;
}

const AiAssistant: React.FC<Props> = ({ user, context = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Load lịch sử từ Supabase khi mở chat
  useEffect(() => {
    if (isOpen) {
      const loadHistory = async () => {
        const history = await fetchChatHistory(user.id);
        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages([{
            role: "ai",
            text: `Chào Thầy/Em **${user.fullName}**! Tôi là Lumina AI v6.0. Hãy gửi đề toán (Word/PDF) hoặc dán (Ctrl+V) nội dung vào đây, tôi sẽ giải chi tiết với công thức LaTeX siêu đẹp. 🚀`
          }]);
        }
      };
      loadHistory();
    }
  }, [isOpen, user]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(prev => prev + text);
    } catch {
      alert("Hãy sử dụng tổ hợp phím Ctrl + V");
    }
  };

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setIsTyping(true);
    try {
      let text = "";
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ") + "\n";
        }
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      }

      const userMsg = await saveChatMessage(user.id, "user", `📎 File: ${file.name}\n\n${text.substring(0, 500)}...`);
      setMessages(prev => [...prev, userMsg]);

      const aiReply = await askGemini(`Phân tích và giải chi tiết đề toán sau bằng LaTeX:\n${text}`);
      const aiMsg = await saveChatMessage(user.id, "ai", aiReply);
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Lỗi xử lý file:", error);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input;
    setInput("");
    setIsTyping(true);

    const userMsg = await saveChatMessage(user.id, "user", userText);
    setMessages(prev => [...prev, userMsg]);

    try {
      const aiReply = await askGemini(userText);
      const aiMsg = await saveChatMessage(user.id, "ai", aiReply);
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDelete = async (msgId: string) => {
    if (confirm("Xóa tin nhắn này vĩnh viễn?")) {
      const success = await deleteChatMessage(msgId);
      if (success) setMessages(prev => prev.filter(m => m.id !== msgId));
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white border-4 border-white"
          >
            <Sparkles size={28} />
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className={`${isExpanded ? 'w-[80vw] h-[85vh]' : 'w-[400px] h-[600px]'} bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden border border-slate-100`}
          >
            {/* Header VIP */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center animate-pulse">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight uppercase">Lumina AI Elite</h3>
                  <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">v6.0 Powered by Gemini</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button onClick={async () => { if(confirm("Xóa sạch lịch sử?")) { await clearChatHistory(user.id); setMessages([]); }}} className="p-2 hover:bg-rose-500/20 rounded-xl text-rose-400">
                  <RotateCcw size={18} />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group relative`}>
                  <div className={`max-w-[85%] p-4 rounded-[2rem] shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                  }`}>
                    {msg.role === 'ai' ? <MathPreview content={msg.text} /> : <p className="text-sm leading-relaxed">{msg.text}</p>}
                    {msg.id && (
                      <button 
                        onClick={() => handleDelete(msg.id!)}
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1 bg-rose-500 text-white rounded-full shadow-lg transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 p-4 rounded-[2rem] rounded-tl-none shadow-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar Pro */}
            <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
              >
                <Paperclip size={20} />
              </button>
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Hỏi AI hoặc dán đề vào đây..."
                  className="w-full bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[48px] max-h-32 resize-none"
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                />
                <button 
                  onClick={handlePaste}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                  title="Dán từ Clipboard"
                >
                  <Clipboard size={16} />
                </button>
              </div>
              <button 
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-500 disabled:opacity-50 transition-all"
              >
                <Send size={20} />
              </button>
              <input type="file" ref={fileInputRef} hidden accept=".pdf,.doc,.docx" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiAssistant;
