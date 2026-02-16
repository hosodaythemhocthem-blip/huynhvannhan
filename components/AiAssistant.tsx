import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Send, X, Sparkles, MessageCircle, Loader2, Paperclip, 
  Trash2, Clipboard, RotateCcw, Maximize2, Minimize2, Bot, User 
} from "lucide-react";
import { askGemini } from "../services/geminiService";
import MathPreview from "./MathPreview";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { supabase } from "../supabase";
import { motion, AnimatePresence } from "framer-motion";

// Khắc phục lỗi Build cho Framer Motion trên Vercel
const MotionDiv = motion.div as any;

interface Message {
  id?: string;
  role: "user" | "ai";
  text: string;
  created_at?: string;
}

interface Props {
  user: { id: string; fullName: string };
  context?: string;
}

const AiAssistant: React.FC<Props> = ({ user, context = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Tải lịch sử chat vĩnh viễn từ Supabase
  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
    }
  }, [isOpen]);

  const loadChatHistory = async () => {
    const { data, error } = await (supabase.from('messages') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(scrollToBottom, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Gửi lên Gemini AI
      const aiResponse = await askGemini(input, context);
      const aiMsg: Message = { role: "ai", text: aiResponse };
      
      // Lưu vĩnh viễn vào Supabase
      await (supabase.from('messages') as any).insert([
        { user_id: user.id, role: 'user', text: input },
        { user_id: user.id, role: 'ai', text: aiResponse }
      ]);

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", text: "Xin lỗi Thầy Nhẫn, AI đang bận xử lý. Thầy thử lại nhé!" }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(prev => prev + text);
    } catch (err) {
      console.error("Lỗi dán nội dung");
    }
  };

  const handleClearChat = async () => {
    if (confirm("Thầy muốn xóa sạch lịch sử chat vĩnh viễn?")) {
      await (supabase.from('messages') as any).delete().eq('user_id', user.id);
      setMessages([]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      let text = "";
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ") + " ";
        }
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      }
      setInput(`Phân tích file này giúp tôi: ${text.substring(0, 2000)}...`);
    } catch (err) {
      alert("Không thể đọc file này!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999]">
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] shadow-2xl flex items-center justify-center border-2 border-indigo-500/20"
          >
            <Sparkles size={28} className="text-indigo-400" />
          </motion.button>
        ) : (
          <MotionDiv
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className={`bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col overflow-hidden transition-all duration-500 ${isExpanded ? 'w-[80vw] h-[80vh]' : 'w-[400px] h-[600px]'}`}
          >
            {/* Header Trợ Lý */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest italic">Lumina AI v6.0</h3>
                  <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-tight">Trợ lý của Thầy Nhẫn</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button onClick={handleClearChat} className="p-2 hover:bg-rose-500/20 text-rose-300 rounded-lg transition-colors">
                  <RotateCcw size={18} />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400">
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Khung Chat */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 scrollbar-hide">
              {messages.length === 0 && (
                <div className="text-center py-20">
                  <Sparkles className="mx-auto text-indigo-200 mb-4" size={48} />
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Hệ thống vĩnh viễn đã sẵn sàng</p>
                  <p className="text-slate-800 font-black italic mt-2">Chào Thầy Nhẫn, hôm nay Thầy cần hỗ trợ gì?</p>
                </div>
              )}
              
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                  <div className={`max-w-[85%] p-5 rounded-[1.8rem] shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>
                    <div className="flex items-center gap-2 mb-2 opacity-50 font-black text-[9px] uppercase tracking-widest">
                      {msg.role === 'user' ? <User size={10}/> : <Bot size={10}/>} {msg.role === 'user' ? user.fullName : 'Lumina AI'}
                    </div>
                    <MathPreview content={msg.text} className="text-sm leading-relaxed font-bold" />
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white p-5 rounded-[1.8rem] shadow-sm border border-slate-100 flex gap-2 items-center">
                    <Loader2 size={16} className="animate-spin text-indigo-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang giải mã...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Chat */}
            <div className="p-6 bg-white border-t border-slate-100">
              <div className="relative group">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Dán đề hoặc hỏi AI tại đây..."
                  className="w-full bg-slate-50 border-none rounded-[1.5rem] pl-6 pr-32 py-4 font-bold text-slate-700 text-sm focus:ring-4 focus:ring-indigo-100 transition-all min-h-[60px] max-h-32 resize-none"
                />
                <div className="absolute right-3 bottom-3 flex gap-1">
                  <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-300 hover:text-indigo-600 transition-all" title="Đính kèm file">
                    <Paperclip size={18} />
                  </button>
                  <button onClick={handlePaste} className="p-3 text-slate-300 hover:text-indigo-600 transition-all" title="Dán (Ctrl+V)">
                    <Clipboard size={18} />
                  </button>
                  <button onClick={handleSend} disabled={!input.trim() || loading} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-slate-900 transition-all disabled:opacity-30">
                    <Send size={18} />
                  </button>
                </div>
              </div>
              <input type="file" ref={fileInputRef} hidden accept=".pdf,.doc,.docx" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} />
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiAssistant;
