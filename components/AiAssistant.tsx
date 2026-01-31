import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Sparkles, MessageCircle, Loader2 } from 'lucide-react';
import { askGemini } from '../services/geminiService';
import MathPreview from './MathPreview';

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
      text: 'Xin chào! Tôi là **Lumina AI** ✨\nTôi có thể giúp gì cho bạn về Toán học hôm nay?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Auto scroll xuống cuối khi có tin nhắn mới */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, isOpen]);

  /* Focus input khi mở chat */
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // Nối context an toàn (không phụ thuộc service có hỗ trợ param 2 hay không)
      const finalPrompt = context
        ? `Ngữ cảnh: ${context}\n\nCâu hỏi: ${userMsg}`
        : userMsg;

      const reply = await askGemini(finalPrompt);

      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: '⚠️ Hệ thống đang bận. Vui lòng thử lại sau.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-indigo-600 text-white rounded-[24px] flex items-center justify-center shadow-2xl hover:scale-110 transition-all hover:rotate-3"
          title="Hỏi trợ lý AI"
        >
          <MessageCircle size={28} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-pulse border-2 border-white" />
        </button>
      ) : (
        <div className="w-[380px] h-[600px] max-h-[80vh] bg-white rounded-[32px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          
          {/* Header */}
          <header className="p-5 bg-slate-900 text-white flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-inner border border-white/10">
                <Sparkles size={20} className="text-yellow-300" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Lumina AI Tutor</h4>
                <p className="text-[10px] uppercase opacity-60 font-bold tracking-wider">Trợ lý học tập</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </header>

          {/* Messages */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-slate-50 scroll-smooth">
            {messages.map((msg, i) => (
              <div
                key={`${msg.role}-${i}`}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
                  }`}
                >
                  {msg.role === 'ai' ? (
                    <div className="prose prose-sm max-w-none">
                      <MathPreview math={msg.text} />
                    </div>
                  ) : (
                    <p className="font-semibold whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border p-4 rounded-2xl rounded-bl-none flex items-center gap-3 shadow-sm">
                  <Loader2 size={16} className="animate-spin text-indigo-600" />
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    AI đang suy nghĩ...
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl focus-within:border-indigo-200 focus-within:bg-white transition-all">
              <input
                ref={inputRef}
                value={input}
                disabled={loading}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Nhập câu hỏi Toán học..."
                className="flex-1 bg-transparent outline-none px-4 py-2 text-sm font-semibold text-slate-700 placeholder:text-slate-400"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200"
              >
                <Send size={16} className={loading ? 'opacity-0' : 'opacity-100'} />
                {loading && <Loader2 size={16} className="absolute animate-spin" />}
              </button>
            </div>

            {context && (
              <div className="mt-2 flex items-center justify-center gap-1.5 opacity-60">
                <Bot size={10} className="text-indigo-500" />
                <p className="text-[9px] uppercase font-bold text-indigo-500 truncate max-w-[250px]">
                  Ngữ cảnh: {context}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
