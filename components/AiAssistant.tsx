
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Sparkles, MessageCircle, Info, Loader2 } from 'lucide-react';
import { askGemini } from '../services/geminiService.ts';
import MathPreview from './MathPreview.tsx';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

interface Props {
  context?: string;
}

const AiAssistant: React.FC<Props> = ({ context = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'ai', 
      text: 'Chào bạn! Tôi là Lumina AI. Tôi có thể giúp bạn giải toán, giải thích công thức hoặc soạn lộ trình học tập. Bạn cần giúp gì không?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const reply = await askGemini(userMsg, context);
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: '⚠️ Xin lỗi, hệ thống AI đang bận. Bạn vui lòng thử lại sau nhé.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-indigo-600 text-white rounded-[24px] flex items-center justify-center shadow-2xl shadow-indigo-200 hover:scale-110 hover:-rotate-6 transition-all group"
        >
          <MessageCircle size={28} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      ) : (
        <div className="w-[400px] h-[600px] bg-white rounded-[40px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <header className="p-6 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 rotate-12">
              <Sparkles size={80} />
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div>
                <h4 className="font-black italic text-sm tracking-tight">Lumina AI Tutor</h4>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Online 24/7</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </header>

          {/* Messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'bg-white border border-slate-100 text-slate-800'
                }`}>
                  {msg.role === 'ai' ? (
                    <MathPreview content={msg.text} />
                  ) : (
                    <p className="font-semibold">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-indigo-600" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang tính toán...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 bg-white border-t border-slate-50">
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 focus-within:bg-white transition-all">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Hỏi về đạo hàm, tích phân..." 
                className="flex-1 bg-transparent border-none outline-none px-4 py-2 font-bold text-slate-600 text-sm" 
              />
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                <Send size={16} />
              </button>
            </div>
            {context && (
              <p className="mt-3 text-[9px] font-black text-indigo-400 uppercase tracking-widest text-center truncate">
                Ngữ cảnh: {context}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
