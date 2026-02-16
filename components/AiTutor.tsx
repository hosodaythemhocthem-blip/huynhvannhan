
import React, { useState, useRef, useEffect } from "react";
import { 
  Send, Sparkles, Loader2, Paperclip, Trash2, 
  Clipboard, RotateCcw, Copy, Download, User, Bot, 
  PlusCircle, MessageSquare, FileText, ChevronRight
} from "lucide-react";
import { askGemini } from "../services/geminiService";
import MathPreview from "./MathPreview";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { supabase } from "../supabase";

// Worker PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  created_at: string;
}

const AiTutor: React.FC<{ user: { id: string, fullName: string } }> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Tải lịch sử chat vĩnh viễn từ Supabase
  useEffect(() => {
    const loadHistory = async () => {
      const { data } = await supabase.from('messages').select();
      if (data) {
        const history = (data as ChatMessage[])
          .filter(m => (m as any).user_id === user.id)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages([{
            id: 'welcome',
            role: 'ai',
            text: `Chào **${user.fullName}**, tôi là Lumina - Gia sư AI của Thầy Nhẫn. Hãy bắt đầu bằng cách gửi câu hỏi hoặc tải lên một đề thi (Word/PDF) nhé!`,
            created_at: new Date().toISOString()
          }]);
        }
      }
    };
    loadHistory();
  }, [user.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 2. Xử lý dán văn bản (Ctrl + V)
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(prev => prev + (prev ? "\n" : "") + text);
    } catch (err) {
      alert("Hãy sử dụng tổ hợp phím Ctrl + V");
    }
  };

  // 3. Xóa tin nhắn vĩnh viễn
  const deleteMsg = async (id: string) => {
    if (confirm("Xóa tin nhắn này vĩnh viễn khỏi Cloud?")) {
      await supabase.from('messages').delete(id);
      setMessages(prev => prev.filter(m => m.id !== id));
    }
  };

  // 4. Xóa toàn bộ lịch sử
  const clearHistory = async () => {
    if (confirm("Xóa sạch toàn bộ cuộc trò chuyện này?")) {
      const { data } = await supabase.from('messages').select();
      const userMsgs = (data as any[]).filter(m => m.user_id === user.id);
      for (const msg of userMsgs) {
        await supabase.from('messages').delete(msg.id);
      }
      setMessages([]);
    }
  };

  // 5. Giải mã File Word/PDF
  const handleFileUpload = async (file: File) => {
    setIsProcessingFile(true);
    try {
      let text = "";
      if (file.type === "application/pdf") {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ") + "\n";
        }
      } else {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        text = result.value;
      }

      if (text) {
        setInput(`Phân tích và hướng dẫn giải đề sau:\n\n${text.substring(0, 5000)}`);
      }
    } catch (err) {
      alert("Lỗi đọc file: " + err);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // 6. Gửi câu hỏi cho AI
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setInput("");
    setLoading(true);

    const userMsg = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: user.id,
      role: 'user' as const,
      text: userText,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    await supabase.from('messages').insert(userMsg);

    try {
      const reply = await askGemini(`Bạn là trợ lý Lumina AI trong hệ thống LMS của Thầy Nhẫn. Hãy trả lời câu hỏi sau bằng tiếng Việt, sử dụng LaTeX $...$ cho công thức toán:\n\n${userText}`);
      
      const aiMsg = {
        id: Math.random().toString(36).substr(2, 9),
        user_id: user.id,
        role: 'ai' as const,
        text: reply || "Xin lỗi, Lumina đang gặp sự cố kết nối.",
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMsg]);
      await supabase.from('messages').insert(aiMsg);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Sidebar - Chat History List */}
      <div className="hidden xl:flex w-80 bg-white rounded-[3rem] border border-slate-100 flex-col overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-black text-slate-800 tracking-tight">Hội thoại vĩnh viễn</h3>
          <button onClick={clearHistory} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
             <RotateCcw size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-indigo-900 truncate">Hỗ trợ giải Toán {new Date().toLocaleDateString()}</p>
              <p className="text-[10px] text-indigo-400 font-black uppercase">Đang diễn ra</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-[3rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden relative glass-card">
        {/* Chat Header */}
        <header className="p-6 md:p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px]"></div>
          <div className="flex items-center gap-4 relative z-10">
             <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg animate-float">
                <Bot size={28} className="text-white" />
             </div>
             <div>
                <h2 className="text-xl font-black tracking-tight">Lumina AI Tutor</h2>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                   <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Sẵn sàng hỗ trợ Thầy Nhẫn</span>
                </div>
             </div>
          </div>
          <div className="flex gap-3 relative z-10">
             <button className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"><Copy size={18} /></button>
             <button className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"><Download size={18} /></button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 scroll-smooth bg-slate-50/20">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} group`}>
              <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg
                ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'}`}>
                {msg.role === 'user' ? <User size={20} /> : <Sparkles size={20} />}
              </div>
              <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`relative p-6 md:p-8 rounded-[2.5rem] shadow-sm text-sm md:text-base leading-relaxed group-hover:shadow-xl transition-all
                  ${msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>
                  
                  {msg.role === 'ai' ? (
                    <MathPreview content={msg.text} />
                  ) : (
                    <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                  )}

                  <button 
                    onClick={() => deleteMsg(msg.id)}
                    className="absolute -bottom-4 -right-4 p-3 bg-white text-slate-300 hover:text-rose-500 rounded-2xl shadow-lg opacity-0 group-hover:opacity-100 transition-all border border-slate-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <span className="mt-3 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-6 animate-pulse">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={20} />
              </div>
              <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] rounded-tl-none w-48 shadow-sm">
                <div className="h-2 bg-slate-100 rounded-full w-full mb-3"></div>
                <div className="h-2 bg-slate-100 rounded-full w-2/3"></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-6 md:p-10 bg-white border-t border-slate-100">
           <div className="max-w-4xl mx-auto flex items-end gap-4">
              <div className="flex-1 relative group">
                <div className="absolute left-6 bottom-4 flex items-center gap-3">
                   <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                   >
                     {isProcessingFile ? <Loader2 className="animate-spin" size={20} /> : <Paperclip size={20} />}
                   </button>
                   <input 
                      ref={fileInputRef} 
                      type="file" 
                      accept=".pdf,.docx" 
                      hidden 
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} 
                   />
                </div>
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Hỏi Lumina về bài tập Toán hoặc dán đề bài tại đây..."
                  className="w-full pl-20 pr-32 py-5 rounded-[2rem] bg-slate-50 border-none focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 min-h-[64px] max-h-40 resize-none"
                />
                <div className="absolute right-4 bottom-3 flex items-center gap-2">
                   <button onClick={handlePaste} className="p-3 text-slate-300 hover:text-indigo-600 transition-colors" title="Dán (Ctrl+V)">
                      <Clipboard size={18} />
                   </button>
                   <button 
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
                      className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 shadow-xl shadow-indigo-100 transition-all hover:-translate-y-1 active:scale-95"
                   >
                      <Send size={20} />
                   </button>
                </div>
              </div>
           </div>
           <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-6">
             Công nghệ Gemini 3 Flash & Supabase Cloud • Design for Thầy Nhẫn
           </p>
        </div>
      </div>
    </div>
  );
};

export default AiTutor;
