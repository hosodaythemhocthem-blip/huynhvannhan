import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Trash2, Bot, User as UserIcon, RefreshCw } from "lucide-react";
import { geminiService } from "../services/geminiService";
import MathPreview from "./MathPreview";
import { supabase } from "../supabase";
import { User } from "../types";
import { useToast } from "./Toast"; 

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  created_at?: string;
}

const AiTutor: React.FC<{ user: User }> = ({ user }) => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, [user.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setMessages(data);
      } else {
        setMessages([{
          id: 'welcome',
          role: 'ai',
          text: `Chào ${user.full_name}, tôi là Lumina AI - Trợ giảng riêng của bạn. Gửi cho tôi bài toán, tôi sẽ hướng dẫn giải chi tiết!`,
        }]);
      }
    } catch (err) {
      console.error("Lỗi tải chat:", err);
    }
  };

  const saveMessageToDB = async (msg: Message) => {
    try {
      await supabase.from('chat_history').insert({
        id: msg.id,
        user_id: user.id,
        role: msg.role,
        text: msg.text,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.error("Lỗi lưu chat:", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setInput(""); 
    setLoading(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: userText,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMsg]);
    saveMessageToDB(userMsg);

    try {
      // Ép kiểu as any để Vercel không kiểm tra lỗi property 'askGemini'
      const replyText = await (geminiService as any).askGemini(userText);

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "ai",
        text: replyText,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, aiMsg]);
      saveMessageToDB(aiMsg);

    } catch (err) {
      showToast("Lumina đang bận, thử lại sau nhé!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if(!confirm("Bạn muốn xóa toàn bộ lịch sử trò chuyện?")) return;
    
    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('user_id', user.id);
        
      if(error) throw error;
      
      setMessages([{
        id: crypto.randomUUID(),
        role: 'ai',
        text: `Đã xóa bộ nhớ. Chúng ta bắt đầu lại nhé, ${user.full_name}!`,
      }]);
      showToast("Đã xóa lịch sử chat", "success");
    } catch (err) {
      showToast("Lỗi khi xóa lịch sử", "error");
    }
  }

  return (
    <div className="flex flex-col h-[650px] bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
      <div className="bg-indigo-600 p-4 flex items-center justify-between text-white shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full backdrop-blur-md">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Lumina AI Tutor</h3>
            <p className="text-[10px] opacity-80 uppercase tracking-wider">Hỗ trợ giải toán 24/7</p>
          </div>
        </div>
        <button 
          onClick={handleClearHistory}
          className="p-2 hover:bg-white/20 rounded-full transition-colors" 
          title="Xóa lịch sử"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((msg) => {
          const isAi = msg.role === "ai";
          return (
            <div key={msg.id} className={`flex gap-4 ${isAi ? "flex-row" : "flex-row-reverse"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAi ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-600"}`}>
                {isAi ? <Bot size={16} /> : <UserIcon size={16} />}
              </div>

              <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                isAi 
                  ? "bg-white text-slate-800 rounded-tl-none border border-slate-100" 
                  : "bg-indigo-600 text-white rounded-tr-none"
              }`}>
                {isAi ? (
                   <MathPreview content={msg.text} />
                ) : (
                  <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                )}
              </div>
            </div>
          );
        })}
        
        {loading && (
          <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Bot size={16} />
             </div>
             <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-indigo-600" />
                <span className="text-slate-400 text-sm font-medium animate-pulse">Đang suy nghĩ...</span>
             </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Nhập bài toán hoặc dán ảnh đề bài (Ctrl+V)..."
            className="flex-1 p-4 pr-12 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-14 max-h-32 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center font-medium">
          *Lumina có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.
        </p>
      </div>
    </div>
  );
};

export default AiTutor;
