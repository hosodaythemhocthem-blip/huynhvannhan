
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { getAiTutorResponse } from '../services/geminiService';
import MathPreview from './MathPreview';

interface AiAssistantProps {
  currentContext: string;
  triggerPrompt?: string; // Prompt gửi tự động từ bên ngoài
}

const AiAssistant: React.FC<AiAssistantProps> = ({ currentContext, triggerPrompt }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Chào bạn! Tôi là trợ lý EduFlex. Bạn cần hỗ trợ gì về bài học hay bài kiểm tra này không?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Xử lý khi có prompt gửi từ bên ngoài (nút Hỏi AI từng câu)
  useEffect(() => {
    if (triggerPrompt) {
      setIsOpen(true);
      handleAutoSend(triggerPrompt);
    }
  }, [triggerPrompt]);

  const handleAutoSend = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg: ChatMessage = { role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const aiResponse = await getAiTutorResponse(text, currentContext);
    const modelMsg: ChatMessage = { role: 'model', text: aiResponse, timestamp: new Date() };
    
    setMessages(prev => [...prev, modelMsg]);
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const aiResponse = await getAiTutorResponse(input, currentContext);
    const modelMsg: ChatMessage = { role: 'model', text: aiResponse, timestamp: new Date() };
    
    setMessages(prev => [...prev, modelMsg]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200]">
      {isOpen && (
        <div className="bg-white w-[350px] sm:w-[450px] h-[600px] shadow-2xl rounded-[32px] border border-slate-100 flex flex-col mb-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-6 bg-slate-900 rounded-t-[32px] flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="text-white">
                <p className="font-black text-xs uppercase tracking-widest">Trợ lý EduFlex AI</p>
                <p className="text-[10px] opacity-60 font-bold">Giải đáp toán học 24/7</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto space-y-6 custom-scrollbar bg-slate-50/30">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-4 rounded-3xl text-sm shadow-sm ${
                  msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                }`}>
                  <MathPreview math={msg.text} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-3xl rounded-tl-none flex gap-1 border border-slate-100 shadow-sm">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 flex gap-3 bg-white rounded-b-[32px]">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Hỏi trợ lý giải toán..."
              className="flex-grow bg-slate-50 border-none rounded-2xl px-6 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading}
              className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-black disabled:opacity-50 shadow-lg transition-all"
            >
              <svg className="w-6 h-6 transform rotate-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-slate-900 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all group relative"
      >
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full border-2 border-white animate-pulse"></div>
        <svg className="w-8 h-8 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    </div>
  );
};

export default AiAssistant;
