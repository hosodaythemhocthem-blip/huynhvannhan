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
      text: 'Hello! I am **Lumina AI** ✨\nHow can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* Auto scroll */
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
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: '⚠️ System busy. Please try again later.' }
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
          className="w-16 h-16 bg-indigo-600 text-white rounded-[24px] flex items-center justify-center shadow-2xl hover:scale-110 transition-all"
        >
          <MessageCircle size={28} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-pulse" />
        </button>
      ) : (
        <div className="w-[380px] h-[550px] bg-white rounded-[32px] shadow-2xl border flex flex-col overflow-hidden">
          
          {/* Header */}
          <header className="p-5 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm">Lumina AI</h4>
                <p className="text-[10px] uppercase opacity-60">Expert Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </header>

          {/* Messages */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border'
                  }`}
                >
                  {msg.role === 'ai'
                    ? <MathPreview content={msg.text} />
                    : <p className="font-semibold">{msg.text}</p>
                  }
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex">
                <div className="bg-white border p-4 rounded-2xl flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-indigo-600" />
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Lumina is thinking...
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl">
              <input
                value={input}
                disabled={loading}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask something..."
                className="flex-1 bg-transparent outline-none px-3 text-sm font-semibold"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-9 h-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>

            {context && (
              <p className="mt-2 text-[9px] text-center uppercase font-bold text-indigo-400 truncate">
                Context: {context}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
